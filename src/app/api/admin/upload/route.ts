// src/app/api/admin/upload/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch (err) {
    console.error("خطا در خواندن JSON درخواست:", err);
    return NextResponse.json({ error: "فرمت درخواست نامعتبر است." }, { status: 400 });
  }

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
        // blob.url موجود است، اما blob.name ندارد
        console.log(`فایل با موفقیت آپلود شد: ${blob.url}`);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('خطا در آپلود:', err);
    const message = err instanceof Error ? err.message : 'خطای نامعلوم';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
