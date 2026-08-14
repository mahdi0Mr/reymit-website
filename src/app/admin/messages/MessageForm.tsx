"use client";

import { useState } from 'react';
import { sendAppMessage } from '@/app/actions/adminActions';

export interface MessageTarget {
  machineId: string;
  computerName: string;
}

interface MessageFormProps {
  machines: MessageTarget[];
  initialMachineId?: string;
}

export default function MessageForm({ machines, initialMachineId }: MessageFormProps) {
  // مقدار اولیه: اگر از صفحه جزئیات آمده باشیم دستگاه مشخص است، وگرنه «همه دستگاه‌ها»
  const [machineId, setMachineId] = useState(initialMachineId || '');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!content.trim()) {
      setError('متن پیام نمی‌تواند خالی باشد.');
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.set('machine_id', machineId);
      formData.set('message', content);

      const result = await sendAppMessage(formData);
      if (result.error) {
        setError(result.error);
      } else {
        const targetLabel = machineId
          ? 'دستگاه انتخاب‌شده'
          : 'همه دستگاه‌ها';
        setMessage(
          `پیام با موفقیت ارسال شد (به ${targetLabel}). در heartbeat بعدی به برنامه می‌رسد.`
        );
        setContent('');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setError('خطایی در ارسال پیام رخ داد.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-6">ارسال پیام به برنامه</h2>

      {message && <div className="bg-green-800 text-green-200 p-3 rounded-md mb-4">{message}</div>}
      {error && <div className="bg-red-800 text-red-200 p-3 rounded-md mb-4">{error}</div>}

      <div className="mb-4">
        <label htmlFor="target" className="block mb-2 font-bold">مخاطب</label>
        <select
          id="target"
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
        >
          <option value="">همه دستگاه‌ها (broadcast)</option>
          {machines.map((m) => (
            <option key={m.machineId} value={m.machineId}>
              {m.computerName} — {m.machineId.slice(0, 8)}...
            </option>
          ))}
        </select>
        {machineId && (
          <p className="text-xs text-gray-500 mt-1">
            فقط به دستگاه <b dir="ltr">{machines.find((m) => m.machineId === machineId)?.computerName}</b> ارسال می‌شود.
          </p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="message-content" className="block mb-2 font-bold">متن پیام</label>
        <textarea
          id="message-content"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="متن پیامی که روی دستگاه‌های هدف به‌صورت پاپ‌آپ نمایش داده می‌شود..."
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-sky-600 text-white font-bold py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50"
      >
        {sending ? 'در حال ارسال...' : 'ارسال پیام'}
      </button>
    </form>
  );
}
