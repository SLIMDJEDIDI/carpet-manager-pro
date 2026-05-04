"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createJaxReceipt } from "./jax-api";

// UTILS
async function logActivity(action: string, details: string, metadata?: any) {
  try {
    const session = await getSession();
    const userName = session?.user?.name || "System";
    await prisma.activityLog.create({
      data: { 
        action, 
        details: `${details} (by ${userName})`, 
        metadata: metadata ? JSON.stringify(metadata) : null 
      }
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

// HELPER: Automatic Readiness Trigger
async function checkAndSetOrderReady(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    
    if (!order || !["CONFIRMED", "ON_HOLD", "PARTIALLY_SHIPPED", "READY_TO_SHIP"].includes(order.status)) return;

    // Physical items only (exclude pack parents)
    const prodItems = order.items.filter(i => !i.isPack);
    if (prodItems.length === 0) return;

    // Ready to ship means everything is either WRAPPED or already SHIPPED
    const allDone = prodItems.every(i => ["WRAPPED", "SHIPPED"].includes(i.status));
    const allDesignsReady = prodItems.every(i => i.designStatus === "READY");
    const noDamaged = prodItems.every(i => i.status !== "DAMAGED");

    // Only auto-upgrade to READY_TO_SHIP if it was NOT already SHIPPED/PARTIALLY_SHIPPED
    // or if it was partially shipped and now more items are wrapped.
    if (allDone && allDesignsReady && noDamaged) {
      if (order.status !== "SHIPPED" && order.status !== "DISPATCHED" && order.status !== "DELIVERED") {
        const hasShippedItems = prodItems.some(i => i.status === "SHIPPED");
        const newStatus = hasShippedItems ? "PARTIALLY_SHIPPED" : "READY_TO_SHIP";
        
        await prisma.order.update({
          where: { id: orderId },
          data: { status: newStatus }
        });
      }
    }
  } catch (e) {
    console.error("Readiness trigger failed:", e);
  }
}

export async function shipOrder(formData: FormData) {
  const session = await getSession();
  const orderId = formData.get("orderId") as string;
  const itemIdsJson = formData.get("itemIds") as string;
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { subItems: true } } }
    });
    if (!order) return { success: false, error: "Order not found" };

    let itemsToShip: any[] = [];
    if (itemIdsJson) {
      const selectedIds = JSON.parse(itemIdsJson) as string[];
      itemsToShip = order.items.filter(i => selectedIds.includes(i.id));
      
      // PACK INTEGRITY CHECK
      for (const item of itemsToShip) {
        if (item.parentItemId) {
          const packParent = order.items.find(p => p.id === item.parentItemId);
          const packChildren = order.items.filter(c => c.parentItemId === item.parentItemId);
          const allChildrenSelected = packChildren.every(c => selectedIds.includes(c.id));
          if (!allChildrenSelected) {
            return { success: false, error: `Pack Integrity Violation: All items of pack '${packParent?.id}' must be shipped together.` };
          }
        }
        if (item.isPack) {
          const children = order.items.filter(c => c.parentItemId === item.id);
          const allChildrenSelected = children.every(c => selectedIds.includes(c.id));
          if (!allChildrenSelected) {
            return { success: false, error: "Pack Integrity Violation: All sub-items must be included." };
          }
        }
      }
    } else {
      // Legacy behavior: ship all ready items
      itemsToShip = order.items.filter(i => !i.isPack && i.status === "WRAPPED");
    }

    if (itemsToShip.length === 0) return { success: false, error: "No items selected or ready for shipping." };

    const allWrapped = itemsToShip.every(i => i.status === "WRAPPED");
    if (!allWrapped) return { success: false, error: "Some selected items are not wrapped yet." };

    const totalShipmentAmount = itemsToShip.reduce((sum, i) => sum + i.price, 0);

    const jaxResponse = await createJaxReceipt({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      customerGovernorate: order.customerGovernorate || "",
      customerDelegation: order.customerDelegation || "",
      totalAmount: totalShipmentAmount,
      reference: order.reference
    });

    const jaxLog = await prisma.jaxLog.create({
      data: {
        orderId: order.id,
        userId: session?.user?.id || null,
        requestBody: JSON.stringify({ items: itemsToShip.map(i => i.id), total: totalShipmentAmount }),
        responseBody: JSON.stringify(jaxResponse),
        status: jaxResponse.success ? "SUCCESS" : "ERROR",
        trackingId: jaxResponse.trackingId || null,
        receiptUrl: jaxResponse.receiptUrl || null
      }
    });

    if (!jaxResponse.success) return { success: false, error: jaxResponse.error || "JAX API Error" };

    // Update Items to SHIPPED
    await prisma.orderItem.updateMany({
      where: { id: { in: itemsToShip.map(i => i.id) } },
      data: { status: "SHIPPED", jaxLogId: jaxLog.id }
    });

    // Determine New Order Status
    const allOrderItems = await prisma.orderItem.findMany({ where: { orderId, isPack: false } });
    const allShipped = allOrderItems.every(i => i.status === "SHIPPED");
    
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: allShipped ? "SHIPPED" : "PARTIALLY_SHIPPED",
        jaxTrackingId: jaxResponse.trackingId, // Store last tracking
        jaxReceiptUrl: jaxResponse.receiptUrl  // Store last receipt
      }
    });

    await logActivity(allShipped ? "ORDER_SHIPPED" : "PARTIAL_SHIPPING", 
      `Order REF #${order.reference}: ${itemsToShip.length} items shipped. Status: ${allShipped ? 'SHIPPED' : 'PARTIALLY_SHIPPED'}`, 
      { orderId, trackingId: jaxResponse.trackingId });

    revalidatePath("/shipping");
    revalidatePath("/orders");
    revalidatePath("/jax");
    
    return { 
      success: true, 
      trackingId: jaxResponse.trackingId, 
      receiptUrl: jaxResponse.receiptUrl 
    };
  } catch (e: any) { 
    console.error(e);
    return { success: false, error: e.message }; 
  }
}

// ORDER ACTIONS
export async function createOrder(formData: FormData) {
  const session = await getSession();
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const customerPostalCode = formData.get("customerPostalCode") as string;
  const customerGovernorate = formData.get("customerGovernorate") as string;
  const customerDelegation = formData.get("customerDelegation") as string;
  const isFreeDelivery = formData.get("isFreeDelivery") === "on";
  const isExchange = formData.get("isExchange") === "on";
  const note = formData.get("note") as string;
  const itemCountStr = formData.get("itemCount") as string;
  const itemCount = parseInt(itemCountStr || "0");

  if (!customerName || !customerPhone || itemCount === 0) {
    return { success: false, error: "Missing required customer or article information" };
  }

  try {
    const productIds: string[] = [];
    const designIds: string[] = [];
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

    const lastOrder = await prisma.order.findFirst({
      orderBy: { reference: 'desc' },
      select: { reference: true }
    });
    const nextReference = (lastOrder?.reference || 0) + 1;

    const order = await prisma.order.create({
      data: {
        customerName, customerPhone, customerAddress, 
        customerPostalCode, customerGovernorate, customerDelegation,
        isFreeDelivery, isExchange, note,
        reference: nextReference, totalAmount: 0,
        createdById: session?.user?.id || null,
      },
    });

    let orderTotal = 0;

    for (let i = 0; i < itemCount; i++) {
      const brandId = formData.get(`brandId_${i}`) as string;
      const designId = formData.get(`designId_${i}`) as string;
      const productId = formData.get(`productId_${i}`) as string;
      const quantity = parseInt(formData.get(`quantity_${i}`) as string || "1");
      
      if (!brandId || !designId || !productId) continue;
      const product = productMap.get(productId);
      if (!product) continue;

      for (let qCount = 0; qCount < quantity; qCount++) {
        orderTotal += product.price;

        const mainItem = await prisma.orderItem.create({
          data: {
            orderId: order.id, brandId, designId,
            size: product.size, price: product.price,
            isPack: product.isPack,
            status: product.isPack ? "PACK_PARENT" : "PENDING",
            designStatus: "PENDING",
          }
        });

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
                  designStatus: "PENDING",
                });
              }
            }
            if (subItemsData.length > 0) {
              await prisma.orderItem.createMany({ data: subItemsData });
            }
          } catch (e) { console.error("Pack components error:", e); }
        }
      }
    }

    const deliveryFee = (isFreeDelivery || isExchange) ? 0 : 8;
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: orderTotal + deliveryFee }
    });

    await logActivity("CREATE_ORDER", `New Order REF #${nextReference} created`, { reference: nextReference, orderId: order.id });
    
    revalidatePath("/orders");
    return { success: true, reference: nextReference };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to create order." };
  }
}

export async function updateOrder(orderId: string, formData: FormData) {
  const session = await getSession();
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const customerPostalCode = formData.get("customerPostalCode") as string;
  const customerGovernorate = formData.get("customerGovernorate") as string;
  const customerDelegation = formData.get("customerDelegation") as string;
  const isFreeDelivery = formData.get("isFreeDelivery") === "on";
  const isExchange = formData.get("isExchange") === "on";
  const note = formData.get("note") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "0");

  try {
    const productIds = [];
    for (let i = 0; i < itemCount; i++) {
      const pid = formData.get(`productId_${i}`) as string;
      if (pid) productIds.push(pid);
    }
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map(p => [p.id, p]));

    await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName, customerPhone, customerAddress,
        customerPostalCode, customerGovernorate, customerDelegation,
        isFreeDelivery, isExchange, note,
      },
    });

    const itemsInProduction = await prisma.orderItem.count({
      where: { orderId, status: { not: "PENDING" } }
    });

    if (itemsInProduction === 0 && itemCount > 0) {
      await prisma.orderItem.deleteMany({ where: { orderId } });
      let orderTotal = 0;
      for (let i = 0; i < itemCount; i++) {
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const productId = formData.get(`productId_${i}`) as string;
        const quantity = parseInt(formData.get(`quantity_${i}`) as string || "1");
        if (!brandId || !designId || !productId) continue;
        const product = productMap.get(productId);
        if (!product) continue;

        for (let qCount = 0; qCount < quantity; qCount++) {
          orderTotal += product.price;
          const mainItem = await prisma.orderItem.create({
            data: {
              orderId, brandId, designId,
              size: product.size, price: product.price,
              isPack: product.isPack,
              status: product.isPack ? "PACK_PARENT" : "PENDING",
              designStatus: "PENDING",
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
                    designStatus: "PENDING",
                  }
                });
              }
            }
          }
        }
      }
      const deliveryFee = (isFreeDelivery || isExchange) ? 0 : 8;
      await prisma.order.update({
        where: { id: orderId },
        data: { totalAmount: orderTotal + deliveryFee }
      });
    }

    revalidatePath("/orders");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function confirmOrder(formData: FormData) {
  const session = await getSession();
  const orderId = formData.get("orderId") as string;
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "CONFIRMED",
        confirmedById: session?.user?.id || null,
      }
    });
    await logActivity("CONFIRM_ORDER", `Order REF #${orderId} confirmed`);
    revalidatePath("/orders");
    revalidatePath("/production");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function setDesignStatus(itemId: string, status: "PENDING" | "READY") {
  try {
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { designStatus: status }
    });
    await checkAndSetOrderReady(item.orderId);
    revalidatePath("/production");
    revalidatePath("/designer");
    revalidatePath("/designs");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function setDesignStatusBulk(itemIds: string[], status: "PENDING" | "READY") {
  try {
    await prisma.orderItem.updateMany({
      where: { id: { in: itemIds } },
      data: { designStatus: status }
    });
    
    // Get unique order IDs to check
    const items = await prisma.orderItem.findMany({
      where: { id: { in: itemIds } },
      select: { orderId: true }
    });
    const orderIds = Array.from(new Set(items.map(i => i.orderId)));
    for (const oId of orderIds) {
      await checkAndSetOrderReady(oId);
    }

    revalidatePath("/production");
    revalidatePath("/designer");
    revalidatePath("/designs");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function markItemDamaged(itemId: string) {
  try {
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: "DAMAGED" },
      include: { order: true }
    });
    await prisma.order.update({
      where: { id: item.orderId },
      data: { status: "ON_HOLD" }
    });
    await logActivity("ITEM_DAMAGED", `Item in Order REF #${item.order.reference} marked as DAMAGED`);
    revalidatePath("/production");
    revalidatePath("/orders");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateItemStatuses(itemIds: string[], status: string) {
  try {
    await prisma.orderItem.updateMany({
      where: { id: { in: itemIds } },
      data: { status }
    });
    
    if (status === "WRAPPED") {
      const items = await prisma.orderItem.findMany({
        where: { id: { in: itemIds } },
        select: { orderId: true }
      });
      const orderIds = Array.from(new Set(items.map(i => i.orderId)));
      for (const oId of orderIds) {
        await checkAndSetOrderReady(oId);
      }
    }

    revalidatePath("/production");
    revalidatePath("/shipping");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function createBatch(formData: FormData) {
  const brandId = formData.get("brandId") as string;
  const brandName = formData.get("brandName") as string;
  try {
    const items = await prisma.orderItem.findMany({ 
      where: { 
        status: "PENDING", 
        designStatus: "READY",
        brandId,
        isPack: false,
        order: { status: { in: ["CONFIRMED", "ON_HOLD"] } }
      } 
    });
    
    if (items.length === 0) {
      return { success: false, error: `No items with READY designs found for ${brandName}.` };
    }

    const batchName = `${brandName} - List ${new Date().toLocaleDateString()}`;
    await prisma.productionList.create({
      data: { batchName, items: { connect: items.map(o => ({ id: o.id })) } },
    });
    
    await prisma.orderItem.updateMany({
      where: { id: { in: items.map(o => o.id) } },
      data: { status: "IN_PRODUCTION" },
    });
    
    await logActivity("CREATE_BATCH", `Production Batch created: ${batchName}`);
    revalidatePath("/production");
    revalidatePath("/shipping");
    return { success: true };
  } catch (e: any) { 
    return { success: false, error: e.message || "Failed to create batch." }; 
  }
}

export async function archiveDispatch(formData: FormData) {
  const dispatchId = formData.get("dispatchId") as string;
  try {
    const dispatch = await prisma.jaxLog.update({
      where: { id: dispatchId },
      data: { status: "DISPATCHED" },
      include: { order: true, items: true }
    });

    // Check if all items of the order are now shipped and all dispatches are archived
    const allItems = await prisma.orderItem.findMany({
      where: { orderId: dispatch.orderId, isPack: false }
    });
    const allShipped = allItems.every(i => i.status === "SHIPPED");
    
    const allLogs = await prisma.jaxLog.findMany({
      where: { orderId: dispatch.orderId }
    });
    const allArchived = allLogs.every(l => l.status === "DISPATCHED" || l.status === "ERROR");

    if (allShipped && allArchived) {
      await prisma.order.update({
        where: { id: dispatch.orderId },
        data: { status: "DISPATCHED" }
      });
    }

    await logActivity("PARCEL_DISPATCHED", `Parcel ${dispatch.trackingId} for Order REF #${dispatch.order.reference} archived`, { dispatchId });
    revalidatePath("/jax");
    revalidatePath("/history");
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
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

export async function markItemWrapped(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  try {
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: "WRAPPED" }
    });
    await checkAndSetOrderReady(item.orderId);
    revalidatePath("/shipping");
    revalidatePath("/production");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
