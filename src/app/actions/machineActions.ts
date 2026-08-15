"use server";

import prisma from "@/lib/prisma";
import { generateLicense } from "@/lib/crypto";
import { requirePermission, getCurrentAdmin } from "@/lib/permissions-server";
import { PERMISSIONS } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { getBaseConfig, GLOBAL_CONFIG_ID, CONFIG_MIN_VALUES } from "@/lib/machine-config";

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

// [جدید] بازگردانی لایسنس باطل‌شده
export async function reinstateLicense(licenseId: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.GENERATE_LICENSE);
    if (permError) return { error: permError };

    const license = await prisma.generatedLicense.update({
      where: { id: licenseId },
      data: { revoked: false, revokedAt: null },
    });

    await logAction("reinstate_license", { licenseId, machineId: license.machineId });
    await logMachineAction(license.machineId, "license_reinstated", { licenseId }, "admin");

    return { ok: true, machineId: license.machineId };
  } catch (error) {
    console.error("Error reinstating license:", error);
    return { error: "خطا در بازگردانی لایسنس." };
  }
}

// ====== تنظیمات زمان‌بندی ======

export async function getMachineConfig() {
  "use server";
  try {
    return await getBaseConfig();
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
    const permError = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
    if (permError) return { error: permError };

    // Validate ranges
    if (data.messageCheckInterval < CONFIG_MIN_VALUES.messageCheckInterval ||
        data.statusUpdateInterval < CONFIG_MIN_VALUES.statusUpdateInterval ||
        data.versionCheckInterval < CONFIG_MIN_VALUES.versionCheckInterval ||
        data.donationPollInterval < CONFIG_MIN_VALUES.donationPollInterval) {
      return { error: "مقادیر وارد شده در محدوده مجاز نیستند." };
    }

    // حسابی مقاوم: اگر رکورد سراسری نبود بساز (id ثابت)
    await prisma.machineConfig.upsert({
      where: { id: GLOBAL_CONFIG_ID },
      update: data,
      create: { id: GLOBAL_CONFIG_ID, ...data },
    });

    await logAction("update_machine_config", data);
    revalidatePath("/admin/settings");
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (error) {
    console.error("Error updating machine config:", error);
    return { error: "خطا در بروزرسانی تنظیمات." };
  }
}

// ====== تنظیمات اختصاصی هر دستگاه (MachineConfigOverride) ======

export async function getMachineConfigOverride(machineId: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.VIEW_STATUS);
    if (permError) return null;

    if (!machineId) return null;
    return prisma.machineConfigOverride.findUnique({ where: { machineId } });
  } catch (error) {
    console.error("Error fetching machine config override:", error);
    return null;
  }
}

export async function updateMachineConfigOverride(
  machineId: string,
  data: {
    messageCheckInterval: number | null;
    statusUpdateInterval: number | null;
    versionCheckInterval: number | null;
    donationPollInterval: number | null;
  }
) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
    if (permError) return { error: permError };

    if (!machineId || machineId.trim().length === 0) {
      return { error: "شناسه دستگاه معتبر نیست." };
    }

    // اعتبارسنجی: فیلدهای خالی (null) یعنی بازگشت به سراسری
    const update = {
      messageCheckInterval: data.messageCheckInterval ?? null,
      statusUpdateInterval: data.statusUpdateInterval ?? null,
      versionCheckInterval: data.versionCheckInterval ?? null,
      donationPollInterval: data.donationPollInterval ?? null,
    };

    const valid = (
      (update.messageCheckInterval === null || update.messageCheckInterval >= CONFIG_MIN_VALUES.messageCheckInterval) &&
      (update.statusUpdateInterval === null || update.statusUpdateInterval >= CONFIG_MIN_VALUES.statusUpdateInterval) &&
      (update.versionCheckInterval === null || update.versionCheckInterval >= CONFIG_MIN_VALUES.versionCheckInterval) &&
      (update.donationPollInterval === null || update.donationPollInterval >= CONFIG_MIN_VALUES.donationPollInterval)
    );
    if (!valid) {
      return { error: "مقادیر وارد شده در محدوده مجاز نیستند." };
    }

    await prisma.machineConfigOverride.upsert({
      where: { machineId },
      update,
      create: { machineId, ...update },
    });

    await logAction("update_machine_config_override", { machineId, ...update });
    await logMachineAction(machineId, "config_changed", { override: true, ...update }, "admin");
    revalidatePath(`/admin/status/${machineId}`);
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (error) {
    console.error("Error updating machine config override:", error);
    return { error: "خطا در ذخیره تنظیمات اختصاصی." };
  }
}

export async function resetMachineConfigOverride(machineId: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
    if (permError) return { error: permError };

    if (!machineId) return { error: "شناسه دستگاه معتبر نیست." };

    await prisma.machineConfigOverride.deleteMany({ where: { machineId } });

    await logAction("reset_machine_config_override", { machineId });
    await logMachineAction(machineId, "config_changed", { override: false, reset: true }, "admin");
    revalidatePath(`/admin/status/${machineId}`);
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (error) {
    console.error("Error resetting machine config override:", error);
    return { error: "خطا در حذف تنظیمات اختصاصی." };
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