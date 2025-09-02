// src/app/api/upload-image/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch (err) {
    console.error('Invalid JSON payload for image upload:', err);
    return NextResponse.json({ error: 'فرمت درخواست نامعتبر است.' }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // این endpoint عمومی است؛ فقط محدودیت‌های نوع/حجم را اعمال می‌کنیم
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          maximumBlobSize: 4 * 1024 * 1024, // 4 MB
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // blob.url معمولاً در runtime وجود دارد
        console.log('User image uploaded:', blob?.url ?? '(no url)');
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error in upload-image route:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
