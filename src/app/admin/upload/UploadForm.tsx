"use client";
import { useState } from 'react';
import { upload } from '@vercel/blob/client';
// یک Server Action برای ذخیره در دیتابیس می‌سازیم

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  // ... state برای نسخه، changelog و ...

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    const newBlob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/upload', // API Route برای آپلود
    });

    // حالا اطلاعات newBlob.url و بقیه فرم را با یک Server Action در دیتابیس ذخیره کنید
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* فیلدهای فرم برای فایل، نسخه، changelog و ... */}
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button type="submit">آپلود</button>
    </form>
  );
}