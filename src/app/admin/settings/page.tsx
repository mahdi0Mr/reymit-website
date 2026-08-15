// src/app/admin/settings/page.tsx
import { notFound } from "next/navigation";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions-server";
import { getMachineConfig } from "@/app/actions/machineActions";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const permError = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  if (permError) notFound();

  const config = await getMachineConfig();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">تنظیمات زمان‌بندی</h1>
      <p className="text-gray-400 mb-6">
        این تنظیمات بر عملکرد اپلیکیشن کنترلر دونیت تأثیر می‌گذارد. مقادیر به‌صورت خودکار در heartbeat بعدی به اپلیکیشن ارسال می‌شود.
      </p>
      <SettingsForm config={config} />
    </div>
  );
}