// src/app/api/latest-version/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // دریافت آخرین نسخه بر اساس releaseDate
    const latestApp = await prisma.appFile.findFirst({
      orderBy: { releaseDate: "desc" },
    });

    if (!latestApp) {
      return NextResponse.json(
        { error: "هیچ نسخه‌ای یافت نشد." },
        { status: 404 }
      );
    }

    // تشخیص دامنه از request
    const origin = request.nextUrl.origin; // مثال: https://wumpus.ir
    const downloadUrl = `${origin}${latestApp.url}`;

    // تبدیل changelog به آرایه
    let changelogArray: string[] = [];
    try {
      const parsed = JSON.parse(latestApp.changelog);
      if (Array.isArray(parsed)) changelogArray = parsed.map(String);
      else changelogArray = latestApp.changelog.split("\n").map(s => s.trim()).filter(Boolean);
    } catch {
      changelogArray = latestApp.changelog.split("\n").map(s => s.trim()).filter(Boolean);
    }

    return NextResponse.json({
      latest_version: latestApp.version,
      release_date: new Date(latestApp.releaseDate).toLocaleDateString("fa-IR"),
      download_url: downloadUrl,
      changelog: changelogArray,
    });
  } catch (err) {
    console.error("Error fetching latest version:", err);
    return NextResponse.json(
      { error: "خطا در دریافت نسخه آخر." },
      { status: 500 }
    );
  }
}
