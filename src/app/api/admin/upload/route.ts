import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // این تابع قبل از تولید توکن آپلود اجرا می‌شود
      onBeforeGenerateToken: async (pathname: string) => {
        // چک کردن کوکی ادمین برای امنیت
        const cookieStore = cookies();
        const isAdmin = cookieStore.get('admin-auth')?.value === 'true';

        if (!isAdmin) {
          throw new Error('دسترسی غیرمجاز');
        }

        return {
          // می‌توانید اینجا محدودیت‌های دیگری هم اضافه کنید
          // مثلاً حداکثر حجم فایل (به بایت)
          // maximumBlobSize: 10 * 1024 * 1024, // 10MB
          allowedContentTypes: ['application/zip', 'application/x-zip-compressed'],
        };
      },
      // این تابع بعد از اتمام آپلود اجرا می‌شود
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('فایل با موفقیت در Vercel Blob آپلود شد:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}