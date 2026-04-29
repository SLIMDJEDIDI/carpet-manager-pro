"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";

export type DesignActionState = {
  error?: string | null;
  success?: boolean;
  design?: any;
};

/**
 * Standard Design Creation Action
 * Returns a state object for useActionState
 */
export async function createDesignAction(prevState: DesignActionState | null, formData: FormData): Promise<DesignActionState> {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const imageFile = formData.get("image") as File;

  if (!code || !name) return { error: "Design code and name are required." };
  if (!imageFile || imageFile.size === 0) return { error: "A valid image file is required." };

  let imageUrl: string;
  try {
    // 1. Upload to Vercel Blob
    const safeFilename = `design_${code.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.jpg`;
    const blob = await put(safeFilename, imageFile, {
      access: "public",
    });
    imageUrl = blob.url;
  } catch (e: any) {
    console.error("BLOB_UPLOAD_ERROR:", e);
    // Explicitly check for common issues like missing tokens
    if (e.message?.includes('READ_WRITE_TOKEN')) {
      return { error: "Storage configuration error (Token missing). Please contact admin." };
    }
    return { error: `Image upload failed: ${e.message}` };
  }

  try {
    // 2. Save to Database
    const design = await prisma.design.create({
      data: { code, name, imageUrl },
    });
    
    revalidatePath("/designs");
    // We don't redirect here because we want to return success for modals,
    // or we handle redirect in the component if needed.
    // Actually, for the /designs/new page, we WANT a redirect.
    // I will add a flag or handle it in the component.
    return { success: true, design };
  } catch (e: any) {
    console.error("DB_CREATE_ERROR:", e);
    if (e.code === 'P2002') return { error: "This design code already exists." };
    return { error: `Database error: ${e.message}` };
  }
}

/**
 * Update Design Action
 */
export async function updateDesignAction(id: string, formData: FormData) {
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

    await prisma.design.update({
      where: { id },
      data: { code, name, imageUrl },
    });
    
    revalidatePath("/designs");
  } catch (e: any) {
    console.error("UPDATE_DESIGN_ERROR:", e);
    throw e;
  }
  
  redirect("/designs");
}

/**
 * Delete Design Action
 */
export async function deleteDesignAction(id: string) {
  try {
    await prisma.design.delete({ where: { id } });
    revalidatePath("/designs");
    return { success: true };
  } catch (e: any) {
    console.error("DELETE_DESIGN_ERROR:", e);
    return { success: false, message: "Design is in use and cannot be deleted." };
  }
}
