-- AlterTable: add encrypted detail columns for app admin page
ALTER TABLE "AppStatus" ADD COLUMN "windowTarget" TEXT;
ALTER TABLE "AppStatus" ADD COLUMN "platformTokenEnc" TEXT;
ALTER TABLE "AppStatus" ADD COLUMN "donationLogEnc" TEXT;
ALTER TABLE "AppStatus" ADD COLUMN "appLogEnc" TEXT;