// src/app/admin/platforms/PlatformCatalogManager.tsx
"use client";

import { useState } from "react";
import {
  Plus, Save, Pencil, Trash2, Power, Globe, X, Eye, EyeOff
} from "lucide-react";
import {
  createPlatform,
  updatePlatform,
  deletePlatform,
  togglePlatformEnabled,
  getPlatformCatalog,
} from "@/app/actions/platformActions";

export interface CatalogPlatform {
  id: string;
  key: string;
  displayName: string;
  apiUrl: string;
  listPath: string;
  idField: string;
  nameField: string;
  amountField: string;
  amountUnit: string;
  advancedJson: string | null;
  enabled: boolean;
  sortOrder: number;
}

type FormState = {
  key: string;
  displayName: string;
  apiUrl: string;
  listPath: string;
  idField: string;
  nameField: string;
  amountField: string;
  amountUnit: "toman" | "rial";
  advancedJson: string;
  enabled: boolean;
};

const EMPTY_FORM: FormState = {
  key: "",
  displayName: "",
  apiUrl: "",
  listPath: "data",
  idField: "id",
  nameField: "name",
  amountField: "amount",
  amountUnit: "toman",
  advancedJson: "",
  enabled: true,
};

export default function PlatformCatalogManager({
  initialCatalog,
  canEdit,
}: {
  initialCatalog: CatalogPlatform[];
  canEdit: boolean;
}) {
  const [catalog, setCatalog] = useState<CatalogPlatform[]>(initialCatalog);
  const [editing, setEditing] = useState<CatalogPlatform | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const data = await getPlatformCatalog();
    if (data) setCatalog(data);
  };

  const setField = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsCreating(true);
    setShowAdvanced(false);
    setMessage("");
    setError("");
  };

  const openEdit = (p: CatalogPlatform) => {
    setEditing(p);
    setForm({
      key: p.key,
      displayName: p.displayName,
      apiUrl: p.apiUrl,
      listPath: p.listPath,
      idField: p.idField,
      nameField: p.nameField,
      amountField: p.amountField,
      amountUnit: p.amountUnit === "rial" ? "rial" : "toman",
      advancedJson: p.advancedJson ?? "",
      enabled: p.enabled,
    });
    setIsCreating(false);
    setShowAdvanced(!!p.advancedJson);
    setMessage("");
    setError("");
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    const payload: FormState = {
      ...form,
      advancedJson: form.advancedJson.trim() === "" ? "" : form.advancedJson,
    };
    const result = editing
      ? await updatePlatform(editing.id, payload)
      : await createPlatform(payload);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setMessage(editing ? "پلتفرم ویرایش شد." : "پلتفرم جدید افزوده شد.");
    setLoading(false);
    closeForm();
    await refresh();
  };

  const handleDelete = async (p: CatalogPlatform) => {
    if (!confirm(`پلتفرم «${p.displayName}» و تنظیمات اختصاصی همه دستگاه‌ها برای آن حذف شود؟`)) return;
    setMessage("");
    setError("");
    const result = await deletePlatform(p.id);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("پلتفرم حذف شد.");
      if (editing?.id === p.id) closeForm();
      await refresh();
    }
  };

  const handleToggle = async (p: CatalogPlatform) => {
    setError("");
    const result = await togglePlatformEnabled(p.id, !p.enabled);
    if (result.error) {
      setError(result.error);
    } else {
      await refresh();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="text-indigo-400" size={20} />
            کاتالوگ پلتفرم‌های API
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            الگوهای پلتفرم که اپلیکیشن می‌تواند پشتیبانی کند. تغییرات با heartbeat بعدی به دستگاه‌ها ارسال می‌شود.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Plus size={16} /> افزودن پلتفرم
          </button>
        )}
      </div>

      {message && (
        <div className="bg-green-800 border border-green-600 text-green-200 p-3 rounded-md mb-4">{message}</div>
      )}
      {error && (
        <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md mb-4">{error}</div>
      )}

      {/* فرم افزودن/ویرایش */}
      {isCreating && (
        <div className="bg-[#24243a] p-5 rounded-lg border border-indigo-800/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">افزودن پلتفرم جدید</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <FormFields form={form} setField={setField} editing={null} />
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Save size={16} /> {loading ? "..." : "ذخیره"}
            </button>
            <button onClick={closeForm} className="text-gray-400 hover:text-white px-4 py-2 text-sm">انصراف</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="bg-[#24243a] p-5 rounded-lg border border-indigo-800/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">ویرایش پلتفرم: {editing.displayName}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <FormFields form={form} setField={setField} editing={editing} />
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Save size={16} /> {loading ? "..." : "ذخیره تغییرات"}
            </button>
            <button onClick={closeForm} className="text-gray-400 hover:text-white px-4 py-2 text-sm">انصراف</button>
          </div>
        </div>
      )}

      {/* جدول کاتالوگ */}
      <div className="bg-[#2a2a40] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-[#1e1e2e]">
            <tr>
              <th className="p-3">نام</th>
              <th className="p-3 hidden md:table-cell">آدرس API</th>
              <th className="p-3 hidden lg:table-cell">مسیر لیست</th>
              <th className="p-3 hidden sm:table-cell">واحد مبلغ</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((p) => (
              <tr key={p.id} className={`border-t border-gray-700 hover:bg-[#3a3a52] ${p.enabled ? "" : "opacity-50"}`}>
                <td className="p-3">
                  <div className="font-semibold">{p.displayName}</div>
                  <code className="text-xs text-gray-500" dir="ltr">{p.key}</code>
                </td>
                <td className="p-3">
                  <code className="text-xs text-gray-300 break-all hidden md:block" dir="ltr">{p.apiUrl}</code>
                </td>
                <td className="p-3 text-xs text-gray-400 hidden lg:table-cell" dir="ltr">{p.listPath}</td>
                <td className="p-3 text-xs text-gray-400 hidden sm:table-cell">
                  {p.amountUnit === "rial" ? "ریال" : "تومان"}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.enabled ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                    {p.enabled ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => openEdit(p)}
                          title="ویرایش"
                          className="text-sky-400 hover:text-sky-300 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleToggle(p)}
                          title={p.enabled ? "غیرفعال کردن" : "فعال کردن"}
                          className={p.enabled ? "text-yellow-500 hover:text-yellow-400 transition" : "text-green-400 hover:text-green-300 transition"}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          title="حذف"
                          className="text-red-500 hover:text-red-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {!canEdit && <span className="text-xs text-gray-500">فقط خواندنی</span>}
                  </div>
                </td>
              </tr>
            ))}
            {catalog.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-8 text-gray-500">هیچ پلتفرمی تعریف نشده است.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="mt-4 inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition"
        >
          {showAdvanced ? <EyeOff size={14} /> : <Eye size={14} />}
          نمایش راهنمای فیلدها
        </button>
      )}
      {showAdvanced && (
        <div className="mt-2 bg-[#1e1e2e] border border-gray-700 rounded-lg p-4 text-xs text-gray-400 space-y-1">
          <p><b className="text-gray-200">آدرس API:</b> باید شامل {`{token}`} باشد؛ توکن کاربر همان‌جا جایگزین می‌شود. مثال: <code dir="ltr">https://api.example.com/user/{`{token}`}/last-donates</code></p>
          <p><b className="text-gray-200">مسیر لیست:</b> مسیر نقطه‌ای (dot) رسیدن به آرایه دونیت‌ها در پاسخ JSON. مثال: <code dir="ltr">data</code> یا <code dir="ltr">data.donates</code></p>
          <p><b className="text-gray-200">فیلدها:</b> نام فیلد شناسه / نام اهداکننده / مبلغ در هر آیتم دونیت. اگر اسکیمای پاسخ را نمی‌دانید، حدس بزنید و بعد از مشاهده خطا در اپ، اصلاح کنید.</p>
          <p><b className="text-gray-200">واحد مبلغ:</b> اگر API ریال می‌دهد، اپ به‌صورت خودکار بر ۱۰ تقسیم و به تومان تبدیل می‌کند.</p>
          <p><b className="text-gray-200">JSON پیشرفته:</b> هدرهای اضافی و … — به‌صورت شیء JSON. مثال: <code dir="ltr">{`{"headers":{"Authorization":"Bearer x"}}`}</code></p>
        </div>
      )}
    </div>
  );
}

// فیلدهای فرم (برای افزودن و ویرایش مشترک)
function FormFields({
  form,
  setField,
  editing,
}: {
  form: FormState;
  setField: (key: keyof FormState, value: string | boolean) => void;
  editing: CatalogPlatform | null;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">شناسه (key)</label>
        <input
          type="text"
          value={form.key}
          disabled={!!editing}
          placeholder="مثل my_platform"
          onChange={(e) => setField("key", e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200 disabled:opacity-50"
          dir="ltr"
        />
        <p className="text-xs text-gray-500 mt-1">{editing ? "شناسه پس از ساخت قابل تغییر نیست." : "حروف، اعداد، _ یا -"}</p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">نام نمایشی</label>
        <input
          type="text"
          value={form.displayName}
          onChange={(e) => setField("displayName", e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-400 mb-1">آدرس API (با {`{token}`})</label>
        <input
          type="text"
          value={form.apiUrl}
          onChange={(e) => setField("apiUrl", e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">مسیر لیست</label>
        <input
          type="text"
          value={form.listPath}
          onChange={(e) => setField("listPath", e.target.value)}
          placeholder="data"
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">واحد مبلغ</label>
        <select
          value={form.amountUnit}
          onChange={(e) => setField("amountUnit", e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200"
        >
          <option value="toman">تومان</option>
          <option value="rial">ریال</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">فیلد شناسه</label>
        <input
          type="text"
          value={form.idField}
          onChange={(e) => setField("idField", e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">فیلد نام</label>
        <input
          type="text"
          value={form.nameField}
          onChange={(e) => setField("nameField", e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200"
          dir="ltr"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-400 mb-1">فیلد مبلغ</label>
        <input
          type="text"
          value={form.amountField}
          onChange={(e) => setField("amountField", e.target.value)}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200"
          dir="ltr"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-400 mb-1">JSON پیشرفته (اختیاری)</label>
        <textarea
          value={form.advancedJson}
          onChange={(e) => setField("advancedJson", e.target.value)}
          placeholder={'{"headers":{"Authorization":"Bearer ..."}}'}
          rows={3}
          className="w-full bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-gray-200 font-mono text-xs"
          dir="ltr"
        />
        <p className="text-xs text-gray-500 mt-1">مثل هدرها — یک شیء JSON معتبر</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-300 md:col-span-2">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setField("enabled", e.target.checked)}
          className="w-4 h-4"
        />
        فعال
      </label>
    </div>
  );
}
