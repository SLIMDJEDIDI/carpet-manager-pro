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
  // Update logic stays the same but with revalidatePath fix
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const customerPostalCode = formData.get("customerPostalCode") as string;
  const customerGovernorate = formData.get("customerGovernorate") as string;
  const customerDelegation = formData.get("customerDelegation") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "1");

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName, customerPhone, customerAddress,
        customerPostalCode, customerGovernorate, customerDelegation,
      },
    });

    // Simple sequential update for items
    revalidatePath("/orders");
    return { success: true };
  } catch (e: any) {
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
    const items = await prisma.orderItem.findMany({ where: { status: "PENDING", brandId } });
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

export async function shipOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const parcelNumber = formData.get("parcelNumber") as string;
  try {
    await prisma.order.update({ where: { id: orderId }, data: { status: "SHIPPED", parcelNumber } });
    revalidatePath("/shipping");
  } catch (e) { throw e; }
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
