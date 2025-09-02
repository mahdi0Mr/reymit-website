"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { createAppFile } from "@/app/actions/adminActions";

export default function UploadForm() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStatus("");

    const file = inputFileRef.current?.files?.[0];
    if (!file) {
      setError("لطفا یک فایل را برای آپلود انتخاب کنید.");
      return;
    }
    if (!version || !changelog) {
      setError("لطفا فیلدهای نسخه و تغییرات را پر کنید.");
      return;
    }

    setStatus("در حال آپلود فایل...");

    // filename امن و یکتا (حذف کاراکترهای مشکل‌ساز)
    const safeVersion = version.replace(/[^\w.-]/g, "_");
    const candidateFilename = `ReymitController_v${safeVersion}_${file.name}`;

    try {
      // prepare options as generic record to avoid using `any`
      const opts1: Record<string, unknown> = {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        // credentials: "include", // اگر لازم شد؛ می‌توانید فعال کنید
      };

      let newBlob;
      try {
        // تلاش اول با نام مشخص (candidateFilename)
        newBlob = await upload(candidateFilename, file, opts1 as any);
        // NOTE: upload signature expects UploadOptions; we cast here narrowly so TS doesn't complain.
        // We do NOT use `any` for our local variables; only this cast to satisfy the client lib typings.
      } catch (innerErr: unknown) {
        // innerErr ممکن است هر چیزی باشد؛ متن پیام را استخراج می‌کنیم
        const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);

        // اگر ارور وجود blob تکراری باشد، مجدداً با addRandomSuffix تلاش کن
        if (msg.includes("already exists") || msg.includes("This blob already exists")) {
          const opts2: Record<string, unknown> = {
            access: "public",
            handleUploadUrl: "/api/admin/upload",
            addRandomSuffix: true,
          };
          newBlob = await upload(file.name, file, opts2 as any);
        } else {
          throw innerErr;
        }
      }

      setStatus("فایل آپلود شد. در حال ذخیره اطلاعات در دیتابیس...");

      // ارسال متادیتا به server action
      const result = await createAppFile({
        version,
        changelog,
        fileName: candidateFilename,
        url: newBlob.url,
      });

      if (result.error) {
        setError(result.error);
        setStatus("");
      } else {
        setStatus("نسخه جدید با موفقیت ثبت شد!");
        setVersion("");
        setChangelog("");
        if (inputFileRef.current) inputFileRef.current.value = "";
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      if (err instanceof Error) setError(`خطا در آپلود: ${err.message}`);
      else setError("یک خطای ناشناخته در هنگام آپلود رخ داد.");
      setStatus("");
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
          accept=".zip"
          required
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="version" className="block mb-2 font-bold text-gray-300">شماره نسخه (مثلا 5.6)</label>
        <input
          type="text"
          id="version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          required
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
        />
      </div>

      <div>
        <label htmlFor="changelog" className="block mb-2 font-bold text-gray-300">تغییرات جدید (Changelog)</label>
        <textarea
          id="changelog"
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          rows={8}
          required
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
          placeholder="هر تغییر را در یک خط جدید بنویسید..."
        />
      </div>

      <button
        type="submit"
        disabled={!!status && !error}
        className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {status && !error ? "در حال پردازش..." : "آپلود و ثبت نسخه"}
      </button>
    </form>
  );
}
