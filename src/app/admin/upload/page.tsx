// app/admin/upload/page.tsx
import { notFound } from "next/navigation";
import UploadForm from "./UploadForm"; // کامپوننت Client
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions-server";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const permError = await requirePermission(PERMISSIONS.UPLOAD_VERSIONS);
  if (permError) notFound();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">آپلود نسخه جدید</h1>
      <UploadForm />
    </div>
  );
}
