import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/app-config — بازگرداندن تنظیمات زمان‌بندی برای اپلیکیشن
export async function GET() {
  try {
    let config = await prisma.machineConfig.findFirst();

    if (!config) {
      config = await prisma.machineConfig.create({
        data: { id: "global" },
      });
    }

    return NextResponse.json({
      messageCheckInterval: config.messageCheckInterval,
      statusUpdateInterval: config.statusUpdateInterval,
      versionCheckInterval: config.versionCheckInterval,
      donationPollInterval: config.donationPollInterval,
    });
  } catch (err) {
    console.error("Error fetching config:", err);
    return NextResponse.json({ error: "خطا در دریافت تنظیمات." }, { status: 500 });
  }
}