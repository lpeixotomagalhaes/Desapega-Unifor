-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDENTE', 'NEGOCIANDO', 'ENTREGUE');

-- AlterTable
ALTER TABLE "ItemInterest" ADD COLUMN "course" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ItemInterest" ADD COLUMN "enrollment" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ItemInterest" ADD COLUMN "acceptListedPrice" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ItemInterest" ADD COLUMN "offeredPrice" DECIMAL(10,2);
ALTER TABLE "ItemInterest" ADD COLUMN "meetupDay" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ItemInterest" ADD COLUMN "meetupTime" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ItemInterest" ADD COLUMN "campusBlock" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ItemInterest" ADD COLUMN "status" "OrderStatus" NOT NULL DEFAULT 'PENDENTE';

-- CreateIndex
CREATE INDEX "ItemInterest_status_idx" ON "ItemInterest"("status");
