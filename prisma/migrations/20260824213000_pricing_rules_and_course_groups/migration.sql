-- CreateEnum
CREATE TYPE "LessonFormat" AS ENUM ('INDIVIDUAL', 'GROUP');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'WAITLIST', 'CANCELLED', 'FINISHED');

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "groupDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "basePrice";

-- AlterTable
ALTER TABLE "teacher_subjects" DROP COLUMN "price";

-- CreateTable
CREATE TABLE "price_rules" (
    "id" TEXT NOT NULL,
    "levelId" TEXT,
    "subjectId" TEXT,
    "teacherProfileId" TEXT,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "subjectId" TEXT,
    "levelId" TEXT,
    "description" TEXT,
    "minSeats" INTEGER NOT NULL DEFAULT 4,
    "maxSeats" INTEGER NOT NULL DEFAULT 8,
    "meetingsPerMonth" INTEGER NOT NULL DEFAULT 4,
    "meetingMinutes" INTEGER NOT NULL DEFAULT 60,
    "pricePerMonth" DOUBLE PRECISION NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "locationId" TEXT,
    "startsOn" DATE,
    "endsOn" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_enrollments" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "startedOn" DATE NOT NULL,
    "endedOn" DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_rules_levelId_idx" ON "price_rules"("levelId");

-- CreateIndex
CREATE INDEX "price_rules_subjectId_idx" ON "price_rules"("subjectId");

-- CreateIndex
CREATE INDEX "price_rules_teacherProfileId_idx" ON "price_rules"("teacherProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "course_groups_slug_key" ON "course_groups"("slug");

-- CreateIndex
CREATE INDEX "course_groups_teacherProfileId_idx" ON "course_groups"("teacherProfileId");

-- CreateIndex
CREATE INDEX "group_enrollments_groupId_status_idx" ON "group_enrollments"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "group_enrollments_groupId_studentId_key" ON "group_enrollments"("groupId", "studentId");

-- AddForeignKey
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_enrollments" ADD CONSTRAINT "group_enrollments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "course_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_enrollments" ADD CONSTRAINT "group_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

