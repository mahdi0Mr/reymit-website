"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- بخش ایجاد تیکت جدید ---

interface CreateTicketState {
  error?: string | null;
  trackingId?: string | null;
}

export async function createTicket(prevState: CreateTicketState | undefined, formData: FormData): Promise<CreateTicketState> {
  const email = formData.get('email') as string;
  const contactInfo = formData.get('contactInfo') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const imageUrl = formData.get('imageUrl') as string | null; // [جدید] دریافت URL عکس از فیلد مخفی

  if (!email || !contactInfo || !title || !content || !email.includes('@')) {
    return { error: 'لطفا تمام فیلدها را به درستی پر کنید. وارد کردن اطلاعات تماس الزامی است.' };
  }

  try {
    const newTicket = await prisma.ticket.create({
      data: {
        email: email,
        contactInfo: contactInfo,
        title: title,
        content: content,
        imageUrl: imageUrl, // [جدید] ذخیره URL عکس در دیتابیس
      },
    });

    revalidatePath('/admin/tickets');
    return { trackingId: newTicket.trackingId };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { error: 'خطایی در سرور رخ داد. لطفا دوباره تلاش کنید.' };
  }
}

// --- بخش پاسخ‌دهی کاربر ---

interface ClientReplyState {
  error?: string | null;
  success?: boolean | null;
}

export async function addClientReply(prevState: ClientReplyState | undefined, formData: FormData): Promise<ClientReplyState> {
  const content = formData.get('content') as string;
  const ticketId = formData.get('ticketId') as string;
  const trackingId = formData.get('trackingId') as string;

  // [جدید] دریافت URL عکس از فیلد مخفی (می‌تواند خالی باشد)
  const imageUrl = formData.get('imageUrl') as string | null; 

  if (!content || !ticketId || !trackingId) {
    return { error: 'اطلاعات ناقص است. لطفا صفحه را رفرش کنید.' };
  }
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. ثبت پاسخ جدید کاربر
      await tx.ticketReply.create({
        data: {
          ticketId: ticketId,
          content: content,
          imageUrl: imageUrl, // [جدید] ذخیره URL عکس در دیتابیس
          authorIsAdmin: false,
        },
      });

      // 2. به‌روزرسانی وضعیت تیکت به "باز"
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: 'OPEN' },
      });
    });

    // پاک کردن کش صفحات مربوطه
    revalidatePath(`/support/track/${trackingId}`);
    revalidatePath('/admin/tickets');
    revalidatePath(`/admin/tickets/${ticketId}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding client reply:", error);
    return { error: 'خطا در ثبت پاسخ.' };
  }
}