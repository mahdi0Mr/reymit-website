// src/app/admin/messages/page.tsx
// صفحه ارسال پیام به برنامه‌ها + تاریخچه پیام‌های ارسالی
import prisma from '@/lib/prisma';
import MessageForm from './MessageForm';
import { notFound } from 'next/navigation';
import { MessageSquareText, Send, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';
import { requirePermission } from '@/lib/permissions-server';

export const dynamic = 'force-dynamic';

const statusBadge = (readAt: Date | null) => {
  if (readAt) {
    return {
      icon: <CheckCircle size={16} className="text-green-400" />,
      text: 'دریافت شده',
      color: 'text-green-400',
    };
  }
  return {
    icon: <Clock size={16} className="text-yellow-400" />,
    text: 'در انتظار دریافت',
    color: 'text-yellow-400',
  };
};

const formatDateTime = (date: Date) =>
  new Date(date).toLocaleString('fa-IR');

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ machineId?: string }>;
}) {
  const permError = await requirePermission(PERMISSIONS.SEND_MESSAGES);
  if (permError) notFound();

  const { machineId: initialMachineId } = (await searchParams) ?? {};

  // لیست دستگاه‌های شناخته‌شده برای dropdown
  const machines = await prisma.appStatus.findMany({
    orderBy: { computerName: 'asc' },
    select: { machineId: true, computerName: true },
  });

  // تاریخچه پیام‌ها
  const messages = await prisma.appMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // آخرین ۱۰۰ پیام
  });

  // نگاشت machineId به computerName برای نمایش
  const machineMap = new Map(machines.map((m) => [m.machineId, m.computerName]));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <MessageSquareText className="text-sky-400" size={28} />
          پیام به برنامه‌ها
        </h1>
        <p className="text-gray-400 mb-8">
          ارسال پیام پاپ‌آپ به یک دستگاه خاص یا همه دستگاه‌ها. پیام در heartbeat بعدی (حداکثر ۶۰ ثانیه) به برنامه می‌رسد.
        </p>

        {/* فرم ارسال */}
        <MessageForm
          machines={machines}
          initialMachineId={initialMachineId}
        />

        {/* تاریخچه */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock size={22} className="text-gray-400" />
            تاریخچه پیام‌ها
          </h2>

          {messages.length === 0 ? (
            <p className="text-gray-500">هنوز پیامی ارسال نشده است.</p>
          ) : (
            <div className="bg-[#2a2a40] rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-[#1e1e2e]">
                  <tr>
                    <th className="p-4">زمان ارسال</th>
                    <th className="p-4">مخاطب</th>
                    <th className="p-4">متن پیام</th>
                    <th className="p-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => {
                    const badge = statusBadge(msg.readAt);
                    const targetName = msg.machineId
                      ? machineMap.get(msg.machineId) || msg.machineId.slice(0, 12) + '...'
                      : 'همه دستگاه‌ها';
                    return (
                      <tr key={msg.id} className="border-t border-gray-700 hover:bg-[#3a3a52]">
                        <td className="p-4 text-gray-300 text-sm" dir="ltr">
                          {formatDateTime(msg.createdAt)}
                        </td>
                        <td className="p-4 text-gray-200 text-sm">{targetName}</td>
                        <td className="p-4 text-gray-300 text-sm max-w-xs truncate">
                          <span title={msg.message} className="block truncate">
                            {msg.message}
                          </span>
                        </td>
                        <td className={`p-4 text-sm font-semibold ${badge.color}`}>
                          <div className="flex items-center gap-2">
                            {badge.icon}
                            <span>{badge.text}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 p-4 text-center">
                نمایش آخرین ۱۰۰ پیام
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}