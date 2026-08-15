import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logMachineAction } from "@/app/actions/machineActions";
import { resolveMachineConfig } from "@/lib/machine-config";
import { resolveMachinePlatforms } from "@/lib/platform-config";

// [جدید] دریافت وضعیت برنامه کنترلر دونیت از سمت اپلیکیشن
// اپ هر ۶۰ ثانیه و هنگام تغییر وضعیت (شروع/توقف استریم، بستن برنامه) این داده‌ها را ارسال می‌کند
const statusSchema = z.object({
  machine_id: z.string().min(1),
  computer_name: z.string().min(1),
  online: z.boolean(),
  running_for_stream: z.boolean(),
  last_online: z.string().optional(),
  app_version: z.string().optional(),
  platform: z.string().optional(),
  window_target: z.string().optional(),
  platform_token_enc: z.string().optional(),
  donation_log_enc: z.string().optional(),
  app_log_enc: z.string().optional(),
  processed_message_ids: z.array(z.string()).optional(),
  // [جدید] لاگ‌های تغییر وضعیت از سمت اپ
  machine_logs: z.array(z.object({
    action: z.string(),
    details: z.any().optional(),
  })).optional(),
});

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON نامعتبر است." }, { status: 400 });
    }

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "مفاد ورودی نامعتبر است.", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      machine_id, computer_name, online, running_for_stream,
      app_version, platform, window_target, platform_token_enc,
      donation_log_enc, app_log_enc, processed_message_ids, machine_logs
    } = parsed.data;

    // دریافت وضعیت قبلی برای تشخیص تغییرات
    const prevStatus = await prisma.appStatus.findUnique({ where: { machineId: machine_id } });

    // بروزرسانی/ایجاد وضعیت
    await prisma.appStatus.upsert({
      where: { machineId: machine_id },
      update: {
        computerName: computer_name,
        online,
        runningForStream: running_for_stream,
        appVersion: app_version ?? null,
        platform: platform ?? null,
        windowTarget: window_target ?? null,
        platformTokenEnc: platform_token_enc ?? null,
        donationLogEnc: donation_log_enc ?? null,
        appLogEnc: app_log_enc ?? null,
        lastSeenAt: new Date(),
      },
      create: {
        machineId: machine_id,
        computerName: computer_name,
        online,
        runningForStream: running_for_stream,
        appVersion: app_version ?? null,
        platform: platform ?? null,
        windowTarget: window_target ?? null,
        platformTokenEnc: platform_token_enc ?? null,
        donationLogEnc: donation_log_enc ?? null,
        appLogEnc: app_log_enc ?? null,
        lastSeenAt: new Date(),
      },
    });

    // [جدید] ثبت خودکار تغییرات وضعیت در MachineLog
    if (prevStatus) {
      if (prevStatus.online !== online) {
        await logMachineAction(machine_id, online ? "online" : "offline", {}, "app");
      }
      if (prevStatus.runningForStream !== running_for_stream) {
        await logMachineAction(machine_id, running_for_stream ? "stream_start" : "stream_stop", { platform }, "app");
      }
    } else {
      // اولین بار که دستگاه گزارش می‌دهد
      await logMachineAction(machine_id, online ? "online" : "offline", {}, "app");
    }

    // [جدید] ذخیره لاگ‌های ارسالی از سمت اپ
    if (machine_logs && machine_logs.length > 0) {
      for (const log of machine_logs) {
        await logMachineAction(
          machine_id,
          log.action,
          log.details || {},
          "app"
        );
      }
    }

    // علامت‌گذاری پیام‌های دریافت‌شده
    if (processed_message_ids && processed_message_ids.length > 0) {
      await prisma.appMessage.updateMany({
        where: { id: { in: processed_message_ids } },
        data: { readAt: new Date() },
      });
    }

    // [جدید] دریافت تنظیمات زمان‌بندی — ترکیب سراسری + اختصاصی این دستگاه
    const config = await resolveMachineConfig(machine_id);

    // [جدید] بررسی وضعیت لایسنس این دستگاه
    // فقط وقتی false که لایسنس وجود داشته باشد و باطل/منقضی شده باشد؛
    // دستگاه بدون رکورد لایسنس معتبر محسوب می‌شود (جلوی غیرفعال شدن اشتباهی دکمه شروع را می‌گیرد)
    const licenseRow = await prisma.generatedLicense.findFirst({
      where: { machineId: machine_id },
      orderBy: { createdAt: "desc" },
    });
    const licenseValid = licenseRow ? !(licenseRow.revoked || licenseRow.expiryDate <= new Date()) : true;

    // [جدید] تعریف‌های پلتفرم‌های API تنظیم‌شده برای این دستگاه
    const platforms = await resolveMachinePlatforms(machine_id);

    // دریافت پیام‌های در انتظار
    const pendingMessages = await prisma.appMessage.findMany({
      where: {
        readAt: null,
        OR: [
          { machineId: machine_id },
          { machineId: null },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, message: true },
    });

    return NextResponse.json({
      ok: true,
      messages: pendingMessages.map((m) => ({ id: m.id, message: m.message })),
      // [جدید] تنظیمات برای اپلیکیشن
      config,
      // [جدید] وضعیت لایسنس
      license_valid: licenseValid,
      // [جدید] تعریف‌های پلتفرم‌های API برای این دستگاه
      platforms,
    });
  } catch (err) {
    console.error("Error saving app status:", err);
    return NextResponse.json({ error: "خطا در ذخیره وضعیت." }, { status: 500 });
  }
}