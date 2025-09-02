// src/app/api/admin/upload/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  // request.json() returns the payload that the client-side upload helper sends
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('admin-auth')?.value === 'true';

        if (!isAdmin) {
          console.error('دسترسی غیرمجاز: کوکی admin-auth موجود نیست یا اشتباه است.');
          throw new Error('دسترسی غیرمجاز');
        }

        return {
          allowedContentTypes: ['application/zip', 'application/x-zip-compressed'],
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // اینجا فقط لاگ می‌کنیم؛ کار ذخیره‌ی metadata را در action سروری انجام می‌دهیم
        console.log('فایل با موفقیت آپلود شد (blob):', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('خطا در آپلود:', error);
    const message = (error as Error).message || 'خطای نامعلوم';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
