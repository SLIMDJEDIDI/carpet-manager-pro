"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "Invalid credentials." };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: "Invalid credentials." };
  }

  await login({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
