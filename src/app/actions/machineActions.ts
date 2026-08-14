"use server";

import prisma from "@/lib/prisma";
import { generateLicense } from "@/lib/crypto";
import { requirePermission, getCurrentAdmin } from "@/lib/permissions-server";
import { PERMISSIONS } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// ====== مدیریت لایسنس ======

export async function getLicenseByMachineId(machineId: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.VIEW_STATUS);
    if (permError) return null;

    return prisma.generatedLicense.findFirst({
      where: { machineId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching license:", error);
    return null;
  }
}

export async function assignLicense(machineId: string, expiryDays: number) {
  try {
    const permError = await requirePermission(PERMISSIONS.GENERATE_LICENSE);
    if (permError) return { error: permError };

    if (!machineId || machineId.trim().length === 0) {
      return { error: "شناسه دستگاه معتبر نیست." };
    }
    if (expiryDays < 1 || expiryDays > 3650) {
      return { error: "مدت اعتبار باید بین 1 تا 3650 روز باشد." };
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    expiryDate.setHours(23, 59, 59, 999);

    const licenseKey = generateLicense(machineId, expiryDate);
    const adminId = await getCurrentAdmin();

    const license = await prisma.generatedLicense.create({
      data: {
        machineId,
        licenseKey,
        expiryDate,
        adminId: adminId || null,
      },
    });

    await logAction("assign_license", { machineId, expiryDays, licenseId: license.id });
    await logMachineAction(machineId, "license_assigned", { expiryDays, licenseId: license.id }, "admin");

    return { ok: true, licenseKey, id: license.id };
  } catch (error) {
    console.error("Error assigning license:", error);
    return { error: "خطا در تخصیص لایسنس." };
  }
}

export async function updateLicenseExpiry(licenseId: string, newExpiryDate: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.GENERATE_LICENSE);
    if (permError) return { error: permError };

    const dateObj = new Date(newExpiryDate);
    if (isNaN(dateObj.getTime())) {
      return { error: "تاریخ نامعتبر است." };
    }

    const license = await prisma.generatedLicense.update({
      where: { id: licenseId },
      data: { expiryDate: dateObj },
    });

    await logAction("update_license_expiry", { licenseId, newExpiryDate });
    await logMachineAction(license.machineId, "license_expiry_updated", { licenseId, newExpiryDate }, "admin");

    return { ok: true };
  } catch (error) {
    console.error("Error updating license expiry:", error);
    return { error: "خطا در بروزرسانی تاریخ انقضا." };
  }
}

export async function expireLicense(licenseId: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.GENERATE_LICENSE);
    if (permError) return { error: permError };

    const license = await prisma.generatedLicense.update({
      where: { id: licenseId },
      data: { revoked: true, revokedAt: new Date() },
    });

    await logAction("expire_license", { licenseId, machineId: license.machineId });
    await logMachineAction(license.machineId, "license_revoked", { licenseId }, "admin");

    return { ok: true };
  } catch (error) {
    console.error("Error expiring license:", error);
    return { error: "خطا در باطل کردن لایسنس." };
  }
}

// ====== تنظیمات زمان‌بندی ======

export async function getMachineConfig() {
  "use server";
  try {
    let config = await prisma.machineConfig.findFirst();
    if (!config) {
      config = await prisma.machineConfig.create({
        data: {
          id: "global",
          messageCheckInterval: 60,
          statusUpdateInterval: 60,
          versionCheckInterval: 600,
          donationPollInterval: 5,
        },
      });
    }
    return config;
  } catch (error) {
    console.error("Error fetching machine config:", error);
    return null;
  }
}

export async function updateMachineConfig(data: {
  messageCheckInterval: number;
  statusUpdateInterval: number;
  versionCheckInterval: number;
  donationPollInterval: number;
}) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_ADMINS);
    if (permError) return { error: permError };

    // Validate ranges
    if (data.messageCheckInterval < 5 || data.statusUpdateInterval < 5 ||
        data.versionCheckInterval < 60 || data.donationPollInterval < 1) {
      return { error: "مقادیر وارد شده در محدوده مجاز نیستند." };
    }

    let config = await prisma.machineConfig.findFirst();
    if (!config) {
      config = await prisma.machineConfig.create({
        data: { id: "global", ...data },
      });
    } else {
      config = await prisma.machineConfig.update({
        where: { id: config.id },
        data,
      });
    }

    await logAction("update_machine_config", data);
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    console.error("Error updating machine config:", error);
    return { error: "خطا در بروزرسانی تنظیمات." };
  }
}

// ====== تاریخچه تغییرات دستگاه ======

export async function logMachineAction(
  machineId: string,
  action: string,
  details?: Record<string, unknown>,
  source: string = "app"
) {
  try {
    await prisma.machineLog.create({
      data: {
        machineId,
        action,
        details: details ? JSON.stringify(details) : null,
        source,
      },
    });
  } catch (error) {
    console.error("Error logging machine action:", error);
  }
}

export async function getMachineLogs(machineId: string, limit = 50) {
  try {
    const permError = await requirePermission(PERMISSIONS.VIEW_STATUS);
    if (permError) return [];

    return prisma.machineLog.findMany({
      where: { machineId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Error fetching machine logs:", error);
    return [];
  }
}

// ====== لیست نسخه‌ها ======

export async function getAllAppFiles() {
  try {
    const permError = await requirePermission(PERMISSIONS.UPLOAD_VERSIONS);
    if (permError) return [];

    return prisma.appFile.findMany({
      orderBy: { releaseDate: "desc" },
    });
  } catch (error) {
    console.error("Error fetching app files:", error);
    return [];
  }
}