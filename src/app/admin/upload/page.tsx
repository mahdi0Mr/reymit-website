// app/admin/upload/page.tsx
import UploadForm from "./UploadForm"; // کامپوننت Client

export default function UploadPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">آپلود نسخه جدید</h1>
      <UploadForm />
    </div>
  );
}