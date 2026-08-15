-- CreateTable: ApiPlatform (global catalog of platform templates)
CREATE TABLE "ApiPlatform" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "listPath" TEXT NOT NULL DEFAULT 'data',
    "idField" TEXT NOT NULL DEFAULT 'id',
    "nameField" TEXT NOT NULL DEFAULT 'name',
    "amountField" TEXT NOT NULL DEFAULT 'amount',
    "amountUnit" TEXT NOT NULL DEFAULT 'toman',
    "advancedJson" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ApiPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiPlatform_key_key" ON "ApiPlatform"("key");

-- CreateTable: MachinePlatform (per-machine link to catalog)
CREATE TABLE "MachinePlatform" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MachinePlatform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MachinePlatform_machineId_idx" ON "MachinePlatform"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "MachinePlatform_machineId_platformId_key" ON "MachinePlatform"("machineId", "platformId");

-- Seed catalog with the two built-in platforms (Reymit + Donito)
INSERT INTO "ApiPlatform" ("id", "key", "displayName", "apiUrl", "listPath", "idField", "nameField", "amountField", "amountUnit", "advancedJson", "enabled", "sortOrder", "createdAt", "updatedAt") VALUES
('seed_platform_reymit', 'reymit', 'Reymit', 'https://api.reymit.ir/user/{token}/donates/last-donates', 'data.donates', 'id', 'name', 'toman_amount', 'toman', NULL, true, 0, NOW(), NOW()),
('seed_platform_donito', 'donito', 'Donito', 'https://donito.me/api/v1/thirdparty/{token}/donations/recent', 'data', 'id', 'nickname', 'amount', 'toman', NULL, true, 1, NOW(), NOW());
