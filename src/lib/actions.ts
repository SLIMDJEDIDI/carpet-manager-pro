"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// UTILS
async function logActivity(action: string, details: string, metadata?: any) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        details,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

// ORDER ACTIONS
export async function createOrder(formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const customerPostalCode = formData.get("customerPostalCode") as string;
  const customerGovernorate = formData.get("customerGovernorate") as string;
  const customerDelegation = formData.get("customerDelegation") as string;
  const itemCountStr = formData.get("itemCount") as string;
  const itemCount = parseInt(itemCountStr || "0");

  if (!customerName || !customerPhone || itemCount === 0) {
    return { success: false, error: "Missing required customer or article information" };
  }

  try {
    // 1. Pre-fetch all data in one go
    const productIds = [];
    const designIds = [];
    for (let i = 0; i < itemCount; i++) {
      const pid = formData.get(`productId_${i}`) as string;
      const did = formData.get(`designId_${i}`) as string;
      if (pid) productIds.push(pid);
      if (did) designIds.push(did);
    }
    
    const [products, designs] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      prisma.design.findMany({ where: { id: { in: designIds } } })
    ]);

    const productMap = new Map(products.map(p => [p.id, p]));
    const designMap = new Map(designs.map(d => [d.id, d]));

    // 2. Sequential Creation (No Transaction Lock to prevent Vercel 10s timeout)
    const lastOrder = await prisma.order.findFirst({
      orderBy: { reference: 'desc' },
      select: { reference: true }
    });
    const nextReference = (lastOrder?.reference || 0) + 1;

    // Create Order First
    const order = await prisma.order.create({
      data: {
        customerName, customerPhone, customerAddress, 
        customerPostalCode, customerGovernorate, customerDelegation,
        reference: nextReference, totalAmount: 0,
      },
    });

    let orderTotal = 0;

    // Create Items Sequentially
    for (let i = 0; i < itemCount; i++) {
      const brandId = formData.get(`brandId_${i}`) as string;
      const designId = formData.get(`designId_${i}`) as string;
      const productId = formData.get(`productId_${i}`) as string;
      
      if (!brandId || !designId || !productId) continue;
      const product = productMap.get(productId);
      if (!product) continue;

      orderTotal += product.price;

      // Create main item
      const mainItem = await prisma.orderItem.create({
        data: {
          orderId: order.id, brandId, designId,
          size: product.size, price: product.price,
          isPack: product.isPack,
          status: product.isPack ? "PACK_PARENT" : "PENDING",
        }
      });

      // If it's a pack, create components in one batch if possible
      if (product.isPack && product.components) {
        try {
          const components = JSON.parse(product.components);
          const subItemsData = [];
          for (const comp of components) {
            const qty = comp.qty || 1;
            for (let q = 0; q < qty; q++) {
              subItemsData.push({
                orderId: order.id, brandId, designId,
                size: comp.size, price: 0, isPack: false,
                parentItemId: mainItem.id, status: "PENDING",
              });
            }
          }
          if (subItemsData.length > 0) {
            await prisma.orderItem.createMany({ data: subItemsData });
          }
        } catch (e) {
          console.error("Pack components error:", e);
        }
      }
    }

    // Update total amount
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: orderTotal }
    });

    // Logging (Fire and forget)
    logActivity("CREATE_ORDER", `New Order REF #${nextReference} created`, { reference: nextReference, orderId: order.id });
    
    revalidatePath("/orders");
    return { success: true, reference: nextReference };
  } catch (e: any) {
    console.error("CREATE_ORDER_CRITICAL_FAILURE:", e);
    return { success: false, error: e.message || "Failed to create order. Please check your data." };
  }
}

export async function updateOrder(orderId: string, formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const customerPostalCode = formData.get("customerPostalCode") as string;
  const customerGovernorate = formData.get("customerGovernorate") as string;
  const customerDelegation = formData.get("customerDelegation") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "0");

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) throw new Error("Order not found");

    // 1. Update Customer Details
    await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName, customerPhone, customerAddress,
        customerPostalCode, customerGovernorate, customerDelegation,
      },
    });

    // 2. Sync Items (Only if order is still RECEIVED and not in production)
    const hasItemsInProduction = order.items.some(i => i.status !== "PENDING" && i.status !== "PACK_PARENT");

    if (!hasItemsInProduction && order.status === "RECEIVED" && itemCount > 0) {
      // Delete existing items and recreate them to match the form
      await prisma.orderItem.deleteMany({ where: { orderId } });

      let orderTotal = 0;
      const products = await prisma.product.findMany();
      const productMap = new Map(products.map(p => [p.id, p]));

      for (let i = 0; i < itemCount; i++) {
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const productId = formData.get(`productId_${i}`) as string;
        
        if (!brandId || !designId || !productId) continue;

        const product = productMap.get(productId);
        if (!product) continue;

        orderTotal += product.price;

        const mainItem = await prisma.orderItem.create({
          data: {
            orderId, brandId, designId,
            size: product.size, price: product.price,
            isPack: product.isPack,
            status: "PENDING"
          }
        });

        if (product.isPack && product.components) {
          const components = JSON.parse(product.components);
          for (const comp of components) {
            const qty = comp.qty || 1;
            for (let q = 0; q < qty; q++) {
              await prisma.orderItem.create({
                data: {
                  orderId, brandId, designId,
                  size: comp.size, price: 0, isPack: false,
                  parentItemId: mainItem.id, status: "PENDING",
                }
              });
            }
          }
        }
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { totalAmount: orderTotal }
      });
    }

    revalidatePath("/orders");
    revalidatePath("/production");
    return { success: true };
  } catch (e: any) {
    console.error("UPDATE_ORDER_ERROR:", e);
    return { success: false, error: e.message };
  }
}

export async function deleteOrder(formData: FormData) {
  const id = formData.get("id") as string;
  try {
    await prisma.order.delete({ where: { id } });
    revalidatePath("/orders");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// PRODUCTION & SHIPPING
export async function createBatch(formData: FormData) {
  const brandId = formData.get("brandId") as string;
  const brandName = formData.get("brandName") as string;
  try {
    const items = await prisma.orderItem.findMany({ 
      where: { 
        status: "PENDING", 
        brandId,
        order: { status: "CONFIRMED" }
      } 
    });
    if (items.length > 0) {
      const batchName = `${brandName} - List ${new Date().toLocaleDateString()}`;
      await prisma.productionList.create({
        data: { batchName, items: { connect: items.map(o => ({ id: o.id })) } },
      });
      await prisma.orderItem.updateMany({
        where: { id: { in: items.map(o => o.id) } },
        data: { status: "IN_PRODUCTION" },
      });
      revalidatePath("/production");
    }
  } catch (e) { throw e; }
}

export async function updateItemStatuses(itemIds: string[], status: string) {
  try {
    await prisma.orderItem.updateMany({
      where: { id: { in: itemIds } },
      data: { status }
    });
    revalidatePath("/production");
    revalidatePath("/shipping");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function confirmOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" }
    });
    revalidatePath("/orders");
    revalidatePath("/production");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

import { createJaxReceipt } from "./jax-api";

// ... existing code ...

export async function shipOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // IDEMPOTENCY CHECK: Prevent double shipping
    if (order.status === "SHIPPED" || order.jaxTrackingId) {
      return { 
        success: true, 
        trackingId: order.jaxTrackingId, 
        message: "Order was already shipped." 
      };
    }

    // IDEMPOTENCY CHECK: Do not ship if already has JAX ID
    if (order.jaxTrackingId) {
      return { success: false, error: `Order #${order.reference} already has a JAX ID: ${order.jaxTrackingId}` };
    }

    // 1. Trigger JAX API
    const jaxResponse = await createJaxReceipt({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      customerGovernorate: order.customerGovernorate || "",
      customerDelegation: order.customerDelegation || "",
      totalAmount: order.totalAmount,
      reference: order.reference
    });

    if (!jaxResponse.success) {
      logActivity("JAX_SHIPPING_FAILURE", `Failed to ship Order REF #${order.reference}`, { orderId, error: jaxResponse.error });
      return { success: false, error: jaxResponse.error || "JAX API failed to create receipt." };
    }

    // 2. Persist to DB using Transaction for Atomicity
    // Map JAX success to our internal status "CHEZ JAX" for better tracking
    await prisma.$transaction([
      prisma.order.update({ 
        where: { id: orderId }, 
        data: { 
          status: "SHIPPED", 
          jaxTrackingId: jaxResponse.trackingId,
          jaxReceiptUrl: jaxResponse.receiptUrl,
          parcelNumber: jaxResponse.trackingId // Keep for backward compat
        } 
      }),
      prisma.orderItem.updateMany({
        where: { orderId },
        data: { status: "SHIPPED" }
      })
    ]);

    logActivity("JAX_SHIPPING_SUCCESS", `Order REF #${order.reference} shipped via JAX`, { orderId, trackingId: jaxResponse.trackingId });

    revalidatePath("/shipping");
    revalidatePath("/orders");
    return { success: true, trackingId: jaxResponse.trackingId };
  } catch (e: any) { 
    console.error("SHIP_ORDER_CRITICAL_ERROR:", e);
    logActivity("SHIP_ORDER_CRITICAL_ERROR", `Unexpected error shipping Order ID: ${orderId}`, { error: e.message });
    return { success: false, error: "A critical error occurred during shipping. Please check logs." };
  }
}

export async function markItemWrapped(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  try {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: "WRAPPED" }
    });
    revalidatePath("/shipping");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function archiveDispatch(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "DISPATCHED" }
    });
    
    logActivity("ORDER_DISPATCHED", `Order REF #${order.reference} labeled and ready for JAX pickup`, { orderId });
    
    revalidatePath("/jax");
    revalidatePath("/history");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
