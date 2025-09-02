import { handleUpload, upload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface VersionJson {
  latest_version: string;
  release_date: string;
  download_url: string;
  changelog: string[];
}

export async function POST(request: Request): Promise<NextResponse> {
  const { file, version, changelog } = await request.json() as {
    file: HandleUploadBody;
    version: string;
    changelog: string[];
  };

  try {
    // آپلود فایل اصلی
    const jsonResponse = await handleUpload({
      body: file,
      request,
      onBeforeGenerateToken: async () => {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('admin-auth')?.value === 'true';

        if (!isAdmin) {
          console.error('دسترسی غیرمجاز');
          throw new Error('دسترسی غیرمجاز');
        }

        return { allowedContentTypes: ['application/zip', 'application/x-zip-compressed'] };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('فایل با موفقیت آپلود شد:', blob.url);

        const versionData: VersionJson = {
          latest_version: version,
          release_date: new Date().toLocaleDateString('fa-IR'),
          download_url: blob.url,
          changelog: changelog || [],
        };

        const versionJsonStr = JSON.stringify(versionData, null, 2);

        // آپلود version.json بدون credentials اضافی
        await upload('version.json', new Blob([versionJsonStr], { type: 'application/json' }), {
          access: 'public',
          handleUploadUrl: '/api/admin/upload',
        });

        console.log('version.json با موفقیت آپدیت شد');
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('خطا در آپلود:', error);
    const message = (error as Error).message || 'خطای نامعلوم';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
