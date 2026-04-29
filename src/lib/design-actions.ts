"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";

export type ActionState = {
  error?: string | null;
  success?: boolean;
  design?: any;
};

export async function createDesignQuickAction(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image") as File;

  if (!code || !name) return { error: "Code and name required." };
  if (!imageFile || imageFile.size === 0) return { error: "Image required." };

  try {
    const blob = await put(`${code}-${Date.now()}.jpg`, imageFile, { access: "public" });
    const design = await prisma.design.create({ data: { code, name, imageUrl: blob.url } });
    revalidatePath("/designs");
    return { success: true, design };
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "Design code exists." };
    return { error: e.message || "Failed." };
  }
}

export async function createDesignAction(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image") as File;

  if (!code || !name) {
    return { error: "Design code and name are required." };
  }

  if (!imageFile || imageFile.size === 0) {
    return { error: "A valid image file is required." };
  }

  let imageUrl: string;
  try {
    // Sanitize filename
    const safeFilename = `${code.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.jpg`;
    const blob = await put(safeFilename, imageFile, {
      access: "public",
    });
    imageUrl = blob.url;
  } catch (e: any) {
    console.error("Vercel Blob Upload Error:", e);
    return { error: "Failed to upload image to cloud storage. Please check connection." };
  }

  try {
    await prisma.design.create({
      data: {
        code,
        name,
        imageUrl,
      },
    });
  } catch (e: any) {
    console.error("Prisma Database Error:", e);
    if (e.code === 'P2002') {
      return { error: `Design code "${code}" already exists. Each design must have a unique code.` };
    }
    return { error: "Failed to save design to database. Please try again later." };
  }

  revalidatePath("/designs");
  redirect("/designs");
}

export async function updateDesign(id: string, formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image") as File;
  const existingImageUrl = formData.get("existingImageUrl") as string;

  try {
    let imageUrl = existingImageUrl;
    if (imageFile && imageFile.size > 0) {
      const blob = await put(`${code}-${Date.now()}.jpg`, imageFile, { access: "public" });
      imageUrl = blob.url;
    }

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
