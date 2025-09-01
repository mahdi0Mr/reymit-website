import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname: string) => {
                // اینجا هیچ چک امنیتی خاصی برای کاربر نداریم چون عمومی است
                // اما محدودیت‌های فایل را اعمال می‌کنیم
                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                    maximumBlobSize: 4 * 1024 * 1024, // 4MB
                };
            },
            onUploadCompleted: async ({ blob }) => {
                console.log('User image uploaded:', blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}