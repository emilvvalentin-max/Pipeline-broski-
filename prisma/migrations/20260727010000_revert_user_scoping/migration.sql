-- DropIndex
DROP INDEX "Application_userId_idx";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "id" SET DEFAULT 'singleton';

-- Reclaim any profile row left behind by the per-user experiment
UPDATE "Profile" SET id = 'singleton' WHERE id != 'singleton';
