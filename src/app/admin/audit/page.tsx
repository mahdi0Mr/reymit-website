// src/app/admin/audit/page.tsx
import { getAuditLogs } from "@/app/actions/adminActions";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  login: "ورود به پنل",
  logout: "خروج از پنل",
  create_admin: "ایجاد ادمین",
  update_admin: "ویرایش ادمین",
  delete_admin: "حذف ادمین",
  toggle_admin_status: "تغییر وضعیت ادمین",
  generate_license: "تولید لایسنس",
  send_message: "ارسال پیام به برنامه",
  upload_version: "آپلود نسخه جدید",
  reply_ticket: "پاسخ به تیکت",
};

export default async function AuditPage() {
  const logs = await getAuditLogs(0, 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">گزارش فعالیت‌ها</h1>

      <div className="bg-[#2a2a40] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-700 bg-[#1e1e2e]">
              <th className="p-4 font-bold">تاریخ و زمان</th>
              <th className="p-4 font-bold">ادمین</th>
              <th className="p-4 font-bold">عملیات</th>
              <th className="p-4 font-bold">جزئیات</th>
              <th className="p-4 font-bold">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  هیچ فعالیتی ثبت نشده است.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-700 hover:bg-[#1e1e2e]/50">
                  <td className="p-4 text-sm text-gray-300">
                    {new Date(log.createdAt).toLocaleString("fa-IR")}
                  </td>
                  <td className="p-4">
                    {log.admin ? (
                      <span>{log.admin.nickname}</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-sm">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400 max-w-xs truncate">
                    {log.details || "—"}
                  </td>
                  <td className="p-4 text-sm text-gray-500">{log.ip || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}