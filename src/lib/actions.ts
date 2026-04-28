"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
export async function deleteOrder(formData: FormData) {
  const id = formData.get("id") as string;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    
    if (order) {
      await logActivity(
        "DELETE_ORDER", 
        `Order REF #${order.reference} for ${order.customerName} was deleted.`,
        { orderId: id, reference: order.reference }
      );
      await prisma.order.delete({ where: { id } });
    }
  } catch (e: any) {
    await logActivity("ERROR", `Failed to delete order: ${e.message}`);
    throw e;
  }
  
  revalidatePath("/orders");
}

export async function createOrder(formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "1");

  let nextReference = 1;
  try {
    const lastOrder = await prisma.order.findFirst({
      orderBy: { reference: 'desc' },
      select: { reference: true }
    });
    nextReference = (lastOrder?.reference || 0) + 1;
  } catch (e) {
    console.error("Failed to get reference", e);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerName,
          customerPhone,
          customerAddress,
          reference: nextReference,
          totalAmount: 0,
        },
      });

      let orderTotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const productId = formData.get(`productId_${i}`) as string;
        
        if (!brandId || !designId || !productId) continue;

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) continue;

        orderTotal += product.price;

        const mainItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            brandId,
            designId,
            size: product.size,
            price: product.price,
            isPack: product.isPack,
            status: product.isPack ? "PACK_PARENT" : "PENDING",
          }
        });

        if (product.isPack && product.components) {
          const components = JSON.parse(product.components);
          for (const comp of components) {
            for (let q = 0; q < (comp.qty || 1); q++) {
              await tx.orderItem.create({
                data: {
                  orderId: order.id,
                  brandId,
                  designId,
                  size: comp.size,
                  price: 0,
                  isPack: false,
                  parentItemId: mainItem.id,
                  status: "PENDING",
                }
              });
            }
          }
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: { totalAmount: orderTotal }
      });
    }, {
      timeout: 10000 // 10s timeout for transaction
    });

    await logActivity(
      "CREATE_ORDER", 
      `New Order REF #${nextReference} created for ${customerName}.`,
      { reference: nextReference, customerName }
    );
  } catch (e: any) {
    console.error("Transaction failed", e);
    await logActivity("ERROR", `Failed to create order: ${e.message}`);
    // We don't throw here so we can redirect to a friendly page or show error
    // But for server actions, throwing is the way to trigger error boundaries
    throw e;
  }

  revalidatePath("/orders");
  redirect("/orders");
}

export async function updateOrder(orderId: string, formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "1");

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          customerName,
          customerPhone,
          customerAddress,
        },
      });

      const itemIdsFromForm: string[] = [];
      for (let i = 0; i < itemCount; i++) {
        const id = formData.get(`itemId_${i}`) as string;
        if (id) itemIdsFromForm.push(id);
      }

      // Delete items not in form
      await tx.orderItem.deleteMany({
        where: { 
          orderId: orderId,
          id: { notIn: itemIdsFromForm }
        }
      });

      for (let i = 0; i < itemCount; i++) {
        const id = formData.get(`itemId_${i}`) as string;
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const size = formData.get(`size_${i}`) as string;

        if (id) {
          await tx.orderItem.update({
            where: { id },
            data: { brandId, designId, size }
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId: orderId,
              brandId,
              designId,
              size,
              status: "PENDING",
            }
          });
        }
      }
    });

    if (order) {
      await logActivity(
        "UPDATE_ORDER", 
        `Order REF #${order.reference} was updated.`,
        { reference: order.reference, customerName }
      );
    }
  } catch (e: any) {
    await logActivity("ERROR", `Failed to update order ${orderId}: ${e.message}`);
    throw e;
  }

  revalidatePath("/orders");
  redirect("/orders");
}

// PRODUCTION ACTIONS
export async function createBatch(formData: FormData) {
  const brandId = formData.get("brandId") as string;
  const brandName = formData.get("brandName") as string;
  
  try {
    const items = await prisma.orderItem.findMany({ 
      where: { 
        status: "PENDING",
        brandId: brandId
      } 
    });
    
    if (items.length > 0) {
      const batchName = `${brandName} - List ${new Date().toLocaleDateString()}`;
      
      await prisma.productionList.create({
        data: {
          batchName,
          items: {
            connect: items.map(o => ({ id: o.id })),
          },
        },
      });

      await prisma.orderItem.updateMany({
        where: { id: { in: items.map(o => o.id) } },
        data: { status: "IN_PRODUCTION" },
      });

      await logActivity(
        "START_PRODUCTION", 
        `Production batch "${batchName}" created with ${items.length} items.`,
        { brandName, batchName, itemCount: items.length }
      );

      revalidatePath("/production");
    }
  } catch (e: any) {
    await logActivity("ERROR", `Failed to create production batch: ${e.message}`);
    throw e;
  }
}

// SHIPPING ACTIONS
export async function shipOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const parcelNumber = formData.get("parcelNumber") as string;
  
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED", parcelNumber },
    });

    await logActivity(
      "SHIP_ORDER", 
      `Order REF #${order.reference} shipped. Parcel: ${parcelNumber}`,
      { reference: order.reference, parcelNumber }
    );
  } catch (e: any) {
    await logActivity("ERROR", `Failed to ship order ${orderId}: ${e.message}`);
    throw e;
  }
  
  revalidatePath("/shipping");
}

export async function markItemWrapped(itemId: string) {
  try {
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: "WRAPPED" },
      include: { order: true, design: true }
    });

    await logActivity(
      "ITEM_WRAPPED", 
      `Article ${item.design.code} (${item.size}) from REF #${item.order.reference} marked as wrapped.`,
      { reference: item.order.reference, designCode: item.design.code, size: item.size }
    );
  } catch (e: any) {
    await logActivity("ERROR", `Failed to wrap item ${itemId}: ${e.message}`);
    throw e;
  }

  revalidatePath("/shipping");
}

export async function updateItemStatuses(itemIds: string[], status: string) {
  try {
    await prisma.orderItem.updateMany({
      where: { id: { in: itemIds } },
      data: { status },
    });

    await logActivity(
      "BULK_STATUS_UPDATE",
      `Bulk updated ${itemIds.length} items to status: ${status}`,
      { count: itemIds.length, status }
    );
  } catch (e: any) {
    await logActivity("ERROR", `Failed bulk update: ${e.message}`);
    throw e;
  }

  revalidatePath("/production");
  revalidatePath("/shipping");
}
