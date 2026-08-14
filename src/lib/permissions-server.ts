// src/lib/permissions-server.ts
// توابع بررسی دسترسی — فقط در سمت سرور قابل استفاده است

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import type { PermissionAction } from "./permissions";

/**
 * دریافت ادمین فعلی از کوکی session
 */
export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("admin-id")?.value;
  if (!adminId) return null;
  return adminId;
}

/**
 * بررسی اینکه آیا ادمین فعلی دسترسی مشخصی دارد یا خیر
 * ادمین بدون هیچ Permission ای سوپر ادمین محسوب می‌شود (دسترسی کامل)
 */
export async function hasPermission(action: PermissionAction): Promise<boolean> {
  const adminId = await getCurrentAdmin();

  if (!adminId) return false;

  // اگر کاربر سوپر ادمین باشد (بدون هیچ permission ذخیره شده) همه دسترسی‌ها را دارد
  const permissionCount = await prisma.permission.count({
    where: { adminId },
  });

  if (permissionCount === 0) return true; // سوپر ادمین

  // بررسی وجود دسترسی مشخص
  const perm = await prisma.permission.findUnique({
    where: { adminId_action: { adminId, action } },
  });

  return !!perm;
}

/**
 * بررسی دسترسی و برگرداندن خطا در صورت عدم دسترسی (برای use در server actions)
 */
export async function requirePermission(action: PermissionAction): Promise<string | null> {
  const has = await hasPermission(action);
  if (!has) return "شما دسترسی لازم برای این عملیات را ندارید.";
  return null;
}