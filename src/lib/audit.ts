// src/lib/audit.ts
// ثبت رویدادهای ادمین‌ها برای گزارش فعالیت‌ها

import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { getCurrentAdmin } from "./permissions-server";

/**
 * ثبت یک اقدام در لاگ فعالیت‌های ادمین
 */
export async function logAction(
  action: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const adminId = await getCurrentAdmin();
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;

    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        details: details ? JSON.stringify(details) : null,
        ip,
      },
    });
  } catch (error) {
    // لاگ خطا را خاموش نادیده می‌گیریم تا عملیات اصلی مختل نشود
    console.error("Audit log error:", error);
  }
}