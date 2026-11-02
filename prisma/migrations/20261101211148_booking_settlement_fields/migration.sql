-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'CASH');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "paidOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "teacherPayout" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN     "payoutPerHour" DOUBLE PRECISION;
