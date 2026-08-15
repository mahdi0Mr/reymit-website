// src/app/admin/admins/AdminList.tsx
"use client";

import { useState } from "react";
import { deleteAdmin, toggleAdminStatus, createAdmin, updateAdmin } from "@/app/actions/adminActions";
import AdminForm from "./AdminForm";
import { PERMISSION_LABELS, type PermissionAction } from "@/lib/permissions";
import { toShamsiDate } from "@/lib/dates";
import { Pencil, Trash2, UserX, UserCheck, Plus } from "lucide-react";

interface AdminWithPermissions {
  id: string;
  username: string;
  nickname: string;
  isActive: boolean;
  isSuperAdmin?: boolean;
  createdAt: Date;
  permissions: { action: string }[];
  _count: { auditLogs: number; licenses: number };
}

export default function AdminList({ admins: initialAdmins }: { admins: AdminWithPermissions[] }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminWithPermissions | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`آیا از حذف ادمین "${username}" اطمینان دارید؟`)) return;
    const result = await deleteAdmin(id);
    if (result.error) {
      setError(result.error);
    } else {
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      setMessage(`ادمین "${username}" حذف شد.`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleToggle = async (id: string, current: boolean, username: string) => {
    const result = await toggleAdminStatus(id, !current);
    if (result.error) {
      setError(result.error);
    } else {
      setAdmins((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !current } : a))
      );
      setMessage(`ادمین "${username}" ${!current ? "فعال" : "غیرفعال"} شد.`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleCreateOrUpdate = async (data: {
    id?: string;
    username: string;
    password: string;
    nickname: string;
    isSuperAdmin: boolean;
    permissions: string[];
  }) => {
    setError("");

    if (data.id) {
      const result = await updateAdmin({
        id: data.id,
        username: data.username,
        password: data.password || undefined,
        nickname: data.nickname,
        isSuperAdmin: data.isSuperAdmin,
        permissions: data.permissions,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("ادمین با موفقیت ویرایش شد.");
    } else {
      const result = await createAdmin({
        username: data.username,
        password: data.password,
        nickname: data.nickname,
        isSuperAdmin: data.isSuperAdmin,
        permissions: data.permissions,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("ادمین با موفقیت ایجاد شد.");
    }

    // Refresh the list
    const { getAdminsList } = await import("@/app/actions/adminActions");
    const refreshed = await getAdminsList();
    setAdmins(refreshed);
    setShowForm(false);
    setEditingAdmin(null);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div>
      {message && (
        <div className="bg-green-800 text-green-200 p-3 rounded-md mb-4">{message}</div>
      )}
      {error && (
        <div className="bg-red-800 text-red-200 p-3 rounded-md mb-4">{error}</div>
      )}

      <button
        onClick={() => {
          setEditingAdmin(null);
          setShowForm(!showForm);
          setError("");
        }}
        className="mb-6 flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition"
      >
        <Plus size={18} />
        {showForm ? "بستن فرم" : "افزودن ادمین جدید"}
      </button>

      {showForm && (
        <div className="mb-8">
          <AdminForm
            admin={editingAdmin}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => {
              setShowForm(false);
              setEditingAdmin(null);
            }}
          />
        </div>
      )}

      <div className="bg-[#2a2a40] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-700 bg-[#1e1e2e]">
              <th className="p-4 font-bold">نام</th>
              <th className="p-4 font-bold">نام کاربری</th>
              <th className="p-4 font-bold">دسترسی‌ها</th>
              <th className="p-4 font-bold">وضعیت</th>
              <th className="p-4 font-bold">تاریخ ایجاد</th>
              <th className="p-4 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  هیچ ادمینی یافت نشد.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-700 hover:bg-[#1e1e2e]/50">
                  <td className="p-4">{admin.nickname}</td>
                  <td className="p-4 text-gray-400">{admin.username}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {admin.isSuperAdmin ? (
                        <span className="bg-purple-700 text-purple-200 text-xs px-2 py-1 rounded">
                          سوپر ادمین
                        </span>
                      ) : (
                        admin.permissions.map((p) => (
                          <span
                            key={p.action}
                            className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
                          >
                            {PERMISSION_LABELS[p.action as PermissionAction] || p.action}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        admin.isActive
                          ? "bg-green-800 text-green-200"
                          : "bg-red-800 text-red-200"
                      }`}
                    >
                      {admin.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {toShamsiDate(admin.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAdmin(admin);
                          setShowForm(true);
                          setError("");
                        }}
                        className="bg-sky-600 p-2 rounded hover:bg-sky-700 transition"
                        title="ویرایش"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleToggle(admin.id, admin.isActive, admin.nickname)}
                        className={`p-2 rounded transition ${
                          admin.isActive
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                        title={admin.isActive ? "غیرفعال کردن" : "فعال کردن"}
                      >
                        {admin.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id, admin.nickname)}
                        className="bg-red-600 p-2 rounded hover:bg-red-700 transition"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
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