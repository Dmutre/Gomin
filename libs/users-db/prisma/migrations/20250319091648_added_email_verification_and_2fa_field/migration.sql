-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false;
