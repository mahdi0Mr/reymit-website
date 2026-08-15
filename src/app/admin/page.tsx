import Link from 'next/link';
import { Ticket, UploadCloud, Monitor, MessageSquare, Users, KeyRound, ScrollText, Settings2, Globe } from 'lucide-react';
import { ROUTE_PERMISSION } from '@/lib/permissions';
import { getCurrentAdminAccess } from '@/lib/permissions-server';

export const dynamic = "force-dynamic";

const cards = [
  {
    href: "/admin/tickets",
    icon: <Ticket className="w-10 h-10 text-sky-400" />,
    title: "مدیریت تیکت‌ها",
    description: "مشاهده، بررسی و پاسخ به تیکت‌های ارسال شده توسط کاربران.",
    hoverColor: "hover:border-sky-500",
  },
  {
    href: "/admin/upload",
    icon: <UploadCloud className="w-10 h-10 text-green-400" />,
    title: "آپلود نسخه جدید",
    description: "آپلود فایل برنامه، تعیین شماره نسخه و ثبت تغییرات جدید (Changelog).",
    hoverColor: "hover:border-green-500",
  },
  {
    href: "/admin/status",
    icon: <Monitor className="w-10 h-10 text-purple-400" />,
    title: "وضعیت برنامه‌ها",
    description: "مشاهده وضعیت آنلاین، لاگ و اطلاعات برنامه‌های متصل کاربران.",
    hoverColor: "hover:border-purple-500",
  },
  {
    href: "/admin/messages",
    icon: <MessageSquare className="w-10 h-10 text-yellow-400" />,
    title: "پیام به برنامه‌ها",
    description: "ارسال پیام پاپ‌آپ به یک دستگاه خاص یا همه دستگاه‌ها.",
    hoverColor: "hover:border-yellow-500",
  },
  {
    href: "/admin/settings",
    icon: <Settings2 className="w-10 h-10 text-slate-400" />,
    title: "تنظیمات زمان‌بندی",
    description: "تنظیم بازه‌های بررسی پیام، ارسال وضعیت، آپدیت و دریافت دونیت.",
    hoverColor: "hover:border-slate-500",
  },
  {
    href: "/admin/platforms",
    icon: <Globe className="w-10 h-10 text-indigo-400" />,
    title: "مدیریت پلتفرم‌های API",
    description: "افزودن، ویرایش، غیرفعال و حذف پلتفرم‌های دریافت دونیت برای هر دستگاه.",
    hoverColor: "hover:border-indigo-500",
  },
  {
    href: "/admin/admins",
    icon: <Users className="w-10 h-10 text-pink-400" />,
    title: "مدیریت ادمین‌ها",
    description: "افزودن، ویرایش و مدیریت دسترسی ادمین‌های پنل.",
    hoverColor: "hover:border-pink-500",
  },
  {
    href: "/admin/licenses",
    icon: <KeyRound className="w-10 h-10 text-orange-400" />,
    title: "تولید لایسنس",
    description: "تولید کلید لایسنس جدید برای دستگاه‌های کاربران.",
    hoverColor: "hover:border-orange-500",
  },
  {
    href: "/admin/audit",
    icon: <ScrollText className="w-10 h-10 text-cyan-400" />,
    title: "گزارش فعالیت‌ها",
    description: "مشاهده تاریخچه تمام اقدامات انجام شده توسط ادمین‌ها.",
    hoverColor: "hover:border-cyan-500",
  },
];

export default async function AdminDashboardPage() {
  const access = await getCurrentAdminAccess();

  // فقط کارت‌هایی که ادمین دسترسی دارد نمایش داده می‌شود (سوپر ادمین همه را دارد)
  const visibleCards = access
    ? cards.filter((card) => {
        if (access.isSuperAdmin) return true;
        const required = ROUTE_PERMISSION[card.href];
        return !!required && access.permissions.includes(required);
      })
    : [];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-200 mb-4">به داشبورد خوش آمدید</h1>
      <p className="text-lg text-gray-400 mb-10">
        از منوی بالا یا کارت‌های زیر می‌توانید به بخش‌های مختلف پنل دسترسی داشته باشید.
      </p>

      {visibleCards.length === 0 ? (
        <div className="bg-[#2a2a40] p-10 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400 text-lg">
            برای این حساب هیچ دسترسی‌ای تنظیم نشده است. برای دریافت دسترسی با مدیر اصلی تماس بگیرید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`block bg-[#2a2a40] p-8 rounded-lg border border-gray-700 ${card.hoverColor} transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="flex items-center gap-4 mb-4">
                {card.icon}
                <h2 className="text-2xl font-bold">{card.title}</h2>
              </div>
              <p className="text-gray-400">{card.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
