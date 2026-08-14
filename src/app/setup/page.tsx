// src/app/setup/page.tsx
// راه‌اندازی اولیه / بازیابی: اگر ادمینی وجود نداشته باشد ادمین اول ساخته می‌شود؛
// اگر وجود داشته باشد با تطبیق با متغیرهای محیطی رمز آن بازنشانی می‌شود.
import prisma from "@/lib/prisma";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const adminCount = await prisma.admin.count();

  // وضعیت واقعی متغیرهای محیطی در runtime برای عیب‌یابی
  const envStatus = {
    usernameSet: !!process.env.ADMIN_USERNAME,
    passwordSet: !!process.env.ADMIN_PASSWORD,
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        {adminCount === 0 ? (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">راه‌اندازی اولیه پنل مدیریت</h1>
            <p className="text-gray-400 text-center mb-6">
              هنوز هیچ ادمینی ساخته نشده است. اولین ادمین (سوپر ادمین) را بسازید.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">بازیابی رمز ادمین</h1>
            <p className="text-gray-400 text-center mb-6">
              یک ادمین قبلاً ساخته شده است. برای بازیابی، دقیقاً با مقادیر ADMIN_USERNAME و ADMIN_PASSWORD
              (متغیرهای محیطی Vercel) وارد شوید تا رمز بازنشانی شود.
            </p>
          </>
        )}
        <div className="bg-[#1e1e2e] text-xs text-gray-400 p-3 rounded-lg mb-6 border border-gray-700 space-y-1">
          <p>وضعیت متغیرهای محیطی در runtime:</p>
          <p>ADMIN_USERNAME: {envStatus.usernameSet ? "✓ تنظیم شده" : "— تنظیم نشده"}</p>
          <p>ADMIN_PASSWORD: {envStatus.passwordSet ? "✓ تنظیم شده" : "— تنظیم نشده"}</p>
        </div>
        <SetupForm mode={adminCount === 0 ? "create" : "recover"} />
      </div>
    </div>
  );
}