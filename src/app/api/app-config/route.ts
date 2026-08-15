import { NextResponse } from "next/server";
import { resolveMachineConfig } from "@/lib/machine-config";
import { resolveMachinePlatforms } from "@/lib/platform-config";

// GET /api/app-config — بازگرداندن تنظیمات زمان‌بندی برای اپلیکیشن
// ?machine_id= اختیاری — اگر داده شود، تنظیمات اختصاصی آن دستگاه اعمال می‌شود (در غیر این صورت سراسری)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get("machine_id") || null;

    const config = await resolveMachineConfig(machineId);
    // [جدید] تعریف‌های پلتفرم‌های API برای این دستگاه
    const platforms = await resolveMachinePlatforms(machineId);
    return NextResponse.json({ ...config, platforms });
  } catch (err) {
    console.error("Error fetching config:", err);
    return NextResponse.json({ error: "خطا در دریافت تنظیمات." }, { status: 500 });
  }
}
