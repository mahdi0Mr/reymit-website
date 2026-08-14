"use client";

import { useState, useRef, useEffect } from "react";
import { upload } from "@vercel/blob/client";
import { saveAppVersion, getLastAppFile } from "@/app/actions/adminActions";

export default function UploadForm() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customLink, setCustomLink] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // گرفتن آخرین نسخه در بار اول
  useEffect(() => {
    async function fetchLastVersion() {
      const lastFile = await getLastAppFile();
      if (lastFile) {
        setVersion(lastFile.version);
        setChangelog(lastFile.changelog);
        setFileUrl(lastFile.url);
        setFileName(lastFile.fileName);
      }
    }
    fetchLastVersion();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setIsSubmitting(true);

    if (!version || !changelog) {
      setError("لطفا فیلدهای نسخه و تغییرات را پر کنید.");
      setIsSubmitting(false);
      return;
    }

    const file = inputFileRef.current?.files?.[0];

    // یکی از سه گزینه باید انتخاب شود: آپلود فایل جدید، لینک کاستوم، یا حفظ لینک قبلی
    if (!file && !customLink.trim() && !fileUrl) {
      setError("برای انتشار نسخه، باید فایل آپلود کنید، لینک دانلود وارد کنید، یا نسخه قبلی را حفظ کنید.");
      setIsSubmitting(false);
      return;
    }

    setStatus("در حال پردازش...");

    try {
      let finalUrl = customLink.trim() || fileUrl;
      let finalFileName = fileName;

      if (file) {
        setStatus("در حال آپلود فایل جدید...");
        const newBlob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
        });
        finalUrl = newBlob.url;
        finalFileName = file.name;
      }

      const result = await saveAppVersion({
        version,
        changelog,
        fileName: finalFileName,
        url: finalUrl!,
      });

      if (result.error) {
        setError(result.error);
        setStatus("");
      } else {
        setStatus("نسخه با موفقیت ثبت یا به‌روزرسانی شد!");
      }
      setIsSubmitting(false);
    } catch (err: unknown) {
      if (err instanceof Error) setError(`خطا: ${err.message}`);
      else setError("یک خطای ناشناخته رخ داد.");
      setStatus("");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700 space-y-6 max-w-2xl mx-auto">
      {status && <div className="bg-blue-800 border border-blue-600 text-blue-200 p-3 rounded-md text-center">{status}</div>}
      {error && <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md text-center">{error}</div>}

      {fileUrl && <div className="bg-[#1e1e2e] p-3 rounded-md border border-gray-600">
        <p className="text-gray-300"><strong>آخرین نسخه:</strong> {version}</p>
        <p className="text-gray-300"><strong>تغییرات:</strong></p>
        <pre className="text-gray-400 whitespace-pre-wrap">{changelog}</pre>
        <a href={fileUrl} target="_blank" className="text-sky-400 underline mt-2 inline-block">دانلود فایل ({fileName})</a>
      </div>}

      <div>
        <label htmlFor="file" className="block mb-2 font-bold text-gray-300">فایل برنامه (.zip)</label>
        <input type="file" id="file" ref={inputFileRef} accept=".zip"
          className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
        <p className="text-gray-400 text-sm mt-1">آپلود فایل جدید اختیاری است.</p>
      </div>

      <div>
        <label htmlFor="customLink" className="block mb-2 font-bold text-gray-300">لینک دانلود کاستوم (اختیاری)</label>
        <input type="text" id="customLink" value={customLink} onChange={(e) => setCustomLink(e.target.value)}
          placeholder="مثال: https://example.com/app.zip"
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500"/>
      </div>

      <div>
        <label htmlFor="version" className="block mb-2 font-bold text-gray-300">شماره نسخه (مثلا 5.6)</label>
        <input type="text" id="version" value={version} onChange={(e) => setVersion(e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500" required/>
      </div>

      <div>
        <label htmlFor="changelog" className="block mb-2 font-bold text-gray-300">تغییرات جدید (Changelog)</label>
        <textarea id="changelog" value={changelog} onChange={(e) => setChangelog(e.target.value)} rows={8}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder="هر تغییر را در یک خط جدید بنویسید..." required/>
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed">
        {fileUrl ? "ویرایش نسخه" : "ایجاد نسخه جدید"}
      </button>
    </form>
  );
}
