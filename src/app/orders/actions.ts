"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteOrder(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.order.delete({ where: { id } });
  revalidatePath("/orders");
}

export async function createOrder(formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "1");

  const items = [];
  for (let i = 0; i < itemCount; i++) {
    items.push({
      brandId: formData.get(`brandId_${i}`) as string,
      designId: formData.get(`designId_${i}`) as string,
      size: formData.get(`size_${i}`) as string,
      status: "PENDING",
    });
  }

  await prisma.order.create({
    data: {
      customerName,
      customerPhone,
      customerAddress,
      items: {
        create: items,
      },
    },
  });

  revalidatePath("/orders");
  redirect("/orders");
}

export async function updateOrder(orderId: string, formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const customerAddress = formData.get("customerAddress") as string;
  const itemCount = parseInt(formData.get("itemCount") as string || "1");

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

  revalidatePath("/orders");
  redirect("/orders");
}
