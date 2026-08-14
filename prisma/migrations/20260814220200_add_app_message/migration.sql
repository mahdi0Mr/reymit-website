-- CreateTable: پیام‌های ارسالی از سمت مدیریت به برنامه‌ها
CREATE TABLE "AppMessage" (
    "id" TEXT NOT NULL,
    "machineId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "AppMessage_pkey" PRIMARY KEY ("id")
);
