import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import './globals.css'

// AuthProvider و import آن کاملاً حذف شده است

const vazirmatn = Vazirmatn({ subsets: ['arabic'] })

export const metadata: Metadata = {
  title: 'کنترلر دونیت | Reymit & Donito',
  description: 'اتوماسون هوشمند دونیت‌های Reymit و Donito برای استریمرها',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      {/* تگ body دیگر AuthProvider را ندارد */}
      <body className={`${vazirmatn.className} bg-[#1e1e2e] text-[#cdd6f4]`}>
        {children}
      </body>
    </html>
  )
}