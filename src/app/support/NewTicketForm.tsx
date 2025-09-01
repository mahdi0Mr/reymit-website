"use client";

import { useEffect, useRef } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTicket } from '@/app/actions/ticketActions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
    >
      {pending ? 'در حال ارسال...' : 'ارسال تیکت'}
    </button>
  );
}

export default function NewTicketForm() {
  const [state, formAction] = useActionState(createTicket, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // این هوک برای ریست کردن فرم پس از ارسال موفق استفاده می‌شود
  useEffect(() => {
    if (state?.trackingId) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700 space-y-6">
      
      {/* [تکمیل شده] بخش نمایش پیام موفقیت */}
      {state?.trackingId && (
        <div className="bg-green-800 border border-green-600 text-green-200 p-4 rounded-md text-center">
          <p className="font-bold text-lg">تیکت شما با موفقیت ثبت شد!</p>
          <p className="mt-2">کد پیگیری شما برای بررسی وضعیت تیکت:</p>
          <div className="mt-2">
            <strong className="select-all bg-gray-900 px-3 py-2 rounded-md text-lg tracking-wider font-mono">
              {state.trackingId}
            </strong>
          </div>
          <p className="text-sm mt-3 text-gray-300">این کد را کپی کرده و برای پیگیری‌های بعدی نزد خود نگه دارید.</p>
        </div>
      )}
      
      {/* [تکمیل شده] بخش نمایش پیام خطا */}
      {state?.error && (
        <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md text-center">
          {state.error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block mb-2 font-bold text-gray-300">ایمیل شما</label>
          <input type="email" name="email" id="email" className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500" required />
        </div>
        
        <div>
          <label htmlFor="contactInfo" className="block mb-2 font-bold text-gray-300">
            آیدی تلگرام یا دیسکورد <span className="text-red-400">*</span>
          </label>
          <input 
            type="text" 
            name="contactInfo" 
            id="contactInfo" 
            className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2" 
            placeholder="مثال: myUsername"
            required 
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block mb-2 font-bold text-gray-300">موضوع</label>
        <input type="text" name="title" id="title" className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2" required />
      </div>
      <div>
        <label htmlFor="content" className="block mb-2 font-bold text-gray-300">متن پیام</label>
        <textarea name="content" id="content" rows={6} className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2" required />
      </div>
      <SubmitButton />
    </form>
  );
}