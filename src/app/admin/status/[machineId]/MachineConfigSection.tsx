// src/app/admin/status/[machineId]/MachineConfigSection.tsx
"use client";

import { useState } from "react";
import { Settings2, Save, Trash2, Info } from "lucide-react";
import { updateMachineConfigOverride, resetMachineConfigOverride } from "@/app/actions/machineActions";

export interface GlobalConfigData {
  messageCheckInterval: number;
  statusUpdateInterval: number;
  versionCheckInterval: number;
  donationPollInterval: number;
}

export interface OverrideConfigData {
  messageCheckInterval: number | null;
  statusUpdateInterval: number | null;
  versionCheckInterval: number | null;
  donationPollInterval: number | null;
}

const FIELDS: { key: keyof GlobalConfigData; label: string; hint: string }[] = [
  { key: "messageCheckInterval", label: "فاصله بررسی پیام‌های مدیریت", hint: "ثانیه – کمترین ۵" },
  { key: "statusUpdateInterval", label: "فاصله ارسال وضعیت (heartbeat)", hint: "ثانیه – کمترین ۵" },
  { key: "versionCheckInterval", label: "فاصله بررسی نسخه جدید", hint: "ثانیه – کمترین ۶۰" },
  { key: "donationPollInterval", label: "فاصله دریافت دونیت", hint: "ثانیه – کمترین ۱" },
];

export default function MachineConfigSection({
  machineId,
  canEdit,
  globalConfig,
  overrideConfig,
}: {
  machineId: string;
  canEdit: boolean;
  globalConfig: GlobalConfigData;
  overrideConfig: OverrideConfigData | null;
}) {
  // مقادیر نمایشی = اختصاصی (اگر موجود باشد) وگرنه سراسری
  const initial = (key: keyof GlobalConfigData) =>
    overrideConfig?.[key] ?? globalConfig[key];

  const [values, setValues] = useState<OverrideConfigData>({
    messageCheckInterval: initial("messageCheckInterval"),
    statusUpdateInterval: initial("statusUpdateInterval"),
    versionCheckInterval: initial("versionCheckInterval"),
    donationPollInterval: initial("donationPollInterval"),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasOverride = !!overrideConfig;
  const handleChange = (key: keyof GlobalConfigData, raw: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: raw.trim() === "" ? null : parseInt(raw, 10) || null,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    const result = await updateMachineConfigOverride(machineId, values);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("تنظیمات اختصاصی با موفقیت ذخیره شد.");
      window.location.reload();
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!confirm("تنظیمات اختصاصی این دستگاه حذف شود و از تنظیمات سراسری استفاده کند؟")) return;
    setLoading(true);
    setMessage("");
    setError("");
    const result = await resetMachineConfigOverride(machineId);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("تنظیمات اختصاصی حذف شد؛ از این پس از تنظیمات سراسری استفاده می‌شود.");
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 mb-6">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <Settings2 className="text-sky-400" size={20} />
        تنظیمات زمان‌بندی این دستگاه
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        {hasOverride
          ? "این دستگاه تنظیمات اختصاصی دارد و از تنظیمات سراسری مستقل است."
          : "این دستگاه از تنظیمات سراسری استفاده می‌کند."}
      </p>

      {message && (
        <div className="bg-green-800 border border-green-600 text-green-200 p-3 rounded-md mb-4">{message}</div>
      )}
      {error && (
        <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md mb-4">{error}</div>
      )}

      {canEdit ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                <input
                  type="number"
                  min={1}
                  value={values[field.key] ?? ""}
                  placeholder={`سراسری: ${globalConfig[field.key]}`}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">{field.hint} — اگر خالی باشد از سراسری استفاده می‌شود</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Save size={16} /> {loading ? "..." : "ذخیره تنظیمات اختصاصی"}
            </button>
            {hasOverride && (
              <button
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-700/50 px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                <Trash2 size={16} /> حذف تنظیمات اختصاصی (استفاده از سراسری)
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#1e1e2e] p-4 rounded-lg border border-gray-700">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <p className="text-xs text-gray-500 mb-1">{field.label}</p>
              <p className="text-gray-200 font-semibold">{(values[field.key] ?? globalConfig[field.key]).toLocaleString("fa-IR")}</p>
              <p className="text-[11px] text-gray-500">{field.hint.split("–")[0]}</p>
            </div>
          ))}
        </div>
      )}

      {!canEdit && (
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <Info size={14} /> فقط ادمین‌هایی با دسترسی «مدیریت تنظیمات برنامه» می‌توانند تنظیمات اختصاصی هر دستگاه را تغییر دهند.
        </p>
      )}
    </div>
  );
}
