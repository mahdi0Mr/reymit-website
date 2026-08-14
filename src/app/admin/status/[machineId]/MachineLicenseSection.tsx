// src/app/admin/status/[machineId]/MachineLicenseSection.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { assignLicense, updateLicenseExpiry, expireLicense } from "@/app/actions/machineActions";
import { KeyRound, Plus, Calendar, Ban, ShieldAlert } from "lucide-react";

interface LicenseInfo {
  id: string;
  machineId: string;
  licenseKey: string;
  expiryDate: string;  // ISO string (serialized from server)
  revoked: boolean;
  revokedAt: string | null;
  createdAt: string;   // ISO string
}

export default function MachineLicenseSection({
  machineId,
  initialLicense,
}: {
  machineId: string;
  initialLicense: LicenseInfo | null;
}) {
  const [license, setLicense] = useState<LicenseInfo | null>(initialLicense);
  const [showAssign, setShowAssign] = useState(false);
  const [showUpdateExpiry, setShowUpdateExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isExpired = license ? new Date(license.expiryDate) < new Date() : false;

  const handleAssign = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const result = await assignLicense(machineId, expiryDays);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("لایسنس با موفقیت تخصیص یافت.");
      setShowAssign(false);
      // refetch
      const { getLicenseByMachineId } = await import("@/app/actions/machineActions");
      const lic = await getLicenseByMachineId(machineId);
      if (lic) {
        setLicense({ ...lic, expiryDate: lic.expiryDate.toISOString(), createdAt: lic.createdAt.toISOString(), revokedAt: lic.revokedAt?.toISOString() ?? null });
      } else {
        setLicense(null);
      }
    }
    setLoading(false);
  };

  const handleUpdateExpiry = async () => {
    if (!license || !newExpiryDate) return;
    setLoading(true);
    setError("");
    setMessage("");
    const result = await updateLicenseExpiry(license.id, newExpiryDate);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("تاریخ انقضا با موفقیت بروزرسانی شد.");
      setShowUpdateExpiry(false);
      const { getLicenseByMachineId } = await import("@/app/actions/machineActions");
      const lic = await getLicenseByMachineId(machineId);
      if (lic) {
        setLicense({ ...lic, expiryDate: lic.expiryDate.toISOString(), createdAt: lic.createdAt.toISOString(), revokedAt: lic.revokedAt?.toISOString() ?? null });
      } else {
        setLicense(null);
      }
    }
    setLoading(false);
  };

  const handleExpire = async () => {
    if (!license) return;
    if (!confirm("آیا از باطل کردن این لایسنس اطمینان دارید؟ این عملیات قابل بازگشت نیست.")) return;
    setLoading(true);
    setError("");
    setMessage("");
    const result = await expireLicense(license.id);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("لایسنس با موفقیت باطل شد.");
      const { getLicenseByMachineId } = await import("@/app/actions/machineActions");
      const lic = await getLicenseByMachineId(machineId);
      if (lic) {
        setLicense({ ...lic, expiryDate: lic.expiryDate.toISOString(), createdAt: lic.createdAt.toISOString(), revokedAt: lic.revokedAt?.toISOString() ?? null });
      } else {
        setLicense(null);
      }
    }
    setLoading(false);
  };

  const getStatusBadge = () => {
    if (!license) return { label: "ندارد", style: "bg-gray-700 text-gray-400" };
    if (license.revoked) return { label: "باطل شده", style: "bg-red-800 text-red-200" };
    if (isExpired) return { label: "منقضی شده", style: "bg-yellow-800 text-yellow-200" };
    return { label: "معتبر", style: "bg-green-800 text-green-200" };
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <KeyRound className="text-sky-400" size={20} />
        مدیریت لایسنس
      </h2>

      {message && (
        <div className="bg-green-800 border border-green-600 text-green-200 p-3 rounded-md mb-4">{message}</div>
      )}
      {error && (
        <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md mb-4">{error}</div>
      )}

      {license ? (
        <div className="space-y-3">
          <div className="bg-[#1e1e2e] p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400 mb-1">وضعیت:</p>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.style}`}>{badge.label}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowUpdateExpiry(true); setNewExpiryDate(new Date(license.expiryDate).toISOString().split("T")[0]); }}
                  className="flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                  disabled={loading}
                >
                  <Calendar size={14} /> تمدید
                </button>
                {!license.revoked && (
                  <button
                    onClick={handleExpire}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                    disabled={loading}
                  >
                    <Ban size={14} /> باطل کردن
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-400">کلید لایسنس:</p>
                <code className="text-xs text-gray-200 select-all break-all" dir="ltr">
                  {license.licenseKey.slice(0, 40)}...
                </code>
              </div>
              <div>
                <p className="text-sm text-gray-400">تاریخ انقضا:</p>
                <p className="text-gray-200" dir="ltr">
                  {new Date(license.expiryDate).toLocaleDateString("fa-IR")}
                </p>
              </div>
            </div>
          </div>

          {/* فرم تمدید */}
          {showUpdateExpiry && (
            <div className="bg-[#1e1e2e] p-4 rounded-lg border border-gray-600 space-y-3">
              <p className="font-bold text-sm">تغییر تاریخ انقضا</p>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full bg-[#2a2a40] border border-gray-600 rounded-md p-2"
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateExpiry} disabled={loading}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm transition">
                  {loading ? "..." : "ذخیره"}
                </button>
                <button onClick={() => setShowUpdateExpiry(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition">
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <ShieldAlert size={40} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400 mb-4">برای این دستگاه لایسنس صادر نشده است.</p>
          {showAssign ? (
            <div className="bg-[#1e1e2e] p-4 rounded-lg border border-gray-600 space-y-3 max-w-sm mx-auto">
              <p className="font-bold text-sm">تخصیص لایسنس جدید</p>
              <div>
                <label className="block text-xs text-gray-400 mb-1">مدت اعتبار (روز)</label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                  className="w-full bg-[#2a2a40] border border-gray-600 rounded-md p-2"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAssign} disabled={loading}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm transition">
                  {loading ? "..." : "تخصیص لایسنس"}
                </button>
                <button onClick={() => setShowAssign(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition">
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAssign(true)}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Plus size={16} /> تخصیص لایسنس جدید
            </button>
          )}
        </div>
      )}
    </div>
  );
}