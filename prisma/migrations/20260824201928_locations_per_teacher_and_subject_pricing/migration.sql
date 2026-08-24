/*
  Warnings:

  - You are about to drop the column `hourlyRate` on the `teacher_profiles` table. All the data in the column will be lost.
  - You are about to drop the `_TeacherLocations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `teacherProfileId` to the `locations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_TeacherLocations" DROP CONSTRAINT "_TeacherLocations_A_fkey";

-- DropForeignKey
ALTER TABLE "_TeacherLocations" DROP CONSTRAINT "_TeacherLocations_B_fkey";

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "teacherProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "basePrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "teacher_profiles" DROP COLUMN "hourlyRate";

-- DropTable
DROP TABLE "_TeacherLocations";

-- CreateIndex
CREATE INDEX "locations_teacherProfileId_idx" ON "locations"("teacherProfileId");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
