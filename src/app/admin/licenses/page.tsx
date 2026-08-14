// src/app/admin/licenses/page.tsx
import { getLicensesList } from "@/app/actions/adminActions";
import { notFound } from "next/navigation";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions-server";
import LicenseForm from "./LicenseForm";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

export default async function LicensesPage() {
  const permError = await requirePermission(PERMISSIONS.GENERATE_LICENSE);
  if (permError) notFound();

  const licenses = await getLicensesList();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">تولید لایسنس</h1>

      <div className="mb-8">
        <LicenseForm />
      </div>

      <h2 className="text-xl font-bold mb-4">تاریخچه لایسنس‌های تولید شده</h2>
      
      <div className="bg-[#2a2a40] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-700 bg-[#1e1e2e]">
              <th className="p-4 font-bold">تاریخ تولید</th>
              <th className="p-4 font-bold">شناسه دستگاه (Machine ID)</th>
              <th className="p-4 font-bold">تاریخ انقضا</th>
              <th className="p-4 font-bold">تولید شده توسط</th>
              <th className="p-4 font-bold">کلید لایسنس</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  هیچ لایسنس‌ایی تولید نشده است.
                </td>
              </tr>
            ) : (
              licenses.map((lic) => (
                <tr key={lic.id} className="border-b border-gray-700 hover:bg-[#1e1e2e]/50">
                  <td className="p-4 text-sm text-gray-300">
                    {new Date(lic.createdAt).toLocaleString("fa-IR")}
                  </td>
                  <td className="p-4 font-mono text-sm text-gray-300" dir="ltr">
                    {lic.machineId}
                  </td>
                  <td className="p-4 text-sm">
                    <span className={lic.expiryDate > new Date() ? "text-green-400" : "text-red-400"}>
                      {new Date(lic.expiryDate).toLocaleDateString("fa-IR")}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {lic.admin?.nickname || "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-[#1e1e2e] px-2 py-1 rounded text-xs text-gray-300 font-mono truncate max-w-[200px] block" dir="ltr">
                        {lic.licenseKey.substring(0, 40)}...
                      </code>
                      <CopyButton licenseKey={lic.licenseKey} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}