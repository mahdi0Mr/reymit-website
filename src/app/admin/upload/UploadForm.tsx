"use client";

import { useState, useRef, useEffect } from "react";
import { upload } from "@vercel/blob/client";
import { saveAppVersion, getLastAppFile } from "@/app/actions/adminActions";
import { getAllAppFiles } from "@/app/actions/machineActions";
import { toShamsiDate } from "@/lib/dates";
import { Pencil, Plus, ExternalLink } from "lucide-react";

interface AppFileRecord {
  id: string;
  version: string;
  fileName: string;
  url: string;
  changelog: string;
  releaseDate: Date;
}

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
  const [allVersions, setAllVersions] = useState<AppFileRecord[]>([]);

  // گرفتن آخرین نسخه و لیست تمام نسخه‌ها
  useEffect(() => {
    async function fetchData() {
      const [lastFile, versions] = await Promise.all([
        getLastAppFile(),
        getAllAppFiles(),
      ]);
      if (lastFile && !version) {
        setVersion(lastFile.version);
        setChangelog(lastFile.changelog);
        setFileUrl(lastFile.url);
        setFileName(lastFile.fileName);
      }
      setAllVersions(versions);
    }
    fetchData();
  }, []); // only version in deps to avoid loop

  const loadVersion = (v: AppFileRecord) => {
    setVersion(v.version);
    setChangelog(v.changelog);
    setFileUrl(v.url);
    setFileName(v.fileName);
    setCustomLink("");
    setStatus("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setVersion("");
    setChangelog("");
    setFileUrl(null);
    setFileName(null);
    setCustomLink("");
    setStatus("");
    setError("");
  };

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

    // یکی از سه گزینه: آپلود فایل جدید، لینک کاستوم، یا حفظ لینک قبلی
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
        // تازه‌سازی لیست نسخه‌ها
        const versions = await getAllAppFiles();
        setAllVersions(versions);
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* فرم آپلود/ویرایش */}
      <form onSubmit={handleSubmit} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700 space-y-6">
        {status && <div className="bg-blue-800 border border-blue-600 text-blue-200 p-3 rounded-md text-center">{status}</div>}
        {error && <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md text-center">{error}</div>}

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {fileUrl || version ? "ویرایش نسخه" : "ایجاد نسخه جدید"}
          </h2>
          {(fileUrl || version) && (
            <button type="button" onClick={resetForm}
              className="flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300 transition">
              <Plus size={16} /> ایجاد جدید
            </button>
          )}
        </div>

        {fileUrl && (
          <div className="bg-[#1e1e2e] p-3 rounded-md border border-gray-600">
            <p className="text-gray-300"><strong>در حال ویرایش:</strong> {version}</p>
            <a href={fileUrl} target="_blank" className="text-sky-400 underline text-sm inline-flex items-center gap-1 mt-1">
              <ExternalLink size={14} /> فایل فعلی ({fileName || "بدون نام"})
            </a>
          </div>
        )}

        <div>
          <label htmlFor="file" className="block mb-2 font-bold text-gray-300">فایل برنامه (.zip)</label>
          <input type="file" id="file" ref={inputFileRef} accept=".zip"
            className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
          <p className="text-gray-400 text-sm mt-1">آپلود فایل جدید اختیاری است — اگر فایلی انتخاب نشود، لینک قبلی حفظ می‌شود.</p>
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
          {isSubmitting ? "در حال ذخیره..." : (fileUrl ? "ویرایش نسخه" : "ایجاد نسخه جدید")}
        </button>
      </form>

      {/* لیست تمام نسخه‌ها */}
      <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4">مدیریت نسخه‌ها</h2>
        {allVersions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">هیچ نسخه‌ای ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="p-3 font-bold">نسخه</th>
                  <th className="p-3 font-bold hidden md:table-cell">نام فایل</th>
                  <th className="p-3 font-bold hidden sm:table-cell">تاریخ انتشار</th>
                  <th className="p-3 font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {allVersions.map((v) => (
                  <tr key={v.id} className="border-b border-gray-700 hover:bg-[#1e1e2e]/50">
                    <td className="p-3 font-semibold">{v.version}</td>
                    <td className="p-3 text-gray-400 text-sm hidden md:table-cell" dir="ltr">{v.fileName || "—"}</td>
                    <td className="p-3 text-gray-400 text-sm hidden sm:table-cell">
                      {toShamsiDate(v.releaseDate)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => loadVersion(v)}
                        className="flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        <Pencil size={14} /> ویرایش
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}