-- CreateTable: MachineConfigOverride (per-machine timing settings)
CREATE TABLE "MachineConfigOverride" (
    "machineId" TEXT NOT NULL,
    "messageCheckInterval" INTEGER,
    "statusUpdateInterval" INTEGER,
    "versionCheckInterval" INTEGER,
    "donationPollInterval" INTEGER,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MachineConfigOverride_pkey" PRIMARY KEY ("machineId")
);
