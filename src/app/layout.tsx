import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import './globals.css'
// این خط را با دقت بررسی کنید
import AuthProvider from './components/AuthProvider' // مسیر را چک کنید

const vazirmatn = Vazirmatn({ subsets: ['arabic'] })

export const metadata: Metadata = {
  title: 'کنترلر دونیت | Reymit & Donito',
  description: 'اتوماسیون هوشمند دونیت‌های Reymit و Donito برای استریمرها',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.className} bg-[#1e1e2e] text-[#cdd6f4]`}>
        {/* روش صحیح استفاده از کامپوننت */}
        <AuthProvider>
          {/* تمام فرزندان باید داخل Provider باشند */}
          {children} 
        </AuthProvider>
      </body>
    </html>
  )
}