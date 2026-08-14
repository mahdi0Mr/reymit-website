import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';
import { requirePermission } from '@/lib/permissions-server';

export const dynamic = 'force-dynamic';

// تابعی برای دریافت آیکون و رنگ بر اساس وضعیت تیکت
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'OPEN':
      return {
        icon: <Clock size={16} className="text-yellow-400" />,
        text: 'باز',
        color: 'text-yellow-400',
      };
    case 'ANSWERED':
      return {
        icon: <CheckCircle size={16} className="text-green-400" />,
        text: 'پاسخ داده شده',
        color: 'text-green-400',
      };
    case 'CLOSED':
      return {
        icon: <XCircle size={16} className="text-red-400" />,
        text: 'بسته شده',
        color: 'text-red-400',
      };
    default:
      return { icon: null, text: status, color: 'text-gray-400' };
  }
};

export default async function AdminTicketsPage() {
  const permError = await requirePermission(PERMISSIONS.MANAGE_TICKETS);
  if (permError) notFound();

  const tickets = await prisma.ticket.findMany({
    orderBy: {
      updatedAt: 'desc', // تیکت‌هایی که اخیراً آپدیت شده‌اند بالاتر باشند
    },
    include: {
        _count: { select: { replies: true } } // تعداد پاسخ‌ها را هم می‌گیریم
    }
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">مدیریت تیکت‌ها</h1>

      <div className="bg-[#2a2a40] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-[#1e1e2e]">
            <tr>
              <th className="p-4">موضوع</th>
              <th className="p-4 hidden md:table-cell">ایمیل کاربر</th>
              <th className="p-4">وضعیت</th>
              <th className="p-4 hidden sm:table-cell">آخرین بروزرسانی</th>
              <th className="p-4">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const badge = getStatusBadge(ticket.status);
              return (
                <tr key={ticket.id} className="border-t border-gray-700 hover:bg-[#3a3a52]">
                  <td className="p-4 font-semibold">{ticket.title}</td>
                  <td className="p-4 text-gray-400 hidden md:table-cell">{ticket.email}</td>
                  <td className={`p-4 font-semibold ${badge.color}`}>
                    <div className="flex items-center gap-2">
                        {badge.icon}
                        <span>{badge.text}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 hidden sm:table-cell">
                    {new Date(ticket.updatedAt).toLocaleString('fa-IR')}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="flex items-center justify-center gap-2 bg-sky-600 text-white py-1 px-3 rounded-md hover:bg-sky-700 transition"
                    >
                      <Eye size={16} />
                      <span className="hidden lg:inline">مشاهده</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {tickets.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-500">
                        هیچ تیکتی برای نمایش وجود ندارد.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}