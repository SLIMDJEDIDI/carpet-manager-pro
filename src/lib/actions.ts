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
        `Order REF #${order.reference} was deleted.`,
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
  const customerPostalCode = formData.get("customerPostalCode") as string;
  const customerGovernorate = formData.get("customerGovernorate") as string;
  const customerDelegation = formData.get("customerDelegation") as string;
  const itemCountStr = formData.get("itemCount") as string;
  const itemCount = parseInt(itemCountStr || "0");

  if (!customerName || !customerPhone || itemCount === 0) {
    return { success: false, error: "Missing required customer or article information" };
  }

  try {
    // 1. Pre-fetch products
    const productIds = [];
    for (let i = 0; i < itemCount; i++) {
      const pid = formData.get(`productId_${i}`) as string;
      if (pid) productIds.push(pid);
    }
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    const result = await prisma.$transaction(async (tx) => {
      // 2. Calculate Reference
      const lastOrder = await tx.order.findFirst({
        orderBy: { reference: 'desc' },
        select: { reference: true }
      });
      const nextReference = (lastOrder?.reference || 0) + 1;

      // 3. Prepare all items for a single nested create
      const itemsToCreate = [];
      let orderTotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const productId = formData.get(`productId_${i}`) as string;
        
        if (!brandId || !designId || !productId) continue;

        const product = productMap.get(productId);
        if (!product) continue;

        orderTotal += product.price;

        // Construct main item with sub-items (Packs) nested
        const subItems = [];
        if (product.isPack && product.components) {
          try {
            const components = JSON.parse(product.components);
            for (const comp of components) {
              const qty = comp.qty || 1;
              for (let q = 0; q < qty; q++) {
                subItems.push({
                  brandId, designId,
                  size: comp.size, price: 0, isPack: false,
                  status: "PENDING",
                });
              }
            }
          } catch (jsonError) {
            console.error("Failed to parse pack components:", jsonError);
          }
        }

        itemsToCreate.push({
          brandId, designId,
          size: product.size, price: product.price,
          isPack: product.isPack,
          status: product.isPack ? "PACK_PARENT" : "PENDING",
          subItems: subItems.length > 0 ? { create: subItems } : undefined
        });
      }

      // 4. Single multi-level creation (extremely fast)
      return await tx.order.create({
        data: {
          customerName, customerPhone, customerAddress, 
          customerPostalCode, customerGovernorate, customerDelegation,
          reference: nextReference,
          totalAmount: orderTotal,
          items: {
            create: itemsToCreate
          }
        },
      });
    }, { 
      timeout: 15000 // Shorter timeout for faster feedback
    });

    await logActivity("CREATE_ORDER", `New Order REF #${result.reference} created`, { reference: result.reference, orderId: result.id });
    
    revalidatePath("/orders");
    return { success: true, reference: result.reference };
  } catch (e: any) {
    console.error("CREATE_ORDER_CRITICAL_FAILURE:", e);
    // Attempt to log the error to the database (outside the failed transaction)
    try {
      await logActivity("ERROR", `Order creation failed: ${e.message}`);
    } catch {}
    
    return { success: false, error: e.message || "A database error occurred during order creation." };
  }
}


  // 1. Pre-fetch all needed products to minimize transaction time
  const productIds = [];
  for (let i = 0; i < itemCount; i++) {
    const pid = formData.get(`productId_${i}`) as string;
    if (pid) productIds.push(pid);
  }
  
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  let nextReference = 1;
  const lastOrder = await prisma.order.findFirst({
    orderBy: { reference: 'desc' },
    select: { reference: true }
  });
  nextReference = (lastOrder?.reference || 0) + 1;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerName, customerPhone, customerAddress, 
          customerPostalCode, customerGovernorate, customerDelegation,
          reference: nextReference, totalAmount: 0,
        },
      });

      let orderTotal = 0;
      const orderItemsData = [];

      for (let i = 0; i < itemCount; i++) {
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const productId = formData.get(`productId_${i}`) as string;
        
        if (!brandId || !designId || !productId) continue;

        const product = productMap.get(productId);
        if (!product) continue;

        orderTotal += product.price;

        const mainItem = await tx.orderItem.create({
          data: {
            orderId: order.id, brandId, designId,
            size: product.size, price: product.price,
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
                  orderId: order.id, brandId, designId,
                  size: comp.size, price: 0, isPack: false,
                  parentItemId: mainItem.id, status: "PENDING",
                }
              });
            }
          }
        }
      }

      const finalOrder = await tx.order.update({
        where: { id: order.id },
        data: { totalAmount: orderTotal }
      });

      return finalOrder;
    }, { timeout: 30000 }); // Increase timeout to 30s just in case

    await logActivity("CREATE_ORDER", `New Order REF #${nextReference} created`, { reference: nextReference, orderId: result.id });
    
    revalidatePath("/orders");
    return { success: true, reference: nextReference };
  } catch (e: any) {
    console.error("CREATE_ORDER_ERROR:", e);
    await logActivity("ERROR", `Failed to create order: ${e.message}`);
    return { success: false, error: e.message };
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

export async function deleteOrder(id: string) {
  try {
    await prisma.order.delete({ where: { id } });
    revalidatePath("/orders");
    return { success: true };
  } catch (e: any) {
    console.error("DELETE_ORDER_ERROR:", e);
    return { success: false, error: e.message };
  }
}


      await tx.orderItem.deleteMany({
        where: { orderId, id: { notIn: itemIdsFromForm } }
      });

      for (let i = 0; i < itemCount; i++) {
        const id = formData.get(`itemId_${i}`) as string;
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const productId = formData.get(`productId_${i}`) as string;
        
        if (!brandId || !designId || !productId) continue;
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) continue;

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
            const components = JSON.parse(product.components);
            for (const comp of components) {
              for (let q = 0; q < (comp.qty || 1); q++) {
                await tx.orderItem.create({
                  data: {
                    orderId, brandId, designId, size: comp.size, price: 0,
                    isPack: false, parentItemId: mainItem.id, status: "PENDING",
                  }
                });
              }
            }
          }
        }
      }

      const allItems = await tx.orderItem.findMany({ where: { orderId } });
      const newTotal = allItems.reduce((sum, item) => sum + (item.price || 0), 0);
      await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: newTotal }
      });
    });
  } catch (e: any) {
    await logActivity("ERROR", `Failed to update order ${orderId}: ${e.message}`);
    throw e;
  }

  revalidatePath("/orders");
  return { success: true };
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
