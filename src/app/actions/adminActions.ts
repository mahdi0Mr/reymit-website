"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { compareVersions } from "compare-versions";

// --- بخش احراز هویت ادمین (بدون تغییر) ---
export async function authenticateAdmin(prevState: string | undefined, formData: FormData) {
  const password = formData.get("password") as string;
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    redirect("/admin");
  }
  return "رمز عبور نامعتبر است.";
}

export async function adminLogout() {
  const cookieStore = await cookies();
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
    return { success: true };
  } catch (error) {
    console.error("Error adding reply:", error);
    return { error: "خطا در ثبت پاسخ." };
  }
}








import { upload } from "@vercel/blob/client";

// --- مدیریت فایل اپلیکیشن ---

interface AppFileData {
  version: string;
  changelog: string;
  fileName: string | null;
  url: string;
}

export async function saveAppVersion(data: AppFileData) {
  try {
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
      latest_version: data.version,
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
