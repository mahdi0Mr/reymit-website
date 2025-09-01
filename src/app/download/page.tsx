import prisma from "@/lib/prisma";
import { Download } from "lucide-react";

async function getLatestFile() {
  const latestFile = await prisma.appFile.findFirst({
    orderBy: { releaseDate: 'desc' },
  });
  return latestFile;
}

export default async function DownloadPage() {
  const file = await getLatestFile();

  if (!file) {
    return <div className="text-center py-20">هیچ فایلی برای دانلود یافت نشد.</div>;
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">دانلود کنترلر دونیت</h1>
      <div className="max-w-2xl mx-auto bg-[#2a2a40] p-8 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-sky-400">نسخه {file.version}</h2>
        <p className="text-gray-400 mb-4">تاریخ انتشار: {new Date(file.releaseDate).toLocaleDateString('fa-IR')}</p>
        <h3 className="font-bold mt-6 mb-2">تغییرات جدید:</h3>
        <div className="prose prose-invert text-gray-300 whitespace-pre-wrap">
          {file.changelog}
        </div>
        <a
          href={file.url}
          className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition"
        >
          <Download size={20} />
          دانلود فایل ({file.fileName})
        </a>
      </div>
    </main>
  );
}