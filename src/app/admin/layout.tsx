import Link from 'next/link';
import { adminLogout } from '@/app/actions/adminActions';

const navItems = [
  { href: "/admin/tickets", label: "مدیریت تیکت‌ها" },
  { href: "/admin/status", label: "وضعیت برنامه‌ها" },
  { href: "/admin/messages", label: "پیام به برنامه‌ها" },
  { href: "/admin/upload", label: "آپلود نسخه" },
  { href: "/admin/admins", label: "مدیریت ادمین‌ها" },
  { href: "/admin/licenses", label: "تولید لایسنس" },
  { href: "/admin/audit", label: "گزارش فعالیت‌ها" },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#181825]">
      <header className="bg-[#2a2a40] border-b border-gray-700">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-xl font-bold text-sky-400 whitespace-nowrap">
            پنل مدیریت
          </Link>
          <div className="flex items-center gap-4 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-white whitespace-nowrap text-sm"
              >
                {item.label}
              </Link>
            ))}
            <form action={adminLogout}>
              <button 
                  type="submit" 
                  className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition whitespace-nowrap"
              >
                  خروج
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}