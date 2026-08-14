// src/app/secret-admin-login/page.tsx
import Link from "next/link";
import prisma from "@/lib/prisma";
import LoginForm from './LoginForm';

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const adminCount = await prisma.admin.count();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">ورود به پنل مدیریت</h1>
        <LoginForm />
        {adminCount === 0 && (
          <p className="text-center mt-4 text-sm text-gray-400">
            هنوز ادمینی ساخته نشده؟{" "}
            <Link href="/setup" className="text-sky-400 hover:text-sky-300 font-bold">
              ساخت ادمین اول
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}