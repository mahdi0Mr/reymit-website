// src/app/admin/status/[machineId]/page.tsx
// صفحه جزئیات هر نسخه برنامه — نمایش اطلاعات پلتفرم، دونیت‌ها و لاگ برنامه
// داده‌های حساس (توکن، دونیت‌ها، لاگ) از سمت اپ رمزنگاری‌شده ارسال شده و این‌جا رمزگشایی می‌شوند
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Server, MonitorPlay, MonitorX, Monitor, MonitorOff,
  KeyRound, AppWindow, Coins, ScrollText, Rocket, HardDrive
} from 'lucide-react';
import { tryDecrypt } from '@/lib/crypto';

// [مهم] این صفحه باید در هر درخواست با دیتای زنده رندر شود
export const dynamic = 'force-dynamic';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

// ساختار یک رکورد دونیت که از اپ (رمزنگاری‌شده) می‌آید
type DonationRecord = {
  id?: string | number;
  name?: string;
  toman_amount?: number;
  platform?: string;
};

// معادل‌سازی نمایش نام پلتفرم
const platformLabel = (p: string | null) => {
  if (p === 'reymit') return 'Reymit';
  if (p === 'donito') return 'Donito';
  return p || 'نامشخص';
};

// ماسک کردن توکن برای امنیت بیشتر در نمایش (فقط ۶ کاراکتر اول + ...)
const maskToken = (token: string) => {
  if (!token) return '—';
  if (token.length <= 8) return token + '••••';
  return `${token.slice(0, 6)}••••••••${token.slice(-4)}`;
};

type Params = { machineId: string };

interface PageProps {
  params: Promise<Params>; // Next.js 15: params به صورت Promise پاس داده می‌شود
}

// تبدیل مبلغ به فرمت خوانا با جداکننده هزارگان
const formatToman = (amount: number | undefined) =>
  (amount ?? 0).toLocaleString('fa-IR') + ' تومان';

export default async function AppDetailPage({ params }: PageProps) {
  // ⚠️ حتماً params را await کن
  const { machineId } = await params;

  if (!machineId || typeof machineId !== 'string' || machineId.trim() === '') {
    return notFound();
  }

  const app = await prisma.appStatus.findUnique({ where: { machineId } });

  if (!app) {
    return notFound();
  }

  // رمزگشایی فیلدهای حساس
  const platformTokens = tryDecrypt<Record<string, string>>(app.platformTokenEnc);
  const donations = tryDecrypt<DonationRecord[]>(app.donationLogEnc);
  const appLog = tryDecrypt<string>(app.appLogEnc);

  // وضعیت آنلاین/آفلاین بر اساس آخرین heartbeat
  const isOnline = app.online && Date.now() - app.lastSeenAt.getTime() < ONLINE_THRESHOLD_MS;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* دکمه بازگشت */}
        <Link
          href="/admin/status"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowRight size={18} />
          بازگشت به لیست
        </Link>

        {/* هدر دستگاه */}
        <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Server className="text-sky-400" size={24} />
                {app.computerName}
              </h1>
              <div className="flex items-center gap-2 text-gray-400 mt-2">
                <HardDrive size={16} className="shrink-0" />
                <code className="text-xs select-all" dir="ltr">{app.machineId}</code>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${isOnline ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                {isOnline ? 'آنلاین' : 'آفلاین'}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${app.runningForStream ? 'bg-sky-900/50 text-sky-400' : 'bg-gray-700/50 text-gray-400'}`}>
                {app.runningForStream ? 'فعال برای استریم' : 'در حالت آماده‌باش'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-gray-400">
            <span>پلتفرم: <b className="text-gray-200">{platformLabel(app.platform)}</b></span>
            {app.appVersion && (
              <span className="flex items-center gap-1">
                <Rocket size={14} />
                نسخه {app.appVersion}
              </span>
            )}
            <span>آخرین آنلاین: <b className="text-gray-200" dir="ltr">{new Date(app.lastSeenAt).toLocaleString('fa-IR')}</b></span>
          </div>
        </div>

        {/* اطلاعات پلتفرم */}
        <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AppWindow className="text-sky-400" size={20} />
            اطلاعات هدف
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1e1e2e] p-4 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                <KeyRound size={14} />
                پنجره هدف
              </div>
              <p className="text-gray-200" dir="ltr">
                {app.windowTarget || 'ارسال به پنجره فعال (انتخاب نشده)'}
              </p>
            </div>
          </div>

          {/* توکن‌های پلتفرم (رمزگشایی‌شده اما ماسک‌شده) */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">توکن‌ها</h3>
            {platformTokens && Object.keys(platformTokens).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(platformTokens).map(([platform, token]) => (
                  <div key={platform} className="bg-[#1e1e2e] p-4 rounded-lg border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">{platformLabel(platform)}</div>
                    <code className="text-xs text-gray-200 select-all" dir="ltr">
                      {maskToken(token)}
                    </code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">هیچ توکنی ثبت نشده است.</p>
            )}
            <p className="text-xs text-gray-500 mt-2">⚠️ برای امنیت، توکن به‌صورت ناقص نمایش داده می‌شود.</p>
          </div>
        </div>

        {/* وضعیت استریم */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#2a2a40] p-5 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              {isOnline
                ? <MonitorPlay className="text-green-400" size={16} />
                : <MonitorX className="text-red-400" size={16} />}
              وضعیت برنامه
            </h3>
            <p className={`text-2xl font-bold mt-2 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {isOnline ? 'آنلاین' : 'آفلاین'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              آخرین heartbeat:
              <span dir="ltr"> {new Date(app.lastSeenAt).toLocaleString('fa-IR')}</span>
            </p>
          </div>
          <div className="bg-[#2a2a40] p-5 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              {app.runningForStream
                ? <Monitor className="text-sky-400" size={16} />
                : <MonitorOff className="text-gray-400" size={16} />}
              وضعیت استریم
            </h3>
            <p className={`text-2xl font-bold mt-2 ${app.runningForStream ? 'text-sky-400' : 'text-gray-400'}`}>
              {app.runningForStream ? 'فعال برای استریم' : 'در حالت آماده‌باش'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              پلتفرم فعال: <b className="text-gray-300">{platformLabel(app.platform)}</b>
            </p>
          </div>
        </div>

        {/* تاریخچه دونیت‌ها */}
        <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Coins className="text-green-400" size={20} />
            تاریخچه دونیت‌ها
          </h2>
          {donations && donations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#1e1e2e]">
                  <tr>
                    <th className="p-3">نام</th>
                    <th className="p-3">مبلغ</th>
                    <th className="p-3">پلتفرم</th>
                    <th className="p-3">شناسه</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d, idx) => (
                    <tr key={idx} className="border-t border-gray-700 hover:bg-[#3a3a52]">
                      <td className="p-3 text-gray-200">{d.name ?? 'ناشناس'}</td>
                      <td className="p-3 font-semibold text-green-400">{formatToman(d.toman_amount)}</td>
                      <td className="p-3 text-gray-400">{platformLabel(d.platform ?? null)}</td>
                      <td className="p-3 text-xs text-gray-500" dir="ltr">{d.id ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">هنوز دونیتی ثبت نشده است.</p>
          )}
        </div>

        {/* لاگ برنامه */}
        <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ScrollText className="text-sky-400" size={20} />
            لاگ برنامه
          </h2>
          {appLog ? (
            <pre
              dir="rtl"
              className="bg-black/70 text-green-300 text-xs p-4 rounded-lg overflow-auto max-h-[500px] whitespace-pre-wrap font-mono leading-relaxed"
            >
              {appLog}
            </pre>
          ) : (
            <p className="text-gray-500">لاگی ثبت نشده است.</p>
          )}
        </div>
      </div>
    </div>
  );
}
