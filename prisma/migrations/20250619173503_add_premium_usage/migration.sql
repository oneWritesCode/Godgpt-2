-- AlterTable
ALTER TABLE "usage" ADD COLUMN     "premiumCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "premiumResetAt" TIMESTAMP(3);
