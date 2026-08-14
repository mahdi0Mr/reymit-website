-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Data migration: existing admins that have no explicit permissions keep full access
-- as super admins, so they are not locked out after this change.
UPDATE "Admin" SET "isSuperAdmin" = true
WHERE NOT EXISTS (
  SELECT 1 FROM "Permission" WHERE "Permission"."adminId" = "Admin"."id"
);
