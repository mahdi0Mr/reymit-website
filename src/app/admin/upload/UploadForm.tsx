"use client";

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { createAppFile } from '@/app/actions/adminActions'; // Server Action جدید

export default function UploadForm() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('');

    const file = inputFileRef.current?.files?.[0];
    if (!file) {
      setError('لطفا یک فایل را برای آپلود انتخاب کنید.');
      return;
    }
    if (!version || !changelog) {
      setError('لطفا فیلدهای نسخه و تغییرات را پر کنید.');
      return;
    }

    setStatus('در حال آپلود فایل...');

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
      });

      setStatus('فایل آپلود شد. در حال ذخیره اطلاعات در دیتابیس...');

      const result = await createAppFile({
        version,
        changelog,
        fileName: file.name,
        url: newBlob.url,
      });

      if (result.error) {
        setError(result.error);
        setStatus('');
      } else {
        setStatus('نسخه جدید با موفقیت ثبت شد!');
        // ریست کردن فرم
        setVersion('');
        setChangelog('');
        if(inputFileRef.current) inputFileRef.current.value = '';
      }

    } catch (err: any) {
      setError(`خطا در آپلود: ${err.message}`);
      setStatus('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700 space-y-6 max-w-2xl mx-auto">
      {status && <div className="bg-blue-800 border border-blue-600 text-blue-200 p-3 rounded-md text-center">{status}</div>}
      {error && <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md text-center">{error}</div>}

      <div>
        <label htmlFor="file" className="block mb-2 font-bold text-gray-300">فایل برنامه (.zip)</label>
        <input 
          type="file" 
          id="file" 
          ref={inputFileRef} 
          className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" 
          accept=".zip"
          required 
        />
      </div>

      <div>
        <label htmlFor="version" className="block mb-2 font-bold text-gray-300">شماره نسخه (مثلا 5.6)</label>
        <input 
          type="text" 
          id="version" 
          value={version} 
          onChange={e => setVersion(e.target.value)} 
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500" 
          required 
        />
      </div>
      
      <div>
        <label htmlFor="changelog" className="block mb-2 font-bold text-gray-300">تغییرات جدید (Changelog)</label>
        <textarea 
          id="changelog" 
          value={changelog} 
          onChange={e => setChangelog(e.target.value)} 
          rows={8} 
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500" 
          placeholder="هر تغییر را در یک خط جدید بنویسید..."
          required 
        />
      </div>

      <button 
        type="submit" 
        disabled={!!status && !error} // دکمه را در حین پردازش غیرفعال کن
        className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {status ? 'در حال پردازش...' : 'آپلود و ثبت نسخه'}
      </button>
    </form>
  );
}