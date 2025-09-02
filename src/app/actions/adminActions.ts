"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { timingSafeEqual } from "crypto";

// مسیر ذخیره فایل‌ها روی سرور
const UPLOAD_DIR = path.join(process.cwd(), "public", "downloads");

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

// --- بخش مدیریت فایل برنامه ---
interface AppFileData {
  version: string;
  changelog: string;
  fileName: string;
  url: string; // لینک دانلود نهایی
}

export async function createAppFile(data: AppFileData, fileBuffer: Buffer) {
  try {
    const existingVersion = await prisma.appFile.findUnique({
      where: { version: data.version },
    });

    if (existingVersion) {
      return { error: `نسخه ${data.version} قبلاً ثبت شده است.` };
    }

    // ذخیره فایل روی سرور
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const filePath = path.join(UPLOAD_DIR, data.fileName);
    fs.writeFileSync(filePath, fileBuffer);

    await prisma.appFile.create({
      data: {
        version: data.version,
        changelog: data.changelog,
        fileName: data.fileName,
        url: `/downloads/${data.fileName}`,
      },
    });

    // بروزرسانی version.json
    const changelogArray: string[] = (() => {
      if (!data.changelog) return [];
      try {
        const parsed = JSON.parse(data.changelog);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch (_) {}
      return data.changelog.split("\n").map((s) => s.trim()).filter(Boolean);
    })();

    const versionJsonPath = path.join(UPLOAD_DIR, "version.json");
    const versionData = {
      latest_version: data.version,
      release_date: new Date().toLocaleDateString("fa-IR"),
      download_url: `/downloads/${data.fileName}`,
      changelog: changelogArray,
    };
    fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2));

    revalidatePath("/");
    revalidatePath("/download");

    return { success: true };
  } catch (error) {
    console.error("Error creating app file:", error);
    return { error: "خطایی در هنگام ذخیره یا آپلود رخ داد." };
  }
}

// --- بخش مدیریت تیکت‌ها ---
type TicketStatus = "OPEN" | "CLOSED" | "PENDING";

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
