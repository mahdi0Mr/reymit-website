-- CreateTable
CREATE TABLE "AppStatus" (
    "machineId" TEXT NOT NULL,
    "computerName" TEXT NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "runningForStream" BOOLEAN NOT NULL DEFAULT false,
    "appVersion" TEXT,
    "platform" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppStatus_pkey" PRIMARY KEY ("machineId")
);