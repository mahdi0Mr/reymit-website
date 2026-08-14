import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const logSchema = z.object({
  machine_id: z.string().min(1),
  action: z.string().min(1),
  details: z.any().optional(),
  source: z.enum(["app", "admin"]).default("app"),
});

// POST /api/machine-log — دریافت لاگ از اپلیکیشن
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON نامعتبر است." }, { status: 400 });
    }

    const parsed = logSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "داده‌های ورودی نامعتبر است.", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { machine_id, action, details, source } = parsed.data;

    await prisma.machineLog.create({
      data: {
        machineId: machine_id,
        action,
        details: details ? JSON.stringify(details) : null,
        source,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error saving machine log:", err);
    return NextResponse.json({ error: "خطا در ذخیره لاگ." }, { status: 500 });
  }
}