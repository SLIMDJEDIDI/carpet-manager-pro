"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";

export async function createDesignAction(formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image") as File;

  if (!code || !name || !imageFile || imageFile.size === 0) {
    throw new Error("Missing required fields or valid image file.");
  }

  let imageUrl: string;
  try {
    const safeFilename = `${code.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.jpg`;
    const blob = await put(safeFilename, imageFile, {
      access: "public",
    });
    imageUrl = blob.url;
  } catch (e: any) {
    console.error("BLOB_UPLOAD_CRITICAL_FAILURE:", e);
    throw new Error(`IMAGE_UPLOAD_FAILED: ${e.message}`);
  }

  try {
    await prisma.design.create({
      data: { code, name, imageUrl },
    });
  } catch (e: any) {
    console.error("DB_CREATE_CRITICAL_FAILURE:", e);
    if (e.code === 'P2002') throw new Error("DESIGN_CODE_ALREADY_EXISTS");
    throw new Error(`DATABASE_SAVE_FAILED: ${e.message}`);
  }

  revalidatePath("/designs");
  redirect("/designs");
}

export async function createDesignQuickAction(prevState: any, formData: FormData) {
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
    return { error: e.message || "Failed." };
  }
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
    return { success: false, message: "Design is in use." };
  }
}
