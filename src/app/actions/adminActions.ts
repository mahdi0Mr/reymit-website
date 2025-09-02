"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { upload } from "@vercel/blob/client"; // اضافه شد

// --- بخش احراز هویت ادمین ---

export async function authenticateAdmin(prevState: string | undefined, formData: FormData) {
  const password = formData.get("password") as string;

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 روز
      path: "/"
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

// --- بخش مدیریت فایل برنامه ---

interface AppFileData {
  version: string;
  changelog: string; // می‌تواند JSON array یا متن چندخط باشد
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

    // تبدیل changelog به آرایه (اگر کاربر JSON فرستاده یا متن چندخط)
    const changelogArray: string[] = (() => {
      if (!data.changelog) return [];
      try {
        const parsed = JSON.parse(data.changelog);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch (error) {
        console.error("Error :", error);
      }
      // fallback: اگر چند خط وارد شده
      return data.changelog
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    })();

    const versionObj = {
      latest_version: data.version,
      release_date: new Date().toLocaleDateString("fa-IR"),
      download_url: data.url,
      changelog: changelogArray,
    };

    const versionJsonStr = JSON.stringify(versionObj, null, 2);

    // تلاش برای آپلود version.json به Vercel Blob با توکن سروری
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.warn("BLOB_READ_WRITE_TOKEN تعریف نشده؛ version.json آپلود نشد.");
      // revalidate صفحات لازم
      revalidatePath("/");
      revalidatePath("/download");
      return { success: true, warning: "BLOB_READ_WRITE_TOKEN موجود نیست؛ version.json آپلود نشد." };
    }

    try {
      // آپلود version.json با endpoint سروری
      await upload(
        "version.json",
        new Blob([versionJsonStr], { type: "application/json" }),
        {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          // @ts-expect-error: allowOverwrite موجود در type تعریف نشده ولی ما میخوایم استفاده کنیم
          allowOverwrite: true,
        }
      );


      console.log("version.json با موفقیت آپلود شد.");
    } catch (uploadErr) {
      console.error("خطا در آپلود version.json:", uploadErr);
      revalidatePath("/");
      revalidatePath("/download");
      return { success: true, warning: "ریختن version.json به Blob ناموفق بود." };
    }


    // revalidate صفحات لازم
    revalidatePath("/");
    revalidatePath("/download");

    return { success: true };
  } catch (error) {
    console.error("Error creating app file:", error);
    return { error: "خطایی در هنگام ذخیره یا آپلود رخ داد." };
  }
}

// --- بخش مدیریت تیکت‌ها ---

interface ReplyData {
  ticketId: string;
  content: string;
  status: string;
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
