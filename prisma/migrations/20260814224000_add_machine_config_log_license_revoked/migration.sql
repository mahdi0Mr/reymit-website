-- AlterTable: add revoked + revokedAt to GeneratedLicense
ALTER TABLE "GeneratedLicense" ADD COLUMN "revoked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GeneratedLicense" ADD COLUMN "revokedAt" TIMESTAMPTZ;

-- CreateTable: MachineConfig (global singleton)
CREATE TABLE "MachineConfig" (
    "id" TEXT NOT NULL,
    "messageCheckInterval" INTEGER NOT NULL DEFAULT 60,
    "statusUpdateInterval" INTEGER NOT NULL DEFAULT 60,
    "versionCheckInterval" INTEGER NOT NULL DEFAULT 600,
    "donationPollInterval" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MachineConfig_pkey" PRIMARY KEY ("id")
);

-- Seed default config row
INSERT INTO "MachineConfig" ("id", "messageCheckInterval", "statusUpdateInterval", "versionCheckInterval", "donationPollInterval", "updatedAt")
VALUES ('global', 60, 60, 600, 5, NOW());

-- CreateTable: MachineLog (full change history per machine)
CREATE TABLE "MachineLog" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "source" TEXT NOT NULL DEFAULT 'app',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MachineLog_machineId_createdAt_idx" ON "MachineLog"("machineId", "createdAt");