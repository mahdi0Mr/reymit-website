"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob/client"; // بدون تایپ PutBlobResult
import { timingSafeEqual } from "crypto";

// --- بخش احراز هویت ادمین ---
export async function authenticateAdmin(prevState: string | undefined, formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !password) return "رمز عبور نامعتبر است.";

  const inputBuffer = Buffer.from(password, "utf8");
  const expectedBuffer = Buffer.from(adminPassword, "utf8");

  if (inputBuffer.length !== expectedBuffer.length || !timingSafeEqual(inputBuffer, expectedBuffer)) {
    return "رمز عبور نامعتبر است.";
  }

  const cookieStore = await cookies();
  cookieStore.set("admin-auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  redirect("/admin");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-auth");
  redirect("/secret-admin-login");
}

// --- بخش مدیریت فایل برنامه

export interface AppFileData {
  version: string;
  changelog: string; // می‌تواند JSON array یا متن چندخط باشد
  fileName: string;
  url: string; // لینک blob که کلاینت بعد از upload دریافت می‌کند
}

export async function createAppFile(data: AppFileData) {
  try {
    const existingVersion = await prisma.appFile.findUnique({
      where: { version: data.version },
    });

    if (existingVersion) {
      return { error: `نسخه ${data.version} قبلاً ثبت شده است.` };
    }

    // 1) ذخیرهٔ رکورد در دیتابیس
    await prisma.appFile.create({
      data: {
        version: data.version,
        changelog: data.changelog,
        fileName: data.fileName,
        url: data.url,
      },
    });

    // 2) آماده‌سازی changelog به صورت آرایه
    const changelogArray: string[] = (() => {
      if (!data.changelog) return [];
      try {
        const parsed = JSON.parse(data.changelog);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch (err) {
        // changelog قابل parse نبود — رفتار منطقی ادامه می‌یابد
        // در صورت نیاز برای دیباگ می‌توانید لاگ کنید:
        console.debug("changelog is not JSON:", err);
      }
      return data.changelog.split("\n").map((s) => s.trim()).filter(Boolean);
    })();

    // 3) ساخت JSON نسخه
    const versionJsonStr = JSON.stringify({
      latest_version: data.version,
      release_date: new Date().toLocaleDateString("fa-IR"),
      download_url: data.url,
      changelog: changelogArray,
    }, null, 2);

    // 4) آپلود version.json به Vercel Blob (server-side put)
    //     - از handleUpload (client) برای فایل اصلی استفاده شده است (کلاینت).
    //     - اینجا برای version.json از put استفاده می‌کنیم و allowOverwrite را فعال می‌کنیم.
    try {
      await put(
        "version.json",
        new Blob([versionJsonStr], { type: "application/json" }),
        {
          access: "public",
          // @ts-expect-error: allowOverwrite هنوز ممکن است در تایپ رسمی تعریف نشده باشد
          allowOverwrite: true,
        }
      );
    } catch (putErr) {
      console.error("خطا در آپلود version.json به Blob:", putErr);
      // با وجود خطای put، رکورد DB ذخیره شده است؛ می‌توانیم هشدار برگردانیم
      revalidatePath("/");
      revalidatePath("/download");
      return { success: true, warning: "رکورد ذخیره شد اما آپلود version.json ناموفق بود." };
    }

    // 5) ری‌والید صفحات
    revalidatePath("/");
    revalidatePath("/download");

    return { success: true };
  } catch (error) {
    console.error("Error creating app file:", error);
    return { error: "خطایی در هنگام ذخیره یا آپلود رخ داد." };
  }
}


// --- بخش مدیریت تیکت‌ها ---
export type TicketStatus = "OPEN" | "CLOSED" | "PENDING";

interface ReplyData {
  ticketId: string;
  content: string;
  status: TicketStatus;
}

export async function addReplyToTicket(data: ReplyData) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.ticketReply.create({
        data: {
          ticketId: data.ticketId,
          content: data.content,
          authorIsAdmin: true,
        },
      });

      await tx.ticket.update({
        where: { id: data.ticketId },
        data: { status: data.status },
      });
    });

    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
      select: { trackingId: true }
    });

    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${data.ticketId}`);
    if (ticket) revalidatePath(`/support/track/${ticket.trackingId}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding reply:", error);
    return { error: "خطا در ثبت پاسخ." };
  }
}
