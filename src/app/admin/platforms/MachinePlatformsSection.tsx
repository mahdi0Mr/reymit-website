// src/app/admin/platforms/MachinePlatformsSection.tsx
"use client";

import { useState } from "react";
import {
  ChevronDown, ChevronLeft, HardDrive, Power, Trash2, Plus, RefreshCw
} from "lucide-react";
import {
  getMachinePlatforms,
  setMachinePlatform,
  removeMachinePlatform,
} from "@/app/actions/platformActions";

export interface MachinePlatformLink {
  id: string;
  machineId: string;
  platformId: string;
  enabled: boolean;
  platform: {
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
  };
}

export interface MachineCatalogItem {
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
}

interface Machine {
  machineId: string;
  computerName: string;
}

export default function MachinePlatformsSection({
  machines,
  canEdit,
}: {
  machines: Machine[];
  canEdit: boolean;
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HardDrive className="text-sky-400" size={20} />
          پلتفرم‌های اختصاصی دستگاه‌ها
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          برای هر دستگاه می‌توانید پلتفرم‌های فعال را مشخص کنید. اگر برای دستگاهی هیچ پلتفرمی انتخاب نشود، لیست کاتالوگ فعال به آن ارسال می‌شود.
        </p>
      </div>

      {machines.length === 0 ? (
        <div className="bg-[#2a2a40] rounded-lg border border-gray-700 p-8 text-center text-gray-500">
          هنوز دستگاهی وضعیت خود را گزارش نکرده است.
        </div>
      ) : (
        <div className="space-y-4">
          {machines.map((m) => (
            <MachineRow key={m.machineId} machine={m} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

function MachineRow({ machine, canEdit }: { machine: Machine; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<{
    links: MachinePlatformLink[];
    catalog: MachineCatalogItem[];
  } | null>(null);

  const load = async () => {
    if (data) return;
    setLoading(true);
    setError("");
    const result = await getMachinePlatforms(machine.machineId);
    if (!result) {
      setError("دسترسی یا خطای سرور.");
    } else {
      setData(result);
    }
    setLoading(false);
  };

  const toggle = async () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      await load();
    }
  };

  const availableForAdd = data
    ? data.catalog.filter(
        (c) => !data.links.some((l) => l.platformId === c.id)
      )
    : [];

  const handleToggleLink = async (link: MachinePlatformLink) => {
    const result = await setMachinePlatform(machine.machineId, link.platformId, !link.enabled);
    if (result.error) {
      setError(result.error);
    } else {
      setError("");
      setData((prev) =>
        prev ? { ...prev, links: prev.links.map((l) => (l.id === link.id ? { ...l, enabled: !link.enabled } : l)) } : prev
      );
    }
  };

  const handleRemoveLink = async (link: MachinePlatformLink) => {
    if (!confirm(`پلتفرم «${link.platform.displayName}» از دستگاه «${machine.computerName}» حذف شود؟`)) return;
    const result = await removeMachinePlatform(machine.machineId, link.platformId);
    if (result.error) {
      setError(result.error);
    } else {
      setError("");
      setData((prev) => (prev ? { ...prev, links: prev.links.filter((l) => l.id !== link.id) } : prev));
    }
  };

  const handleAdd = async (platformId: string) => {
    if (!platformId) return;
    const result = await setMachinePlatform(machine.machineId, platformId, true);
    if (result.error) {
      setError(result.error);
    } else {
      setError("");
      setData((prev) => {
        if (!prev) return prev;
        const platform = prev.catalog.find((c) => c.id === platformId);
        if (!platform) return prev;
        return {
          ...prev,
          links: [
            ...prev.links,
            {
              id: `tmp-${platformId}`,
              machineId: machine.machineId,
              platformId,
              enabled: true,
              platform,
            },
          ],
        };
      });
    }
  };

  return (
    <div className="bg-[#2a2a40] rounded-lg border border-gray-700 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[#3a3a52] transition text-right"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronLeft size={18} className="text-gray-400" />}
          <HardDrive size={18} className="text-gray-400 shrink-0" />
          <div>
            <div className="font-semibold">{machine.computerName}</div>
            <code className="text-xs text-gray-500 select-all" dir="ltr">{machine.machineId}</code>
          </div>
        </div>
        {data && (
          <span className="text-xs text-gray-400">
            {data.links.length === 0 ? "از کاتالوگ فعال استفاده می‌کند" : `${data.links.filter((l) => l.enabled).length} پلتفرم فعال`}
          </span>
        )}
      </button>

      {open && (
        <div className="p-4 border-t border-gray-700 bg-[#1e1e2e]">
          {error && (
            <div className="bg-red-800 border border-red-600 text-red-200 p-3 rounded-md mb-4">{error}</div>
          )}
          {loading && !data && (
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> در حال دریافت…
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {/* پلتفرم‌های اختصاصی این دستگاه */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">پلتفرم‌های این دستگاه</h4>
                {data.links.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    هیچ پلتفرم اختصاصی انتخاب نشده است؛ در حال حاضر از تمام پلتفرم‌های فعال کاتالوگ ارسال می‌شود.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.links.map((link) => (
                      <div
                        key={link.id}
                        className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border ${link.enabled ? "bg-[#24243a] border-gray-700" : "bg-[#1a1a2e] border-gray-800 opacity-60"}`}
                      >
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {link.platform.displayName}
                            {!link.platform.enabled && (
                              <span className="text-[10px] text-red-400 bg-red-900/40 px-2 py-0.5 rounded-full">در کاتالوگ غیرفعال است</span>
                            )}
                          </div>
                          <code className="text-[11px] text-gray-500 block break-all" dir="ltr">{link.platform.apiUrl}</code>
                          <span className="text-[11px] text-gray-500">مسیر: <code dir="ltr">{link.platform.listPath}</code> — واحد: {link.platform.amountUnit === "rial" ? "ریال" : "تومان"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${link.enabled ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                            {link.enabled ? "فعال" : "غیرفعال"}
                          </span>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleToggleLink(link)}
                                title={link.enabled ? "غیرفعال کردن برای این دستگاه" : "فعال کردن برای این دستگاه"}
                                className={link.enabled ? "text-yellow-500 hover:text-yellow-400 transition" : "text-green-400 hover:text-green-300 transition"}
                              >
                                <Power size={16} />
                              </button>
                              <button
                                onClick={() => handleRemoveLink(link)}
                                title="حذف از این دستگاه"
                                className="text-red-500 hover:text-red-400 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* افزودن پلتفرم از کاتالوگ */}
              {canEdit && availableForAdd.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => handleAdd(e.target.value)}
                    className="bg-[#1e1e2e] border border-gray-600 rounded-md p-2 text-sm text-gray-200"
                  >
                    <option value="" disabled>افزودن پلتفرم از کاتالوگ…</option>
                    {availableForAdd.map((c) => (
                      <option key={c.id} value={c.id}>{c.displayName} ({c.key})</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Plus size={12} /> گزینه را انتخاب کنید</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
