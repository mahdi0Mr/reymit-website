// src/app/admin/settings/SettingsForm.tsx
"use client";

import { useState } from "react";
import { updateMachineConfig } from "@/app/actions/machineActions";
import { Clock, MessageCircle, Activity, Bell, Database } from "lucide-react";

interface ConfigData {
  messageCheckInterval: number;
  statusUpdateInterval: number;
  versionCheckInterval: number;
  donationPollInterval: number;
}

export default function SettingsForm({ config: initial }: { config: ConfigData | null }) {
  const [config, setConfig] = useState<ConfigData>({
    messageCheckInterval: initial?.messageCheckInterval ?? 60,
    statusUpdateInterval: initial?.statusUpdateInterval ?? 60,
    versionCheckInterval: initial?.versionCheckInterval ?? 600,
    donationPollInterval: initial?.donationPollInterval ?? 5,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const result = await updateMachineConfig(config);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("تنظیمات با موفقیت ذخیره شد. اپلیکیشن در heartbeat بعدی این مقادیر را دریافت می‌کند.");
    }
    setLoading(false);
  };

  const fields = [
    {
      key: "messageCheckInterval" as const,
      label: "بررسی پیام‌های مدیریت",
      desc: "فاصله زمانی بررسی پیام‌های جدید از سمت مدیریت (ثانیه)",
      min: 5,
      max: 600,
      icon: <MessageCircle size={18} className="text-sky-400" />,
    },
    {
      key: "statusUpdateInterval" as const,
      label: "ارسال وضعیت (heartbeat)",
      desc: "فاصله زمانی ارسال وضعیت برنامه به سرور (ثانیه)",
      min: 5,
      max: 600,
      icon: <Activity size={18} className="text-green-400" />,
    },
    {
      key: "versionCheckInterval" as const,
      label: "بررسی آپدیت جدید",
      desc: "فاصله زمانی بررسی نسخه جدید و نمایش پاپ‌آپ به کاربر (ثانیه) — پیش‌فرض ۱۰ دقیقه",
      min: 60,
      max: 86400,
      icon: <Bell size={18} className="text-yellow-400" />,
    },
    {
      key: "donationPollInterval" as const,
      label: "دریافت دونیت از API",
      desc: "فاصله زمانی درخواست دونیت‌های جدید از پلتفرم (ثانیه)",
      min: 1,
      max: 120,
      icon: <Database size={18} className="text-pink-400" />,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-[#2a2a40] p-8 rounded-lg border border-gray-700 space-y-6 max-w-2xl">
      {message && (
        <div className="bg-green-800 border border-green-600 text-green-200 p-3 rounded-md">{message}</div>
      )}
      {error && (
        <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md">{error}</div>
      )}

      {fields.map((field) => (
        <div key={field.key} className="bg-[#1e1e2e] p-4 rounded-lg border border-gray-700">
          <label className="flex items-center gap-2 font-bold mb-2">
            {field.icon}
            {field.label}
          </label>
          <p className="text-sm text-gray-400 mb-3">{field.desc}</p>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-gray-500" />
            <input
              type="number"
              min={field.min}
              max={field.max}
              value={config[field.key]}
              onChange={(e) => setConfig({ ...config, [field.key]: parseInt(e.target.value) || field.min })}
              className="w-24 bg-[#2a2a40] border border-gray-600 rounded-md p-2 text-center text-lg font-bold"
            />
            <span className="text-gray-400 text-sm">ثانیه</span>
            <span className="text-gray-600 text-xs mr-auto">
              {field.key === "versionCheckInterval"
                ? `(حدود ${Math.round(config[field.key] / 60)} دقیقه)`
                : `(حدود ${config[field.key]} ثانیه)`}
            </span>
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {loading ? "در حال ذخیره..." : "ذخیره تنظیمات"}
      </button>
    </form>
  );
}