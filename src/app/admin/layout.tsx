import Link from 'next/link';
import { adminLogout } from '@/app/actions/adminActions';

// این layout روی تمام صفحات زیرمجموعه /admin اعمال می‌شود
// (مثل /admin, /admin/tickets, /admin/upload)
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#181825]">
      <header className="bg-[#2a2a40] border-b border-gray-700">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-xl font-bold text-sky-400">
            پنل مدیریت
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/admin/tickets" className="text-gray-300 hover:text-white">
              مدیریت تیکت‌ها
            </Link>
            <Link href="/admin/upload" className="text-gray-300 hover:text-white">
              آپلود نسخه
            </Link>
            <form action={adminLogout}>
              <button 
                  type="submit" 
                  className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition"
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