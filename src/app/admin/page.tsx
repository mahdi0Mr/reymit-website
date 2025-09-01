import Link from 'next/link';
import { Ticket, UploadCloud } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    // دیگر نیازی به div اصلی و container نیست چون در layout وجود دارد
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-200 mb-4">به داشبورد خوش آمدید</h1>
      <p className="text-lg text-gray-400 mb-10">
        از منوی بالا می‌توانید به بخش‌های مختلف پنل دسترسی داشته باشید.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* کارت مدیریت تیکت‌ها */}
        <Link href="/admin/tickets" className="block bg-[#2a2a40] p-8 rounded-lg border border-gray-700 hover:border-sky-500 transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-4 mb-4">
            <Ticket className="w-10 h-10 text-sky-400" />
            <h2 className="text-2xl font-bold">مدیریت تیکت‌ها</h2>
          </div>
          <p className="text-gray-400">
            مشاهده، بررسی و پاسخ به تیکت‌های ارسال شده توسط کاربران.
          </p>
        </Link>

        {/* کارت آپلود نسخه جدید */}
        <Link href="/admin/upload" className="block bg-[#2a2a40] p-8 rounded-lg border border-gray-700 hover:border-green-500 transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-4 mb-4">
            <UploadCloud className="w-10 h-10 text-green-400" />
            <h2 className="text-2xl font-bold">آپلود نسخه جدید</h2>
          </div>
          <p className="text-gray-400">
            آپلود فایل برنامه، تعیین شماره نسخه و ثبت تغییرات جدید (Changelog).
          </p>
        </Link>
      </div>
    </div>
  );
}