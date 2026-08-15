"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions-server";
import { PERMISSIONS } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { logMachineAction } from "./machineActions";

// ====== کاتالوگ سراسری پلتفرم‌های API ======

export type PlatformFormData = {
  key: string;
  displayName: string;
  apiUrl: string;
  listPath: string;
  idField: string;
  nameField: string;
  amountField: string;
  amountUnit: "toman" | "rial";
  advancedJson: string | null;
  enabled: boolean;
};

function validatePlatformData(data: PlatformFormData): string | null {
  if (!data.key || !/^[a-zA-Z0-9_\-]+$/.test(data.key.trim())) {
    return "شناسه پلتفرم باید فقط شامل حروف، اعداد، _ یا - باشد.";
  }
  if (!data.displayName || data.displayName.trim().length === 0) {
    return "نام نمایشی پلتفرم را وارد کنید.";
  }
  if (!data.apiUrl || !data.apiUrl.includes("{token}")) {
    return "آدرس API باید شامل {token} باشد (توکن کاربر در همین محل جایگزین می‌شود).";
  }
  if (!data.listPath || data.listPath.trim().length === 0) {
    return "مسیر لیست دونیت‌ها را وارد کنید (مثال: data یا data.data).";
  }
  if (data.amountUnit !== "toman" && data.amountUnit !== "rial") {
    return "واحد مبلغ باید toman یا rial باشد.";
  }
  if (data.advancedJson && data.advancedJson.trim() !== "") {
    try {
      const parsed = JSON.parse(data.advancedJson);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return "JSON پیشرفته باید یک شیء باشد (مثلاً برای header ها).";
      }
    } catch {
      return "JSON پیشرفته نامعتبر است.";
    }
  }
  return null;
}

export async function getPlatformCatalog() {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
    if (permError) return null;

    return prisma.apiPlatform.findMany({
      orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
    });
  } catch (error) {
    console.error("Error fetching platform catalog:", error);
    return null;
  }
}

export async function createPlatform(data: PlatformFormData) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
    if (permError) return { error: permError };

    const validationError = validatePlatformData(data);
    if (validationError) return { error: validationError };

    const existing = await prisma.apiPlatform.findUnique({ where: { key: data.key.trim() } });
    if (existing) return { error: "پلتفرمی با این شناسه (key) قبلاً ثبت شده است." };

    const platform = await prisma.apiPlatform.create({
      data: {
        key: data.key.trim(),
        displayName: data.displayName.trim(),
        apiUrl: data.apiUrl.trim(),
        listPath: data.listPath.trim(),
        idField: data.idField.trim() || "id",
        nameField: data.nameField.trim() || "name",
        amountField: data.amountField.trim() || "amount",
        amountUnit: data.amountUnit,
        advancedJson: data.advancedJson?.trim() ? data.advancedJson : null,
        enabled: data.enabled,
      },
    });

    await logAction("create_platform", { platformId: platform.id, key: platform.key, displayName: platform.displayName });
    revalidatePath("/admin/platforms");
    return { ok: true, id: platform.id };
  } catch (error) {
    console.error("Error creating platform:", error);
    return { error: "خطا در افزودن پلتفرم." };
  }
}

export async function updatePlatform(id: string, data: PlatformFormData) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
    if (permError) return { error: permError };

    const validationError = validatePlatformData(data);
    if (validationError) return { error: validationError };

    // چون key یکتا است، تغییر آن به روی پیوندهای per-machine تأثیر می‌گذارد؛ اجازه تغییر نمی‌دهیم
    const existing = await prisma.apiPlatform.findUnique({ where: { id } });
    if (!existing) return { error: "پلتفرم پیدا نشد." };

    const platform = await prisma.apiPlatform.update({
      where: { id },
      data: {
        displayName: data.displayName.trim(),
        apiUrl: data.apiUrl.trim(),
        listPath: data.listPath.trim(),
        idField: data.idField.trim() || "id",
        nameField: data.nameField.trim() || "name",
        amountField: data.amountField.trim() || "amount",
        amountUnit: data.amountUnit,
        advancedJson: data.advancedJson?.trim() ? data.advancedJson : null,
        enabled: data.enabled,
      },
    });

    await logAction("update_platform", { platformId: id, key: platform.key, displayName: platform.displayName });
    revalidatePath("/admin/platforms");
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (error) {
    console.error("Error updating platform:", error);
    return { error: "خطا در ویرایش پلتفرم." };
  }
}

export async function togglePlatformEnabled(id: string, enabled: boolean) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
    if (permError) return { error: permError };

    await prisma.apiPlatform.update({ where: { id }, data: { enabled } });
    await logAction("toggle_platform_enabled", { platformId: id, enabled });
    revalidatePath("/admin/platforms");
    return { ok: true };
  } catch (error) {
    console.error("Error toggling platform:", error);
    return { error: "خطا در تغییر وضعیت پلتفرم." };
  }
}

export async function deletePlatform(id: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
    if (permError) return { error: permError };

    // پیوندهای per-machine با onDelete: Cascade حذف می‌شوند
    await prisma.apiPlatform.delete({ where: { id } });
    await logAction("delete_platform", { platformId: id });
    revalidatePath("/admin/platforms");
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (error) {
    console.error("Error deleting platform:", error);
    return { error: "خطا در حذف پلتفرم." };
  }
}

// ====== فعال‌سازی per-machine ======

export async function getMachinePlatforms(machineId: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
    if (permError) return null;

    if (!machineId) return null;

    const links = await prisma.machinePlatform.findMany({
      where: { machineId },
      include: { platform: true },
      orderBy: { sortOrder: "asc" },
    });

    const catalog = await prisma.apiPlatform.findMany({
      orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
    });

    return {
      links: links.map((l) => ({
        id: l.id,
        machineId: l.machineId,
        platformId: l.platformId,
        enabled: l.enabled,
        sortOrder: l.sortOrder,
        platform: {
          id: l.platform.id,
          key: l.platform.key,
          displayName: l.platform.displayName,
          apiUrl: l.platform.apiUrl,
          listPath: l.platform.listPath,
          idField: l.platform.idField,
          nameField: l.platform.nameField,
          amountField: l.platform.amountField,
          amountUnit: l.platform.amountUnit,
          advancedJson: l.platform.advancedJson,
          enabled: l.platform.enabled,
          sortOrder: l.platform.sortOrder,
        },
      })),
      catalog: catalog.map((p) => ({
        id: p.id,
        key: p.key,
        displayName: p.displayName,
        apiUrl: p.apiUrl,
        listPath: p.listPath,
        idField: p.idField,
        nameField: p.nameField,
        amountField: p.amountField,
        amountUnit: p.amountUnit,
        advancedJson: p.advancedJson,
        enabled: p.enabled,
        sortOrder: p.sortOrder,
      })),
    };
  } catch (error) {
    console.error("Error fetching machine platforms:", error);
    return null;
  }
}

export async function setMachinePlatform(machineId: string, platformId: string, enabled: boolean) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
    if (permError) return { error: permError };

    if (!machineId || !platformId) return { error: "شناسه ناقص است." };

    const existing = await prisma.machinePlatform.findUnique({
      where: { machineId_platformId: { machineId, platformId } },
    });

    if (!existing) {
      await prisma.machinePlatform.create({
        data: { machineId, platformId, enabled },
      });
      const platform = await prisma.apiPlatform.findUnique({ where: { id: platformId } });
      await logMachineAction(machineId, "platform_enabled", { platformId, platformKey: platform?.key }, "admin");
    } else {
      await prisma.machinePlatform.update({
        where: { id: existing.id },
        data: { enabled },
      });
      const platform = await prisma.apiPlatform.findUnique({ where: { id: platformId } });
      await logMachineAction(machineId, enabled ? "platform_enabled" : "platform_disabled", { platformId, platformKey: platform?.key }, "admin");
    }

    await logAction("set_machine_platform", { machineId, platformId, enabled });
    revalidatePath(`/admin/status/${machineId}`);
    revalidatePath("/admin/platforms");
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (error) {
    console.error("Error setting machine platform:", error);
    return { error: "خطا در تنظیم پلتفرم دستگاه." };
  }
}

export async function removeMachinePlatform(machineId: string, platformId: string) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_PLATFORMS);
    if (permError) return { error: permError };

    if (!machineId || !platformId) return { error: "شناسه ناقص است." };

    await prisma.machinePlatform.deleteMany({ where: { machineId, platformId } });

    const platform = await prisma.apiPlatform.findUnique({ where: { id: platformId } });
    await logMachineAction(machineId, "platform_removed", { platformId, platformKey: platform?.key }, "admin");
    await logAction("remove_machine_platform", { machineId, platformId });
    revalidatePath(`/admin/status/${machineId}`);
    revalidatePath("/admin/platforms");
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (error) {
    console.error("Error removing machine platform:", error);
    return { error: "خطا در حذف پلتفرم دستگاه." };
  }
}
