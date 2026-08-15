// src/lib/platform-config.ts
// حل و فصل تعریف پلتفرم‌های API برای هر دستگاه
// اپلیکیشن (کنترلر دونیت) این تعریف‌ها را از heartbeat دریافت می‌کند و بدون کد اختصاصی دونیت می‌گیرد
import prisma from "@/lib/prisma";

// شکلی که اپلیکیشن می‌فهمد (کلیدها باید با سمت اپ هماهنگ باشند)
export interface ResolvedPlatform {
  key: string;
  displayName: string;
  apiUrl: string;
  listPath: string;
  idField: string;
  nameField: string;
  amountField: string;
  amountUnit: string; // "toman" | "rial"
  advancedJson: string | null;
  enabled: boolean;
  sortOrder: number;
}

// تعریف‌های پیش‌فرض (کاتالوگ خالی باشد) — تا اپلیکیشن بدون اینترنت هم کار کند
export const BUILTIN_PLATFORMS: ResolvedPlatform[] = [
  {
    key: "reymit",
    displayName: "Reymit",
    apiUrl: "https://api.reymit.ir/user/{token}/donates/last-donates",
    listPath: "data.donates",
    idField: "id",
    nameField: "name",
    amountField: "toman_amount",
    amountUnit: "toman",
    advancedJson: null,
    enabled: true,
    sortOrder: 0,
  },
  {
    key: "donito",
    displayName: "Donito",
    apiUrl: "https://donito.me/api/v1/thirdparty/{token}/donations/recent",
    listPath: "data",
    idField: "id",
    nameField: "nickname",
    amountField: "amount",
    amountUnit: "toman",
    advancedJson: null,
    enabled: true,
    sortOrder: 1,
  },
];

function toResolved(p: {
  key: string;
  displayName: string;
  apiUrl: string;
  listPath: string;
  idField: string;
  nameField: string;
  amountField: string;
  amountUnit: string;
  advancedJson: string | null;
  enabled: boolean;
  sortOrder: number;
}): ResolvedPlatform {
  return {
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
  };
}

// تعریف‌های نهایی که اپ باید استفاده کند:
// - اگر دستگاه پیوند (MachinePlatform) داشته باشد → فقط پیوندهای فعال آن دستگاه (مرتب‌شده)
// - وگرنه → پلتفرم‌های فعال کاتالوگ (پیش‌فرض: ریمیت + دونیتو)
export async function resolveMachinePlatforms(machineId?: string | null): Promise<ResolvedPlatform[]> {
  const catalog = await prisma.apiPlatform.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
  });

  if (!machineId) {
    return catalog.map(toResolved);
  }

  const links = await prisma.machinePlatform.findMany({
    where: { machineId },
    include: { platform: true },
    orderBy: { sortOrder: "asc" },
  });

  // بدون پیوند اختصاصی → برگشت به کاتالوگ فعال (سازگاری با دستگاه‌های قدیمی)
  if (links.length === 0) {
    return catalog.map(toResolved);
  }

  return links
    .filter((l) => l.enabled)
    .map((l) => {
      const p = l.platform;
      return { ...toResolved(p), enabled: l.enabled, sortOrder: l.sortOrder };
    });
}
