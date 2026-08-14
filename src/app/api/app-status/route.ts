import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// [جدید] دریافت وضعیت برنامه کنترلر دونیت از سمت اپلیکیشن
// اپ هر ۶۰ ثانیه و هنگام تغییر وضعیت (شروع/توقف استریم، بستن برنامه) این داده‌ها را ارسال می‌کند:
//   machine_id, computer_name, online, running_for_stream, last_online, app_version, platform
const statusSchema = z.object({
  machine_id: z.string().min(1),
  computer_name: z.string().min(1),
  online: z.boolean(),
  running_for_stream: z.boolean(),
  last_online: z.string().optional(), // ساعت لوکال دستگاه؛ برای تشخیص آنلاین/آفلاین استفاده نمی‌شود
  app_version: z.string().optional(),
  platform: z.string().optional(),
  // [جدید] جزئیات پیشرفته (مقادیر حساس رمزنگاری‌شده از سمت اپ)
  window_target: z.string().optional(),
  platform_token_enc: z.string().optional(),
  donation_log_enc: z.string().optional(),
  app_log_enc: z.string().optional(),
  // [جدید] شناسه پیام‌هایی که برنامه دریافت کرده (برای علامت‌گذاری readAt)
  processed_message_ids: z.array(z.string()).optional(),
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

    const { machine_id, computer_name, online, running_for_stream, app_version, platform, window_target, platform_token_enc, donation_log_enc, app_log_enc, processed_message_ids } = parsed.data;

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
        lastSeenAt: new Date(), // زمان سرور؛ منبع معتبر برای آنلاین/آفلاین
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

    // [جدید] علامت‌گذاری پیام‌های دریافت‌شده (تأیید تحویل از سمت اپ)
    if (processed_message_ids && processed_message_ids.length > 0) {
      await prisma.appMessage.updateMany({
        where: { id: { in: processed_message_ids } },
        data: { readAt: new Date() },
      });
    }

    // [جدید] دریافت پیام‌های در انتظار برای این دستگاه (مشخص یا broadcast)
    const pendingMessages = await prisma.appMessage.findMany({
      where: {
        readAt: null,
        OR: [
          { machineId: machine_id },
          { machineId: null }, // broadcast برای همه
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, message: true },
    });

    return NextResponse.json({
      ok: true,
      messages: pendingMessages.map((m) => ({ id: m.id, message: m.message })),
    });
  } catch (err) {
    console.error("Error saving app status:", err);
    return NextResponse.json({ error: "خطا در ذخیره وضعیت." }, { status: 500 });
  }
}