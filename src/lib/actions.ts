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
    // 1. Pre-fetch data
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

    // 2. Calculate Reference (Fast)
    const lastOrder = await prisma.order.findFirst({
      orderBy: { reference: 'desc' },
      select: { reference: true }
    });
    const nextReference = (lastOrder?.reference || 0) + 1;

    // 3. Create Base Order (Direct Write - No Transaction Lock)
    const order = await prisma.order.create({
      data: {
        customerName, customerPhone, customerAddress, 
        customerPostalCode, customerGovernorate, customerDelegation,
        reference: nextReference, totalAmount: 0,
      },
    });

    let orderTotal = 0;

    // 4. Create Items
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
          orderId: order.id, brandId, designId,
          size: product.size, price: product.price,
          isPack: product.isPack,
          status: product.isPack ? "PACK_PARENT" : "PENDING",
        }
      });

      if (product.isPack && product.components) {
        try {
          const components = JSON.parse(product.components);
          for (const comp of components) {
            const qty = comp.qty || 1;
            for (let q = 0; q < qty; q++) {
              await prisma.orderItem.create({
                data: {
                  orderId: order.id, brandId, designId,
                  size: comp.size, price: 0, isPack: false,
                  parentItemId: mainItem.id, status: "PENDING",
                }
              });
            }
          }
        } catch (e) {
          console.error("Pack error:", e);
        }
      }
    }

    // 5. Update Final Total
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: orderTotal }
    });

    // Fire and forget logging (Non-blocking)
    logActivity("CREATE_ORDER", `New Order REF #${nextReference} created`, { reference: nextReference, orderId: order.id });
    
    revalidatePath("/orders");
    return { success: true, reference: nextReference };
  } catch (e: any) {
    console.error("CREATE_ORDER_FAILED:", e);
    return { success: false, error: e.message || "Database Error. Please try again." };
  }
}

export async function updateOrder(orderId: string, formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const customerPostalCode = formData.get("customerPostalCode") as string;
  const customerGovernorate = formData.get("customerGovernorate") as string;
  const customerDelegation = formData.get("customerDelegation") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "1");

  try {
    // Pre-fetch products
    const productIds = [];
    for (let i = 0; i < itemCount; i++) {
      const pid = formData.get(`productId_${i}`) as string;
      if (pid) productIds.push(pid);
    }
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map(p => [p.id, p]));

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          customerName, customerPhone, customerAddress,
          customerPostalCode, customerGovernorate, customerDelegation,
        },
      });

      const itemIdsFromForm: string[] = [];
      for (let i = 0; i < itemCount; i++) {
        const id = formData.get(`itemId_${i}`) as string;
        if (id) itemIdsFromForm.push(id);
      }

      // Delete items not in form
      await tx.orderItem.deleteMany({
        where: { orderId, id: { notIn: itemIdsFromForm } }
      });

      let orderTotal = 0;
      for (let i = 0; i < itemCount; i++) {
        const id = formData.get(`itemId_${i}`) as string;
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const productId = formData.get(`productId_${i}`) as string;
        
        if (!brandId || !designId || !productId) continue;
        const product = productMap.get(productId);
        if (!product) continue;

        orderTotal += product.price;

        if (id) {
          await tx.orderItem.update({
            where: { id },
            data: { brandId, designId, size: product.size, price: product.price }
          });
        } else {
          const mainItem = await tx.orderItem.create({
            data: {
              orderId, brandId, designId, size: product.size, price: product.price,
              isPack: product.isPack, status: product.isPack ? "PACK_PARENT" : "PENDING",
            }
          });

          if (product.isPack && product.components) {
            try {
              const components = JSON.parse(product.components);
              for (const comp of components) {
                for (let q = 0; q < (comp.qty || 1); q++) {
                  await tx.orderItem.create({
                    data: {
                      orderId, brandId, designId, size: comp.size, price: 0, isPack: false,
                      parentItemId: mainItem.id, status: "PENDING",
                    }
                  });
                }
              }
            } catch {}
          }
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: orderTotal }
      });
    }, { timeout: 30000 });

    revalidatePath("/orders");
    return { success: true };
  } catch (e: any) {
    console.error("UPDATE_ORDER_ERROR:", e);
    return { success: false, error: e.message };
  }
}

export async function deleteOrder(formData: FormData) {
  const id = formData.get("id") as string;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (order) {
      await logActivity(
        "DELETE_ORDER", 
        `Order REF #${order.reference} was deleted.`,
        { orderId: id, reference: order.reference }
      );
      await prisma.order.delete({ where: { id } });
    }
    revalidatePath("/orders");
    return { success: true };
  } catch (e: any) {
    console.error("DELETE_ORDER_ERROR:", e);
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
  } catch (e: any) { throw e; }
}

export async function shipOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const parcelNumber = formData.get("parcelNumber") as string;
  try {
    await prisma.order.update({ where: { id: orderId }, data: { status: "SHIPPED", parcelNumber } });
  } catch (e: any) { throw e; }
  revalidatePath("/shipping");
}

export async function markItemWrapped(itemId: string) {
  try {
    await prisma.orderItem.update({ where: { id: itemId }, data: { status: "WRAPPED" } });
    revalidatePath("/shipping");
  } catch (error) { throw error; }
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
    console.error("UPDATE_STATUSES_ERROR:", e);
    return { success: false, error: e.message };
  }
}
