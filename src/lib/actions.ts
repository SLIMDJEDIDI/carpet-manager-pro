"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";

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
  const itemCount = parseInt(formData.get("itemCount") as string || "0");

  if (!customerName || !customerPhone || itemCount === 0) {
    throw new Error("Missing required order information");
  }

  let nextReference = 1;
  const lastOrder = await prisma.order.findFirst({
    orderBy: { reference: 'desc' },
    select: { reference: true }
  });
  nextReference = (lastOrder?.reference || 0) + 1;

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerName, customerPhone, customerAddress, 
          customerPostalCode, customerGovernorate, customerDelegation,
          reference: nextReference, totalAmount: 0,
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

      await tx.order.update({
        where: { id: order.id },
        data: { totalAmount: orderTotal }
      });
    }, { timeout: 20000 });

    await logActivity("CREATE_ORDER", `New Order REF #${nextReference} created`, { reference: nextReference });
  } catch (e: any) {
    await logActivity("ERROR", `Failed to create order: ${e.message}`);
    throw e;
  }

  revalidatePath("/orders");
  redirect("/orders");
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
  redirect("/orders");
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

// DESIGN ACTIONS (THE CORE FIX)
async function uploadToBlob(file: any, code: string) {
  // Enhanced check for file/blob
  const isFile = (file instanceof Blob || (file && typeof file === 'object' && 'size' in file)) && file.size > 0;
  if (!isFile) return null;

  try {
    const blob = await put(file.name || `${code}.png`, file, { access: 'public' });
    return blob.url;
  } catch (e: any) {
    console.error("Blob Upload Error:", e.message);
    throw new Error(`Cloud storage failure: ${e.message}`);
  }
}

export async function createDesignQuick(formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image");

  if (!code || !name) return { success: false, error: "Code and Name required" };

  try {
    const imageUrl = await uploadToBlob(imageFile, code);
    if (!imageUrl) return { success: false, error: "Image file is missing or invalid" };

    const design = await prisma.design.create({ data: { code, name, imageUrl } });
    await logActivity("CREATE_DESIGN", `Quick Add: ${code}`, { imageUrl });
    revalidatePath("/designs");
    return { success: true, design };
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: "Design code already exists" };
    return { success: false, error: e.message };
  }
}

export async function createDesign(formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image");

  if (!code || !name) throw new Error("Code and Name required");

  try {
    const imageUrl = await uploadToBlob(imageFile, code);
    if (!imageUrl) throw new Error("A valid image file is required.");

    await prisma.design.create({ data: { code, name, imageUrl } });
    await logActivity("CREATE_DESIGN", `Standard Add: ${code}`, { imageUrl });
  } catch (e: any) {
    if (e.code === 'P2002') throw new Error("Design code already exists");
    throw e;
  }

  revalidatePath("/designs");
  redirect("/designs");
}

export async function updateDesign(id: string, formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image");
  const existingImageUrl = formData.get("existingImageUrl") as string;

  try {
    let imageUrl = await uploadToBlob(imageFile, code);
    if (!imageUrl) imageUrl = existingImageUrl;

    await prisma.design.update({ where: { id }, data: { code, name, imageUrl } });
    revalidatePath("/designs");
  } catch (e: any) { throw e; }

  redirect("/designs");
}

export async function deleteDesign(id: string) {
  try {
    await prisma.design.delete({ where: { id } });
    revalidatePath("/designs");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: "Design is in use and cannot be deleted." };
  }
}
