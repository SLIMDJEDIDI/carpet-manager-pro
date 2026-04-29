"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
// Vercel Blob storage enabled
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
  console.log("--- CREATE ORDER START ---");
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const customerPostalCode = formData.get("customerPostalCode") as string;
  const customerGovernorate = formData.get("customerGovernorate") as string;
  const customerDelegation = formData.get("customerDelegation") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "0");

  console.log("Customer Info:", { customerName, customerPhone, customerAddress, customerPostalCode, customerGovernorate, customerDelegation, itemCount });

  if (!customerName || !customerPhone || itemCount === 0) {
    console.error("Validation failed: Missing customer info or items");
    throw new Error("Missing required order information");
  }

  let nextReference = 1;
  try {
    const lastOrder = await prisma.order.findFirst({
      orderBy: { reference: 'desc' },
      select: { reference: true }
    });
    nextReference = (lastOrder?.reference || 0) + 1;
    console.log("Calculated Reference:", nextReference);
  } catch (e) {
    console.error("Failed to get reference, defaulting to 1", e);
  }

  try {
    await prisma.$transaction(async (tx) => {
      console.log("Starting Transaction...");
      const order = await tx.order.create({
        data: {
          customerName,
          customerPhone,
          customerAddress,
          customerPostalCode,
          customerGovernorate,
          customerDelegation,
          reference: nextReference,
          totalAmount: 0,
        },
      });
      console.log("Order Header Created:", order.id);

      let orderTotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const brandId = formData.get(`brandId_${i}`) as string;
        const designId = formData.get(`designId_${i}`) as string;
        const productId = formData.get(`productId_${i}`) as string;
        
        console.log(`Processing Item ${i}:`, { brandId, designId, productId });

        if (!brandId || !designId || !productId) {
          console.warn(`Skipping item ${i} due to missing IDs`);
          continue;
        }

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          console.error(`Product not found: ${productId}`);
          continue;
        }

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
        console.log(`Main Item Created: ${mainItem.id} (Price: ${product.price})`);

        if (product.isPack && product.components) {
          const components = JSON.parse(product.components);
          console.log(`Expanding Pack: ${product.name} with ${components.length} components`);
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
      console.log("Order Total Updated:", orderTotal);
    }, {
      timeout: 20000 // Increased to 20s for cloud DB
    });

    await logActivity(
      "CREATE_ORDER", 
      `New Order REF #${nextReference} created for ${customerName}.`,
      { reference: nextReference, customerName }
    );
    console.log("--- CREATE ORDER SUCCESS ---");
  } catch (e: any) {
    console.error("Transaction failed", e);
    await logActivity("ERROR", `Failed to create order: ${e.message || "Unknown error"}`);
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
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          customerName,
          customerPhone,
          customerAddress,
          customerPostalCode,
          customerGovernorate,
          customerDelegation,
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
        const productId = formData.get(`productId_${i}`) as string;
        
        if (!brandId || !designId || !productId) continue;

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) continue;

        if (id) {
          // For existing items, we update core fields
          await tx.orderItem.update({
            where: { id },
            data: { 
              brandId, 
              designId, 
              size: product.size,
              price: product.price 
            }
          });
        } else {
          // For new items added during edit, use the full expansion logic
          const mainItem = await tx.orderItem.create({
            data: {
              orderId: orderId,
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
                    orderId: orderId,
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
      }

      // Recalculate totalAmount
      const allItems = await tx.orderItem.findMany({ where: { orderId: orderId } });
      const newTotal = allItems.reduce((sum, item) => sum + (item.price || 0), 0);
      
      await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: newTotal }
      });
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

export async function deleteDesign(id: string) {
  try {
    // Check if the design is used in any orders that are not delivered or cancelled
    const activeUsage = await prisma.orderItem.findFirst({
      where: {
        designId: id,
        order: {
          status: {
            notIn: ["DELIVERED", "CANCELLED"]
          }
        }
      },
      include: {
        order: true
      }
    });

    if (activeUsage) {
      return { 
        success: false, 
        message: `This design is currently used in active order REF #${activeUsage.order.reference} and cannot be deleted until the order is delivered.` 
      };
    }

    await prisma.design.delete({
      where: { id },
    });
    
    revalidatePath("/designs");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete design:", error);
    return { 
      success: false, 
      message: "An unexpected error occurred. This design might be linked to historical orders." 
    };
  }
}

export async function createDesignQuick(formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image");
  
  // LOGGING TO DB FOR DEBUGGING
  await logActivity("DEBUG_CREATE_QUICK", `Starting creation for ${code}`, {
    imageType: typeof imageFile,
    isBlob: imageFile instanceof Blob,
    size: (imageFile as any)?.size,
    name: (imageFile as any)?.name
  });

  if (!code || !name) {
    return { success: false, error: "Design Code and Name are required." };
  }

  let imageUrl = null;

  try {
    const isFile = imageFile instanceof Blob && imageFile.size > 0;

    if (isFile) {
      const file = imageFile as unknown as File;
      try {
        const blob = await put(file.name || `${code}.png`, file, {
          access: 'public',
        });
        imageUrl = blob.url;
      } catch (blobError: any) {
        console.error("Vercel Blob Upload Failed:", blobError.message);
        await logActivity("DEBUG_UPLOAD_FAIL", `Blob failed for ${code}: ${blobError.message}`);
        return { success: false, error: `Image upload failed: ${blobError.message}` };
      }
    }

    const design = await prisma.design.create({
      data: {
        code,
        name,
        imageUrl,
      },
    });

    await logActivity("DEBUG_CREATE_SUCCESS", `Design ${code} created with URL: ${imageUrl}`);
    revalidatePath("/designs");
    return { success: true, design };
  } catch (error: any) {
    console.error("createDesignQuick error:", error);
    await logActivity("DEBUG_CREATE_ERROR", `Error for ${code}: ${error.message}`);
    return { success: false, error: error.message || "Failed to create design" };
  }
}

export async function createDesign(formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image");
  
  await logActivity("DEBUG_CREATE_CLASSIC", `Starting classic creation for ${code}`, {
    imageType: typeof imageFile,
    isBlob: imageFile instanceof Blob,
    size: (imageFile as any)?.size
  });

  if (!code || !name) throw new Error("Code and Name are required");

  let imageUrl = null;

  try {
    const isFile = imageFile instanceof Blob && imageFile.size > 0;

    if (isFile) {
      const file = imageFile as unknown as File;
      try {
        const blob = await put(file.name || `${code}.png`, file, {
          access: 'public',
        });
        imageUrl = blob.url;
      } catch (blobError: any) {
        console.error("Vercel Blob Upload Failed:", blobError.message);
        throw new Error(`Image upload failed: ${blobError.message}`);
      }
    }

    await prisma.design.create({
      data: {
        code,
        name,
        imageUrl,
      },
    });
  } catch (error: any) {
    console.error("createDesign error:", error);
    throw error;
  }

  revalidatePath("/designs");
  redirect("/designs");
}

export async function updateDesign(id: string, formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image");
  const existingImageUrl = formData.get("existingImageUrl") as string;

  let imageUrl = existingImageUrl || null;
  if (imageUrl === "") imageUrl = null;

  try {
    const isFile = !!(imageFile && typeof imageFile !== 'string' && 'size' in (imageFile as any) && (imageFile as any).size > 0);

    if (isFile) {
      const file = imageFile as unknown as File;
      try {
        const blob = await put(file.name || `${code}.png`, file, {
          access: 'public',
        });
        imageUrl = blob.url;
      } catch (blobError: any) {
        console.error("Vercel Blob Update Failed:", blobError.message);
        throw new Error(`Image upload failed: ${blobError.message}. Check Vercel Blob token.`);
      }
    }

    await prisma.design.update({
      where: { id },
      data: {
        code,
        name,
        imageUrl,
      },
    });
  } catch (error: any) {
    console.error("updateDesign error:", error);
    throw error;
  }

  revalidatePath("/designs");
  redirect("/designs");
}

export async function markItemWrapped(itemId: string) {
  try {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: "WRAPPED" },
    });
    revalidatePath("/shipping");
  } catch (error) {
    console.error("Failed to mark item as wrapped:", error);
    throw new Error("Failed to update status");
  }
}

