"use client";

import { useEffect, useRef } from 'react';
// [تغییر اصلی] هوک‌ها از 'react-dom' وارد می‌شوند
import { useFormState, useFormStatus } from 'react-dom'; 
import { addClientReply } from '@/app/actions/ticketActions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-sky-600 text-white font-bold py-3 rounded-lg hover:bg-sky-700 transition disabled:bg-gray-500"
    >
      {pending ? 'در حال ارسال...' : 'ارسال پاسخ'}
    </button>
  );
}

interface ClientReplyFormProps {
  ticketId: string;
  trackingId: string;
}

export default function ClientReplyForm({ ticketId, trackingId }: ClientReplyFormProps) {
  // [تغییر اصلی] نام هوک به useFormState تغییر کرد
  const [state, formAction] = useFormState(addClientReply, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // اگر ارسال موفق بود، فقط textarea را خالی کن
    if (state?.success) {
      if(textAreaRef.current) {
        textAreaRef.current.value = '';
      }
      // نیازی به ریست کامل فرم نیست چون فیلدهای مخفی باید باقی بمانند
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-8 bg-[#1e1e2e] p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4">پاسخ خود را بنویسید</h3>
      {state?.error && <p className="text-red-400 mb-4">{state.error}</p>}
      
      {/* فیلدهای مخفی برای ارسال ID ها به Server Action */}
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="trackingId" value={trackingId} />

      <textarea 
        name="content" 
        ref={textAreaRef}
        rows={5} 
        className="w-full bg-gray-900/50 border border-gray-600 rounded-md p-3 mb-4 focus:ring-sky-500 focus:border-sky-500"
        placeholder="پاسخ خود را اینجا تایپ کنید..."
        required
      />
      <SubmitButton />
    </form>
  );
}