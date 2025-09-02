"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob/server";
import { timingSafeEqual } from "crypto";

// --- بخش احراز هویت ادمین ---

export async function authenticateAdmin(prevState: string | undefined, formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !password) {
    return "رمز عبور نامعتبر است.";
  }

  const inputBuffer = Buffer.from(password, 'utf8');
  const expectedBuffer = Buffer.from(adminPassword, 'utf8');

  if (inputBuffer.length !== expectedBuffer.length || !timingSafeEqual(inputBuffer, expectedBuffer)) {
    return "رمز عبور نامعتبر است.";
  }

  // FIX: اضافه کردن await
  const cookieStore = await cookies(); 
  cookieStore.set("admin-auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 روز
    path: "/"
  });
  redirect("/admin");
}

export async function adminLogout() {
  // FIX: اضافه کردن await
  const cookieStore = await cookies(); 
  cookieStore.delete("admin-auth");
  redirect("/secret-admin-login");
}

// --- بخش مدیریت فایل برنامه ---

interface AppFileData {
  version: string;
  changelog: string;
  fileName: string;
  url: string;
}

export async function createAppFile(data: AppFileData) {
  try {
    const existingVersion = await prisma.appFile.findUnique({
      where: { version: data.version },
    });

    if (existingVersion) {
      return { error: `نسخه ${data.version} قبلاً ثبت شده است.` };
    }

    await prisma.appFile.create({
      data: {
        version: data.version,
        changelog: data.changelog,
        fileName: data.fileName,
        url: data.url,
      },
    });

    const changelogArray: string[] = (() => {
      if (!data.changelog) return [];
      try {
        const parsed = JSON.parse(data.changelog);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch (_) { /* Not JSON, proceed */ }
      return data.changelog.split("\n").map((s) => s.trim()).filter(Boolean);
    })();

    const versionObj = {
      latest_version: data.version,
      release_date: new Date().toLocaleDateString("fa-IR"),
      download_url: data.url,
      changelog: changelogArray,
    };

    const versionJsonStr = JSON.stringify(versionObj, null, 2);

    try {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
         console.warn("BLOB_READ_WRITE_TOKEN تعریف نشده؛ version.json آپلود نشد.");
         revalidatePath("/");
         revalidatePath("/download");
         return { success: true, warning: "BLOB_READ_WRITE_TOKEN موجود نیست؛ version.json آپلود نشد." };
      }
      
      const blob = await put("version.json", versionJsonStr, {
        access: "public",
        allowOverwrite: true,
      });
      
      console.log(`version.json با موفقیت در ${blob.url} بازنویسی شد.`);

    } catch (uploadErr) {
      console.error("خطا در آپلود version.json:", uploadErr);
      revalidatePath("/");
      revalidatePath("/download");
      return { success: true, warning: "داده در دیتابیس ذخیره شد، اما آپلود version.json به Blob ناموفق بود." };
    }

    revalidatePath("/");
    revalidatePath("/download");

    return { success: true };

  } catch (error) {
    console.error("Error creating app file:", error);
    return { error: "خطایی کلی در هنگام ذخیره یا آپلود رخ داد." };
  }
}

// --- بخش مدیریت تیکت‌ها ---

type TicketStatus = 'OPEN' | 'CLOSED' | 'PENDING';

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
    if (ticket) {
      revalidatePath(`/support/track/${ticket.trackingId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding reply:", error);
    return { error: "خطا در ثبت پاسخ." };
  }
}