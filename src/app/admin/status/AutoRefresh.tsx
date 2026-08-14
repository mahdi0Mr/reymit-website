'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// [جدید] هر ۳۰ ثانیه صفحه را بدون رفرش کامل مرورگر دوباره رندر می‌کند
// تا وضعیت آنلاین/آفلاین و «آخرین آنلاین» همیشه به‌روز بماند
export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}