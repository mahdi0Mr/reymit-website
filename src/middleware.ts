import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. مسیر فعلی را بررسی کن
  const path = request.nextUrl.pathname;

  // 2. اگر مسیر مربوط به پنل ادمین است...
  if (path.startsWith('/admin')) {
    // 3. کوکی احراز هویت را بخوان
    const isAdminAuthenticated = request.cookies.get('admin-auth')?.value === 'true';

    // 4. اگر کاربر احراز هویت نشده...
    if (!isAdminAuthenticated) {
      // 5. او را به صفحه لاگین مخفی هدایت کن
      const loginUrl = new URL('/secret-admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 6. در غیر این صورت، به او اجازه عبور بده
  return NextResponse.next();
}

// 7. این middleware را روی تمام مسیرهای ادمین اعمال کن
export const config = {
  matcher: [
    '/admin', // خود مسیر /admin
    '/admin/:path*', // تمام زیرمسیرهای /admin
  ],
};