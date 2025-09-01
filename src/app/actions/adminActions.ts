"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import prisma from "@/lib/prisma"; // Prisma client را import کنید

// --- بخش احراز هویت ادمین ---

export async function authenticateAdmin(prevState: string | undefined, formData: FormData) {
  const password = formData.get('password') as string;
  
  if (password === process.env.ADMIN_PASSWORD) {
    cookies().set('admin-auth', 'true', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 60 * 60 * 24, // 1 روز
      path: '/' 
    });
    redirect('/admin');
  }
  
  return "رمز عبور نامعتبر است.";
}

export async function adminLogout() {
  cookies().delete('admin-auth');
  redirect('/secret-admin-login');
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

    // کش صفحه دانلود و صفحه اصلی را به‌روز کن
    revalidatePath('/');
    revalidatePath('/download');

    return { success: true };
  } catch (error) {
    console.error("Error creating app file:", error);
    return { error: 'خطایی در هنگام ذخیره در دیتابیس رخ داد.' };
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
    // استفاده از transaction برای اطمینان از انجام هر دو عملیات با هم
    await prisma.$transaction(async (tx) => {
      // 1. ثبت پاسخ جدید
      await tx.ticketReply.create({
        data: {
          ticketId: data.ticketId,
          content: data.content,
          authorIsAdmin: true,
        },
      });

      // 2. به‌روزرسانی وضعیت تیکت اصلی
      await tx.ticket.update({
        where: { id: data.ticketId },
        data: { status: data.status },
      });
    });
    
    // پاک کردن کش صفحات مربوط به تیکت‌ها تا اطلاعات جدید نمایش داده شود
    revalidatePath('/admin/tickets');
    revalidatePath(`/admin/tickets/${data.ticketId}`);
    // همچنین صفحه پیگیری کاربر را هم revalidate می‌کنیم
    const ticket = await prisma.ticket.findUnique({ where: { id: data.ticketId }, select: { trackingId: true } });
    if (ticket) {
      revalidatePath(`/support/track/${ticket.trackingId}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error adding reply:", error);
    return { error: 'خطا در ثبت پاسخ.' };
  }
}