// src/app/setup/page.tsx
// صفحه ساخت ادمین اول — فقط قبل از ثبت اولین ادمین فعال است.
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const adminCount = await prisma.admin.count();
  if (adminCount > 0) {
    redirect("/secret-admin-login");
  }

  // نمایش وضعیت واقعی متغیرهای محیطی در runtime برای عیب‌یابی
  const envStatus = {
    usernameSet: !!process.env.ADMIN_USERNAME,
    passwordSet: !!process.env.ADMIN_PASSWORD,
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">راه‌اندازی اولیه پنل مدیریت</h1>
        <p className="text-gray-400 text-center mb-6">
          هنوز هیچ ادمینی ساخته نشده است. ادمین اول (سوپر ادمین) را بسازید.
        </p>
        <div className="bg-[#1e1e2e] text-xs text-gray-400 p-3 rounded-lg mb-6 border border-gray-700 space-y-1">
          <p>وضعیت متغیرهای محیطی در runtime:</p>
          <p>ADMIN_USERNAME: {envStatus.usernameSet ? "✓ تنظیم شده" : "— تنظیم نشده"}</p>
          <p>ADMIN_PASSWORD: {envStatus.passwordSet ? "✓ تنظیم شده" : "— تنظیم نشده"}</p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}