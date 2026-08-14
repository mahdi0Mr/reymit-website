// src/app/admin/licenses/LicenseForm.tsx
"use client";

import { useState } from "react";
import { generateLicenseKey } from "@/app/actions/adminActions";
import { Copy, Check } from "lucide-react";

export default function LicenseForm() {
  const [machineId, setMachineId] = useState("");
  const [expiryDays, setExpiryDays] = useState(365);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("machine_id", machineId);
    formData.set("expiry_days", String(expiryDays));

    const res = await generateLicenseKey(formData);
    if (res.error) {
      setError(res.error);
    } else if (res.licenseKey) {
      setResult(res.licenseKey);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 space-y-4 max-w-xl">
        <h2 className="text-xl font-bold">تولید لایسنس جدید</h2>

        {error && (
          <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md">{error}</div>
        )}

        <div>
          <label className="block mb-1 font-bold">شناسه دستگاه (Machine ID)</label>
          <input
            type="text"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value.toUpperCase())}
            className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 font-mono text-sm"
            placeholder="مثال: 1A2B3C4D5E6F7G8H..."
            required
            dir="ltr"
          />
          <p className="text-gray-500 text-sm mt-1">
            کاربر باید این شناسه را از بخش لایسنس برنامه کپی کند.
          </p>
        </div>

        <div>
          <label className="block mb-1 font-bold">مدت اعتبار (روز)</label>
          <input
            type="number"
            value={expiryDays}
            onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
            className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
            min={1}
            max={3650}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition disabled:bg-gray-600"
        >
          {loading ? "در حال تولید..." : "تولید لایسنس"}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-[#1e3a1e] border border-green-700 p-6 rounded-lg max-w-xl">
          <h3 className="text-green-400 font-bold mb-3">✅ لایسنس با موفقیت تولید شد</h3>
          <div className="bg-[#0d1f0d] p-3 rounded border border-green-800 mb-3">
            <code className="text-green-300 font-mono text-sm break-all select-all" dir="ltr">
              {result}
            </code>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "کپی شد!" : "کپی کردن کلید"}
          </button>
        </div>
      )}
    </div>
  );
}