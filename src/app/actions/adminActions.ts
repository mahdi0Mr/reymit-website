"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { compareVersions } from "compare-versions";
import bcrypt from "bcryptjs";
import { generateLicense } from "@/lib/crypto";
import { requirePermission, getCurrentAdmin } from "@/lib/permissions-server";
import { PERMISSIONS } from "@/lib/permissions";
import { logAction } from "@/lib/audit";

// --- بخش احراز هویت ادمین (چند ادمینه با نام کاربری و رمز عبور) ---
export async function authenticateAdmin(prevState: string | undefined, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return "نام کاربری و رمز عبور را وارد کنید.";
  }

  try {
    // بررسی وجود ادمین در دیتابیس
    let admin = await prisma.admin.findUnique({ where: { username } });

    // اگر هیچ ادمینی در دیتابیس وجود نداشته باشد، اولین ورود با متغیر محیطی ساخته می‌شود
    if (!admin) {
      const adminCount = await prisma.admin.count();
      if (adminCount === 0 && username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        // ساخت اولین ادمین (سوپر ادمین)
        const hashedPassword = await bcrypt.hash(password, 12);
        admin = await prisma.admin.create({
          data: { username, password: hashedPassword, nickname: username },
        });
      } else {
        return "نام کاربری یا رمز عبور نامعتبر است.";
      }
    }

    // بررسی فعال بودن ادمین
    if (!admin.isActive) {
      return "حساب کاربری شما غیرفعال شده است.";
    }

    // بررسی رمز عبور
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return "نام کاربری یا رمز عبور نامعتبر است.";
    }

    // ذخیره session
    const cookieStore = await cookies();
    cookieStore.set("admin-id", admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 ساعت
      path: "/",
    });
    cookieStore.set("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    // ثبت لاگ ورود
    await logAction("login", { username });

    redirect("/admin");
  } catch (error) {
    console.error("Login error:", error);
    return "خطایی در ورود رخ داد.";
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-id");
  cookieStore.delete("admin-auth");
  redirect("/secret-admin-login");
}

// --- توابع کمکی ---


async function uploadVersionJson(version: string, changelog: string, url: string) {
  // تبدیل changelog به آرایه
  const changelogArray: string[] = (() => {
    if (!changelog) return [];
    try {
      const parsed = JSON.parse(changelog);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch { }
    return changelog
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
  })();

  const versionObj = {
    latest_version: version,
    release_date: new Date().toLocaleDateString("fa-IR"),
    download_url: url,
    changelog: changelogArray,
  };

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.warn("توکن BLOB_READ_WRITE_TOKEN موجود نیست؛ version.json آپلود نشد.");
      return;
    }

    const blob = await put(
      "version.json",
      new Blob([JSON.stringify(versionObj, null, 2)], { type: "application/json" }),
      {
        access: "public",
        contentType: "application/json",
        allowOverwrite: true,
      }
    );

    console.log("version.json با موفقیت بازنویسی شد:", blob.url);
  } catch (err) {
    console.error("خطا در آپلود version.json:", err);
  }
}

async function findLatestVersionInDb() {
  try {
    const allFiles = await prisma.appFile.findMany({
      select: { version: true, changelog: true, url: true },
    });
    if (allFiles.length === 0) return null;

    // مرتب‌سازی بر اساس ورژن
    const sortedFiles = allFiles.sort((a, b) => compareVersions(b.version, a.version));
    const latest = sortedFiles[0];
    console.log("آخرین نسخه در DB:", latest);
    return latest;
  } catch (err) {
    console.error("خطا در دریافت آخرین نسخه از DB:", err);
    return null;
  }
}

// --- بخش اصلی مدیریت نسخه ---

interface AppVersionData {
  version: string;
  changelog: string;
  fileName: string;
  url: string;
  manualUrl?: string;
}


interface PublishData {
  version: string;
  changelog: string;
  url: string;
}

export async function publishSpecificVersion(data: PublishData) {
  try {
    if (!data.version || !data.url) {
      return { error: "شماره نسخه و لینک دانلود الزامی است." };
    }
    await uploadVersionJson(data.version, data.changelog, data.url);
    revalidatePath("/");
    revalidatePath("/download");
    return { success: true, message: `نسخه ${data.version} با موفقیت منتشر شد.` };
  } catch (error) {
    console.error("Error in publishSpecificVersion:", error);
    return { error: "خطایی در هنگام انتشار نسخه رخ داد." };
  }
}


// --- [تغییر اصلی] توابع سازگاری برای فرم قدیمی ---
// این توابع اضافه شده‌اند تا فرم شما که از نام‌های قدیمی استفاده می‌کند، بدون هیچ تغییری کار کند.

export async function createAppFile(data: AppVersionData) {
  // این تابع به سادگی تابع جدید و اصلی را فراخوانی می‌کند
  return saveAppVersion(data);
}

export async function updateAppFile(data: AppVersionData) {
  // این تابع نیز به سادگی تابع جدید و اصلی را فراخوانی می‌کند
  return saveAppVersion(data);
}
// --- پایان بخش سازگاری ---


// --- توابع دیگر ---

// --- بخش مدیریت تیکت‌ها (بدون تغییر) ---
interface ReplyData {
  ticketId: string;
  content: string;
  status: string;
}

export async function addReplyToTicket(data: ReplyData) {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_TICKETS);
    if (permError) return { error: permError };

    await prisma.$transaction(async (tx) => {
      await tx.ticketReply.create({
        data: { ticketId: data.ticketId, content: data.content, authorIsAdmin: true },
      });
      await tx.ticket.update({
        where: { id: data.ticketId }, data: { status: data.status },
      });
    });

    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${data.ticketId}`);
    const ticket = await prisma.ticket.findUnique({ where: { id: data.ticketId }, select: { trackingId: true } });
    if (ticket) {
      revalidatePath(`/support/track/${ticket.trackingId}`);
    }
    await logAction("reply_ticket", { ticketId: data.ticketId, status: data.status });
    return { success: true };
  } catch (error) {
    console.error("Error adding reply:", error);
    return { error: "خطا در ثبت پاسخ." };
  }
}








// --- مدیریت فایل اپلیکیشن ---

interface AppFileData {
  version: string;
  changelog: string;
  fileName: string | null;
  url: string;
}

export async function saveAppVersion(data: AppFileData) {
  try {
    // بررسی دسترسی
    const permError = await requirePermission(PERMISSIONS.UPLOAD_VERSIONS);
    if (permError) return { error: permError };

    console.log("=== saveAppVersion START ===");
    console.log("داده‌های ورودی:", data);

    // تضمین اینکه fileName همیشه رشته باشد
    const safeFileName = data.fileName ?? "";
    const safeUrl = data.url;

    // بررسی وجود نسخه
    const existing = await prisma.appFile.findUnique({
      where: { version: data.version },
    });

    if (existing) {
      console.log(`نسخه ${data.version} موجود است → آپدیت`);
      await prisma.appFile.update({
        where: { version: data.version },
        data: {
          changelog: data.changelog,
          fileName: safeFileName,
          url: safeUrl,
        },
      });
    } else {
      console.log(`نسخه ${data.version} موجود نیست → ایجاد رکورد جدید`);
      await prisma.appFile.create({
        data: {
          version: data.version,
          changelog: data.changelog,
          fileName: safeFileName,
          url: safeUrl,
        },
      });
    }

    // گرفتن آخرین نسخه DB برای ساخت version.json
    const latestDbFile = await prisma.appFile.findFirst({
      orderBy: { releaseDate: "desc" },
    });

    if (!latestDbFile) {
      console.warn("هیچ نسخه‌ای در DB یافت نشد؛ version.json ساخته نشد.");
      return { success: true };
    }

    // تبدیل changelog به آرایه
    let changelogArray: string[] = [];
    try {
      const parsed = JSON.parse(latestDbFile.changelog);
      if (Array.isArray(parsed)) changelogArray = parsed.map(String);
      else changelogArray = latestDbFile.changelog.split("\n").map(s => s.trim()).filter(Boolean);
    } catch {
      changelogArray = latestDbFile.changelog.split("\n").map(s => s.trim()).filter(Boolean);
    }

    const versionObj = {
      latest_version: latestDbFile.version,
      release_date: new Date(latestDbFile.releaseDate).toLocaleDateString("fa-IR"),
      download_url: latestDbFile.url,
      changelog: changelogArray,
    };

    console.log("version.json آماده برای آپلود:", versionObj);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      try {
        const blob = await put(
          "version.json",
          JSON.stringify(versionObj, null, 2),
          {
            access: "public",
            contentType: "application/json",
            allowOverwrite: true, // overwrite نسخه قبلی
            token, // حتماً token سروری را بدهید
          }
        );
        console.log("version.json با موفقیت بازنویسی شد:", blob.url);
      } catch (uploadErr) {
        console.error("خطا در آپلود version.json:", uploadErr);
      }
    } else {
      console.warn("توکن BLOB_READ_WRITE_TOKEN موجود نیست؛ version.json آپلود نشد.");
    }

    revalidatePath("/");
    revalidatePath("/download");

    console.log("=== saveAppVersion END ===");
    await logAction("upload_version", { version: data.version, fileName: safeFileName });
    return { success: true };
  } catch (error) {
    console.error("Error saving app version:", error);
    return { error: "خطا در ثبت نسخه جدید." };
  }
}

// گرفتن آخرین نسخه
export async function getLastAppFile() {
  try {
    const lastFile = await prisma.appFile.findFirst({
      orderBy: { releaseDate: "desc" },
    });
    return lastFile;
  } catch (error) {
    console.error("Error fetching last app file:", error);
    return null;
  }
}

// --- بخش پیام‌رسانی به برنامه‌ها ---

interface SendMessageResult {
  ok?: boolean;
  id?: string;
  error?: string;
}

/**
 * ارسال پیام (پاپ‌آپ) از سمت مدیریت به یک دستگاه خاص یا همه دستگاه‌ها (broadcast).
 * فرم ورودی: machine_id (اختیاری — خالی یعنی همه) و message
 */
export async function sendAppMessage(formData: FormData): Promise<SendMessageResult> {
  try {
    // بررسی دسترسی
    const permError = await requirePermission(PERMISSIONS.SEND_MESSAGES);
    if (permError) return { error: permError };

    const machineId = (formData.get("machine_id") as string)?.trim() || "";
    const message = (formData.get("message") as string)?.trim();

    if (!message) {
      return { error: "متن پیام نمی‌تواند خالی باشد." };
    }

    if (machineId) {
      // اگر دستگاه مشخص شده، باید در دیتابیس وضعیت وجود داشته باشد
      const exists = await prisma.appStatus.findUnique({
        where: { machineId },
        select: { machineId: true },
      });
      if (!exists) {
        return { error: "دستگاه انتخاب‌شده یافت نشد." };
      }
    }

    const created = await prisma.appMessage.create({
      data: {
        machineId: machineId || null, // null = broadcast
        message,
      },
    });

    revalidatePath("/admin/messages");
    await logAction("send_message", { machineId: machineId || "broadcast", message: message.substring(0, 50) });
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("Error sending app message:", error);
    return { error: "خطا در ارسال پیام." };
  }
}

// ====== بخش مدیریت ادمین‌ها (CRUD) ======

interface AdminResult {
  ok?: boolean;
  id?: string;
  error?: string;
}

/**
 * ایجاد ادمین جدید
 */
export async function createAdmin(data: {
  username: string;
  password: string;
  nickname: string;
  permissions: string[];
}): Promise<AdminResult> {
  try {
    // بررسی دسترسی
    const permError = await requirePermission(PERMISSIONS.MANAGE_ADMINS);
    if (permError) return { error: permError };

    // بررسی تکراری نبودن نام کاربری
    const existing = await prisma.admin.findUnique({ where: { username: data.username } });
    if (existing) return { error: "این نام کاربری قبلاً ثبت شده است." };

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const admin = await prisma.admin.create({
      data: {
        username: data.username,
        password: hashedPassword,
        nickname: data.nickname,
        permissions: {
          create: data.permissions.map((action) => ({ action })),
        },
      },
    });

    await logAction("create_admin", { username: data.username, permissions: data.permissions });
    revalidatePath("/admin/admins");
    return { ok: true, id: admin.id };
  } catch (error) {
    console.error("Error creating admin:", error);
    return { error: "خطا در ایجاد ادمین." };
  }
}

/**
 * ویرایش ادمین
 */
export async function updateAdmin(data: {
  id: string;
  username: string;
  password?: string;
  nickname: string;
  permissions: string[];
}): Promise<AdminResult> {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_ADMINS);
    if (permError) return { error: permError };

    const updateData: Record<string, unknown> = {
      username: data.username,
      nickname: data.nickname,
    };

    if (data.password && data.password.length > 0) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    // بروزرسانی اطلاعات ادمین
    await prisma.admin.update({
      where: { id: data.id },
      data: updateData,
    });

    // بازنویسی دسترسی‌ها
    await prisma.permission.deleteMany({ where: { adminId: data.id } });
    if (data.permissions.length > 0) {
      await prisma.permission.createMany({
        data: data.permissions.map((action) => ({ adminId: data.id, action })),
      });
    }

    await logAction("update_admin", { adminId: data.id, username: data.username, permissions: data.permissions });
    revalidatePath("/admin/admins");
    return { ok: true };
  } catch (error) {
    console.error("Error updating admin:", error);
    return { error: "خطا در ویرایش ادمین." };
  }
}

/**
 * حذف ادمین
 */
export async function deleteAdmin(id: string): Promise<AdminResult> {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_ADMINS);
    if (permError) return { error: permError };

    // جلوگیری از حذف خود
    const currentAdminId = await getCurrentAdmin();
    if (currentAdminId === id) {
      return { error: "نمی‌توانید حساب خودتان را حذف کنید." };
    }

    await prisma.admin.delete({ where: { id } });
    await logAction("delete_admin", { adminId: id });
    revalidatePath("/admin/admins");
    return { ok: true };
  } catch (error) {
    console.error("Error deleting admin:", error);
    return { error: "خطا در حذف ادمین." };
  }
}

/**
 * فعال/غیرفعال کردن ادمین
 */
export async function toggleAdminStatus(id: string, isActive: boolean): Promise<AdminResult> {
  try {
    const permError = await requirePermission(PERMISSIONS.MANAGE_ADMINS);
    if (permError) return { error: permError };

    // جلوگیری از غیرفعال کردن خود
    const currentAdminId = await getCurrentAdmin();
    if (currentAdminId === id && !isActive) {
      return { error: "نمی‌توانید حساب خودتان را غیرفعال کنید." };
    }

    await prisma.admin.update({
      where: { id },
      data: { isActive },
    });

    await logAction("toggle_admin_status", { adminId: id, isActive });
    revalidatePath("/admin/admins");
    return { ok: true };
  } catch (error) {
    console.error("Error toggling admin status:", error);
    return { error: "خطا در تغییر وضعیت ادمین." };
  }
}

/**
 * دریافت لیست ادمین‌ها
 */
export async function getAdminsList() {
  return prisma.admin.findMany({
    include: {
      permissions: { select: { action: true } },
      _count: { select: { auditLogs: true, licenses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * دریافت اطلاعات یک ادمین
 */
export async function getAdminById(id: string) {
  return prisma.admin.findUnique({
    where: { id },
    include: {
      permissions: { select: { action: true } },
    },
  });
}

// ====== بخش تولید لایسنس ======

interface LicenseResult {
  ok?: boolean;
  licenseKey?: string;
  error?: string;
}

export async function generateLicenseKey(formData: FormData): Promise<LicenseResult> {
  try {
    const permError = await requirePermission(PERMISSIONS.GENERATE_LICENSE);
    if (permError) return { error: permError };

    const machineId = (formData.get("machine_id") as string)?.trim();
    const expiryDays = parseInt(formData.get("expiry_days") as string) || 30;

    if (!machineId) {
      return { error: "شناسه دستگاه (Machine ID) را وارد کنید." };
    }

    if (expiryDays < 1 || expiryDays > 3650) {
      return { error: "مدت اعتبار باید بین 1 تا 3650 روز باشد." };
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    expiryDate.setHours(23, 59, 59, 999);

    // تولید لایسنس
    const licenseKey = generateLicense(machineId, expiryDate);

    // ذخیره در دیتابیس
    const adminId = await getCurrentAdmin();

    await prisma.generatedLicense.create({
      data: {
        machineId,
        licenseKey,
        expiryDate,
        adminId: adminId || null,
      },
    });

    await logAction("generate_license", { machineId, expiryDays });
    revalidatePath("/admin/licenses");
    return { ok: true, licenseKey };
  } catch (error) {
    console.error("Error generating license:", error);
    return { error: "خطا در تولید لایسنس." };
  }
}

/**
 * دریافت تاریخچه لایسنس‌های تولید شده
 */
export async function getLicensesList() {
  return prisma.generatedLicense.findMany({
    include: {
      admin: { select: { nickname: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/**
 * دریافت لیست لاگ‌های فعالیت
 */
export async function getAuditLogs(skip = 0, take = 50) {
  return prisma.auditLog.findMany({
    include: {
      admin: { select: { nickname: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

/**
 * دریافت تعداد کل لاگ‌ها
 */
export async function getAuditLogsCount() {
  return prisma.auditLog.count();
}
