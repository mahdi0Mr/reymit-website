import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MonitorPlay, MonitorX, Monitor, MonitorOff, Server, HardDrive, Eye } from 'lucide-react';
import AutoRefresh from './AutoRefresh';
import { PERMISSIONS } from '@/lib/permissions';
import { requirePermission } from '@/lib/permissions-server';

// [مهم] این صفحه باید در هر درخواست با دیتای زنده رندر شود، نه به‌صورت استاتیک هنگام بیلد
export const dynamic = 'force-dynamic';

// [جدید] لیست وضعیت برنامه‌های در حال اجرای کنترلر دونیت
// اگر اپ بیش از ۲ دقیقه heartbeat نفرستاده باشد (کرش یا بسته شدن ناگهانی)، آفلاین محسوب می‌شود
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

const getOnlineBadge = (online: boolean, lastSeenAt: Date) => {
  const isOnline = online && Date.now() - lastSeenAt.getTime() < ONLINE_THRESHOLD_MS;
  if (isOnline) {
    return { icon: <MonitorPlay size={16} className="text-green-400" />, text: 'آنلاین', color: 'text-green-400' };
  }
  return { icon: <MonitorX size={16} className="text-red-400" />, text: 'آفلاین', color: 'text-red-400' };
};

const getStreamingBadge = (running: boolean) => {
  if (running) {
    return { icon: <Monitor size={16} className="text-sky-400" />, text: 'فعال برای استریم', color: 'text-sky-400' };
  }
  return { icon: <MonitorOff size={16} className="text-gray-400" />, text: 'در حالت آماده‌باش', color: 'text-gray-400' };
};

export default async function AdminStatusPage() {
  const permError = await requirePermission(PERMISSIONS.VIEW_STATUS);
  if (permError) notFound();

  const apps = await prisma.appStatus.findMany({
    orderBy: { lastSeenAt: 'desc' },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <AutoRefresh />
      <h1 className="text-3xl font-bold mb-2">وضعیت برنامه‌ها</h1>
      <p className="text-gray-400 mb-8">
        لیست دستگاه‌هایی که نسخه کنترلر دونیت روی آن‌ها نصب و در حال اجراست.
      </p>

      <div className="bg-[#2a2a40] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-[#1e1e2e]">
            <tr>
              <th className="p-4">نام کامپیوتر</th>
              <th className="p-4">وضعیت</th>
              <th className="p-4 hidden md:table-cell">استریم</th>
              <th className="p-4 hidden sm:table-cell">آخرین آنلاین</th>
              <th className="p-4">شناسه دستگاه</th>
              <th className="p-4">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const onlineBadge = getOnlineBadge(app.online, app.lastSeenAt);
              const streamingBadge = getStreamingBadge(app.runningForStream);
              return (
                <tr key={app.machineId} className="border-t border-gray-700 hover:bg-[#3a3a52]">
                  <td className="p-4">
                    <div className="font-semibold flex items-center gap-2">
                      <Server size={16} className="text-gray-400 shrink-0" />
                      <span>{app.computerName}</span>
                    </div>
                    {app.platform && (
                      <div className="text-xs text-gray-500 mt-1">
                        پلتفرم: {app.platform}
                        {app.appVersion ? ` | نسخه ${app.appVersion}` : ''}
                      </div>
                    )}
                  </td>
                  <td className={`p-4 font-semibold ${onlineBadge.color}`}>
                    <div className="flex items-center gap-2">{onlineBadge.icon}<span>{onlineBadge.text}</span></div>
                  </td>
                  <td className={`p-4 font-semibold ${streamingBadge.color} hidden md:table-cell`}>
                    <div className="flex items-center gap-2">{streamingBadge.icon}<span>{streamingBadge.text}</span></div>
                  </td>
                  <td className="p-4 text-gray-400 hidden sm:table-cell">
                    {new Date(app.lastSeenAt).toLocaleString('fa-IR')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <HardDrive size={16} className="shrink-0" />
                      <code className="text-xs select-all" dir="ltr">{app.machineId}</code>
                    </div>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/status/${app.machineId}`}
                      className="inline-flex items-center gap-1.5 text-sm bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg transition"
                    >
                      <Eye size={16} />
                      جزئیات
                    </Link>
                  </td>
                </tr>
              );
            })}
            {apps.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-8 text-gray-500">
                  هیچ برنامه‌ای هنوز وضعیت خود را گزارش نکرده است.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}