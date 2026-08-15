// src/app/admin/status/[machineId]/MachineLogSection.tsx
"use client";

import { useState, useEffect } from "react";
import { getMachineLogs } from "@/app/actions/machineActions";
import { ScrollText } from "lucide-react";
import { toShamsiDateTime } from "@/lib/dates";

interface LogEntry {
  id: string;
  machineId: string;
  action: string;
  details: string | null;
  source: string;
  createdAt: Date;
}

const ACTION_LABELS: Record<string, string> = {
  online: "دستگاه آنلاین شد",
  offline: "دستگاه آفلاین شد",
  stream_start: "شروع استریم",
  stream_stop: "توقف استریم",
  license_assigned: "لایسنس تخصیص یافت",
  license_revoked: "لایسنس باطل شد",
  license_reinstated: "لایسنس بازگردانی شد",
  license_expiry_updated: "تاریخ انقضا تغییر کرد",
  donation_received: "دونیت جدید دریافت شد",
  config_changed: "تنظیمات تغییر کرد",
  admin_message_sent: "پیام مدیریت ارسال شد",
};

export default function MachineLogSection({ machineId }: { machineId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const data = await getMachineLogs(machineId, 50);
      setLogs(data as LogEntry[]);
      setLoading(false);
    }
    fetchLogs();
  }, [machineId]);

  return (
    <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ScrollText className="text-sky-400" size={20} />
        تاریخچه تغییرات
      </h2>

      {loading ? (
        <p className="text-gray-500 text-center py-4">در حال بارگذاری...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-center py-4">تغییری ثبت نشده است.</p>
      ) : (
        <div className="max-h-[500px] overflow-y-auto space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-[#1e1e2e] p-3 rounded-lg border border-gray-700 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-200">
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    log.source === "admin" ? "bg-purple-800 text-purple-200" : "bg-blue-800 text-blue-200"
                  }`}>
                    {log.source === "admin" ? "ادمین" : "برنامه"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {toShamsiDateTime(log.createdAt)}
                  </span>
                </div>
              </div>
              {log.details && (
                <details className="mt-1">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">جزئیات</summary>
                  <pre className="mt-1 text-xs text-gray-400 whitespace-pre-wrap">{log.details}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}