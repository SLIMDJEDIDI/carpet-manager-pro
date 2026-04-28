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
  const order = await prisma.order.findUnique({ where: { id } });
  
  if (order) {
    await logActivity(
      "DELETE_ORDER", 
      `Order REF #${order.reference} for ${order.customerName} was deleted.`,
      { orderId: id, reference: order.reference }
    );
    await prisma.order.delete({ where: { id } });
  }
  
  revalidatePath("/orders");
}

export async function createOrder(formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "1");

  // Get max reference to increment
  const lastOrder = await prisma.order.findFirst({
    orderBy: { reference: 'desc' },
    select: { reference: true }
  });
  const nextReference = (lastOrder?.reference || 0) + 1;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerName,
        customerPhone,
        customerAddress,
        reference: nextReference,
        totalAmount: 0, // Will update after items
      },
    });

    let orderTotal = 0;
    const itemsCreated = [];

    for (let i = 0; i < itemCount; i++) {
      const brandId = formData.get(`brandId_${i}`) as string;
      const designId = formData.get(`designId_${i}`) as string;
      const productId = formData.get(`productId_${i}`) as string;
      
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
      itemsCreated.push(product.name);

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

    // We can't call logActivity inside transaction if it uses standard prisma, 
    // but we can log after or use the tx client if we add it to the model.
    // For simplicity, we'll log after the transaction.
  });

  await logActivity(
    "CREATE_ORDER", 
    `New Order REF #${nextReference} created for ${customerName} (${itemCount} top-level items).`,
    { reference: nextReference, customerName }
  );

  revalidatePath("/orders");
  redirect("/orders");
}

export async function updateOrder(orderId: string, formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "1");

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

  revalidatePath("/orders");
  redirect("/orders");
}

// PRODUCTION ACTIONS
export async function createBatch(formData: FormData) {
  const brandId = formData.get("brandId") as string;
  const brandName = formData.get("brandName") as string;
  
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
}

// SHIPPING ACTIONS
export async function shipOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const parcelNumber = formData.get("parcelNumber") as string;
  
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED", parcelNumber },
  });

  await logActivity(
    "SHIP_ORDER", 
    `Order REF #${order.reference} shipped. Parcel: ${parcelNumber}`,
    { reference: order.reference, parcelNumber }
  );
  
  revalidatePath("/shipping");
}

export async function markItemWrapped(itemId: string) {
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

  revalidatePath("/shipping");
}

export async function updateItemStatuses(itemIds: string[], status: string) {
  await prisma.orderItem.updateMany({
    where: { id: { in: itemIds } },
    data: { status },
  });

  await logActivity(
    "BULK_STATUS_UPDATE",
    `Bulk updated ${itemIds.length} items to status: ${status}`,
    { count: itemIds.length, status }
  );

  revalidatePath("/production");
  revalidatePath("/shipping");
}
