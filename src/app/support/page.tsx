import NewTicketForm from './NewTicketForm';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NewTicketPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-sky-400">ارسال تیکت پشتیبانی</h1>
          {/* [جدید] دکمه بازگشت */}
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowRight size={18} />
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </div>
        <p className="text-center text-gray-400 mb-10">
          مشکل خود را با جزئیات شرح دهید. پس از ارسال، یک کد پیگیری برای بررسی وضعیت تیکت خود دریافت خواهید کرد.
        </p>
        <NewTicketForm />
      </div>
    </main>
  );
}