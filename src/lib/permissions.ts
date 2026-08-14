// src/lib/permissions.ts
// تعریف دسترسی‌های قابل تنظیم برای ادمین‌ها — این فایل فقط ثابت‌ها و نوع‌ها را دارد (ایمن برای کلاینت)

export const PERMISSIONS = {
  MANAGE_ADMINS: "manage_admins",
  VIEW_STATUS: "view_status",
  SEND_MESSAGES: "send_messages",
  UPLOAD_VERSIONS: "upload_versions",
  GENERATE_LICENSE: "generate_license",
  VIEW_AUDIT: "view_audit",
  MANAGE_TICKETS: "manage_tickets",
} as const;

export type PermissionAction = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<PermissionAction, string> = {
  [PERMISSIONS.MANAGE_ADMINS]: "مدیریت ادمین‌ها",
  [PERMISSIONS.VIEW_STATUS]: "مشاهده وضعیت برنامه‌ها",
  [PERMISSIONS.SEND_MESSAGES]: "ارسال پیام به برنامه‌ها",
  [PERMISSIONS.UPLOAD_VERSIONS]: "آپلود نسخه جدید",
  [PERMISSIONS.GENERATE_LICENSE]: "تولید لایسنس",
  [PERMISSIONS.VIEW_AUDIT]: "مشاهده گزارش فعالیت‌ها",
  [PERMISSIONS.MANAGE_TICKETS]: "مدیریت تیکت‌ها",
};

// نگاشت مسیرهای منوی ادمین به دسترسی موردنیاز برای نمایش
// (در لینک‌ها و کارت‌های داشبورد و گارد صفحات استفاده می‌شود)
export const ROUTE_PERMISSION: Record<string, PermissionAction> = {
  "/admin/tickets": PERMISSIONS.MANAGE_TICKETS,
  "/admin/status": PERMISSIONS.VIEW_STATUS,
  "/admin/messages": PERMISSIONS.SEND_MESSAGES,
  "/admin/upload": PERMISSIONS.UPLOAD_VERSIONS,
  "/admin/admins": PERMISSIONS.MANAGE_ADMINS,
  "/admin/licenses": PERMISSIONS.GENERATE_LICENSE,
  "/admin/audit": PERMISSIONS.VIEW_AUDIT,
  "/admin/settings": PERMISSIONS.MANAGE_ADMINS,
};