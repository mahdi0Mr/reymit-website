// src/lib/machine-config.ts
// حل و فصل تنظیمات زمان‌بندی برنامه: ترکیب تنظیمات سراسری (MachineConfig) با تنظیمات اختصاصی هر دستگاه (MachineConfigOverride)
// فیلدی که در override خالی باشد از سراسری گرفته می‌شود.
import prisma from "@/lib/prisma";

export const GLOBAL_CONFIG_ID = "global";

export const DEFAULT_CONFIG = {
  messageCheckInterval: 60,
  statusUpdateInterval: 60,
  versionCheckInterval: 600,
  donationPollInterval: 5,
} as const;

export type MachineConfigData = {
  messageCheckInterval: number;
  statusUpdateInterval: number;
  versionCheckInterval: number;
  donationPollInterval: number;
};

// دریافت (یا ساخت) رکورد سراسری — تک‌رکورد singleton با id ثابت
export async function getBaseConfig() {
  let config = await prisma.machineConfig.findFirst();
  if (!config) {
    config = await prisma.machineConfig.create({
      data: { id: GLOBAL_CONFIG_ID, ...DEFAULT_CONFIG },
    });
  }
  return config;
}

// تنظیمات نهایی که اپلیکیشن باید استفاده کند
export async function resolveMachineConfig(machineId?: string | null): Promise<MachineConfigData> {
  const base = await getBaseConfig();

  if (!machineId) {
    return {
      messageCheckInterval: base.messageCheckInterval,
      statusUpdateInterval: base.statusUpdateInterval,
      versionCheckInterval: base.versionCheckInterval,
      donationPollInterval: base.donationPollInterval,
    };
  }

  const override = await prisma.machineConfigOverride.findUnique({ where: { machineId } });
  return {
    messageCheckInterval: override?.messageCheckInterval ?? base.messageCheckInterval,
    statusUpdateInterval: override?.statusUpdateInterval ?? base.statusUpdateInterval,
    versionCheckInterval: override?.versionCheckInterval ?? base.versionCheckInterval,
    donationPollInterval: override?.donationPollInterval ?? base.donationPollInterval,
  };
}

// محدوده‌های مجاز برای هر فیلد (برای اعتبارسنجی در صفحات ادمین)
export const CONFIG_MIN_VALUES = {
  messageCheckInterval: 5,
  statusUpdateInterval: 5,
  versionCheckInterval: 60,
  donationPollInterval: 1,
} as const;
