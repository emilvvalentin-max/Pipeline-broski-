-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('researching', 'applied', 'interview', 'offer', 'rejected');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('finn', 'linkedin', 'referral', 'direct', 'other');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('cv', 'cover_letter');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "source" "Source" NOT NULL DEFAULT 'other',
    "stage" "Stage" NOT NULL DEFAULT 'researching',
    "deadline" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "fitScore" INTEGER,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "rawListing" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stage" "Stage" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "round" TEXT NOT NULL,
    "interviewerNames" TEXT,
    "questionsAsked" TEXT,
    "howItWent" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "culture" TEXT,
    "recentNews" TEXT,
    "whyThisCompany" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkingContact" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "relationship" TEXT,
    "warmOrCold" TEXT NOT NULL DEFAULT 'cold',
    "hasReachedOut" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkingContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "compensation" TEXT,
    "benefits" TEXT,
    "location" TEXT,
    "growthNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StageEvent_applicationId_idx" ON "StageEvent"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewLog_applicationId_idx" ON "InterviewLog"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyNote_applicationId_key" ON "CompanyNote"("applicationId");

-- CreateIndex
CREATE INDEX "NetworkingContact_applicationId_idx" ON "NetworkingContact"("applicationId");

-- CreateIndex
CREATE INDEX "DocumentVersion_applicationId_type_idx" ON "DocumentVersion"("applicationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_applicationId_key" ON "Offer"("applicationId");

-- AddForeignKey
ALTER TABLE "StageEvent" ADD CONSTRAINT "StageEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewLog" ADD CONSTRAINT "InterviewLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyNote" ADD CONSTRAINT "CompanyNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkingContact" ADD CONSTRAINT "NetworkingContact_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

