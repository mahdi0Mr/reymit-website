// src/app/admin/admins/AdminForm.tsx
"use client";

import { useState } from "react";
import { PERMISSION_LABELS, PERMISSIONS, type PermissionAction } from "@/lib/permissions";

interface AdminFormProps {
  admin?: {
    id: string;
    username: string;
    nickname: string;
    isSuperAdmin?: boolean;
    permissions: { action: string }[];
  } | null;
  onSubmit: (data: {
    id?: string;
    username: string;
    password: string;
    nickname: string;
    isSuperAdmin: boolean;
    permissions: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

const allActions = Object.values(PERMISSIONS) as PermissionAction[];

export default function AdminForm({ admin, onSubmit, onCancel }: AdminFormProps) {
  const [username, setUsername] = useState(admin?.username || "");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState(admin?.nickname || "");
  const [isSuperAdmin, setIsSuperAdmin] = useState(admin?.isSuperAdmin === true);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(admin?.permissions.map((p) => p.action) || [])
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      id: admin?.id,
      username,
      password,
      nickname,
      isSuperAdmin,
      permissions: Array.from(selectedPermissions),
    });
    setSubmitting(false);
  };

  const togglePermission = (action: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(new Set(allActions));
  };

  const clearPermissions = () => {
    setSelectedPermissions(new Set());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700 space-y-4 max-w-xl">
      <h2 className="text-xl font-bold mb-4">
        {admin ? `ویرایش ادمین: ${admin.nickname}` : "افزودن ادمین جدید"}
      </h2>

      <div>
        <label className="block mb-1 font-bold">نام کاربری</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
          required
          dir="ltr"
        />
      </div>

      <div>
        <label className="block mb-1 font-bold">
          {admin ? "رمز عبور جدید (خالی = عدم تغییر)" : "رمز عبور"}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
          required={!admin}
          minLength={6}
          dir="ltr"
        />
      </div>

      <div>
        <label className="block mb-1 font-bold">نام نمایشی</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2"
          required
        />
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer bg-[#1e1e2e] border border-gray-600 rounded-md p-3">
          <input
            type="checkbox"
            checked={isSuperAdmin}
            onChange={(e) => setIsSuperAdmin(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="font-bold">سوپر ادمین (دسترسی کامل به همه منوها)</span>
        </label>
        <p className="text-gray-400 text-sm mt-1">
          سوپر ادمین به همه بخش‌ها دسترسی دارد و نیازی به انتخاب دسترسی تکی ندارد.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-bold">دسترسی‌های تکی</label>
          <div className="flex gap-2 text-sm">
            <button type="button" onClick={selectAllPermissions} className="text-sky-400 hover:text-sky-300">
              انتخاب همه
            </button>
            <span className="text-gray-500">|</span>
            <button type="button" onClick={clearPermissions} className="text-gray-400 hover:text-gray-300">
              پاک کردن
            </button>
          </div>
        </div>
        <div className="bg-[#1e1e2e] border border-gray-600 rounded-md p-3 space-y-2">
          {allActions.map((action) => (
            <label key={action} className="flex items-center gap-3 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={selectedPermissions.has(action)}
                onChange={() => togglePermission(action)}
                className="w-4 h-4"
              />
              <span>{PERMISSION_LABELS[action]}</span>
            </label>
          ))}
          <p className="text-gray-500 text-sm mt-2">
            {isSuperAdmin
              ? "این ادمین سوپر ادمین است، پس دسترسی‌های تکی اعمال نمی‌شود."
              : selectedPermissions.size === 0
                ? "در صورت عدم انتخاب هیچ دسترسی‌ای، این ادمین هیچ منویی را نخواهد دید (فقط خروج)."
                : "فقط منوهایی که دسترسی آنها انتخاب شده نمایش داده می‌شود."}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-sky-600 text-white font-bold py-2 rounded-lg hover:bg-sky-700 transition disabled:bg-gray-600"
        >
          {submitting ? "در حال ذخیره..." : admin ? "ویرایش ادمین" : "ایجاد ادمین"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}