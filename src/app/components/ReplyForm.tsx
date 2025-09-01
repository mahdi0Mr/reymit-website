"use client";

import { useState } from 'react';
import { addReplyToTicket } from '@/app/actions/adminActions';

interface ReplyFormProps {
  ticketId: string;
  currentStatus: string;
}

export default function ReplyForm({ ticketId, currentStatus }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!content) {
      setError('متن پاسخ نمی‌تواند خالی باشد.');
      return;
    }

    try {
      const result = await addReplyToTicket({ ticketId, content, status });
      if (result.error) {
        setError(result.error);
      } else {
        setMessage('پاسخ شما با موفقیت ثبت شد. صفحه به زودی رفرش می‌شود...');
        setContent('');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setError('خطایی در سرور رخ داد.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-6">ارسال پاسخ جدید</h2>
      {message && <div className="bg-green-800 text-green-200 p-3 rounded-md mb-4">{message}</div>}
      {error && <div className="bg-red-800 text-red-200 p-3 rounded-md mb-4">{error}</div>}

      <div className="mb-4">
        <label htmlFor="content" className="block mb-2 font-bold">متن پاسخ</label>
        <textarea
          id="content"
          rows={7}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="status" className="block mb-2 font-bold">تغییر وضعیت تیکت</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
        >
          <option value="OPEN">باز</option>
          <option value="ANSWERED">پاسخ داده شده</option>
          <option value="CLOSED">بسته شده</option>
        </select>
      </div>

      <button type="submit" className="w-full bg-sky-600 text-white font-bold py-3 rounded-lg hover:bg-sky-700">
        ارسال پاسخ
      </button>
    </form>
  );
}