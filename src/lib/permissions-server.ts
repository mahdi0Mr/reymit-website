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
 * دسترسی‌های ادمین فعلی: آیا سوپر ادمین است + لیست دسترسی‌های صریح.
 * اگر ادمین پیدا نشود null برمی‌گرداند.
 */
export async function getCurrentAdminAccess(): Promise<{
  isSuperAdmin: boolean;
  permissions: PermissionAction[];
} | null> {
  const adminId = await getCurrentAdmin();
  if (!adminId) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      isSuperAdmin: true,
      isActive: true,
      permissions: { select: { action: true } },
    },
  });

  if (!admin || !admin.isActive) return null;

  return {
    isSuperAdmin: admin.isSuperAdmin,
    permissions: admin.permissions.map((p) => p.action as PermissionAction),
  };
}

/**
 * بررسی اینکه آیا ادمین فعلی دسترسی مشخصی دارد یا خیر
 * سوپر ادمین (isSuperAdmin) همه دسترسی‌ها را دارد؛
 * سایر ادمین‌ها فقط دسترسی‌هایی که برایشان ذخیره شده است.
 */
export async function hasPermission(action: PermissionAction): Promise<boolean> {
  const access = await getCurrentAdminAccess();
  if (!access) return false;

  if (access.isSuperAdmin) return true;

  return access.permissions.includes(action);
}

/**
 * بررسی دسترسی و برگرداندن خطا در صورت عدم دسترسی (برای use در server actions و صفحات)
 */
export async function requirePermission(action: PermissionAction): Promise<string | null> {
  const has = await hasPermission(action);
  if (!has) return "شما دسترسی لازم برای این عملیات را ندارید.";
  return null;
}
