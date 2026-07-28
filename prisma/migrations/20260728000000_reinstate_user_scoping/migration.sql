-- AlterTable
ALTER TABLE "Application" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "id" DROP DEFAULT;
