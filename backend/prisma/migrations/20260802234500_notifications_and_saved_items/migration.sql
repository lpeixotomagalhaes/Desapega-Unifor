-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WELCOME';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ITEM_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROPOSAL_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ITEM_SAVED_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_DELIVERED';

-- CreateTable SavedItem
CREATE TABLE IF NOT EXISTS "SavedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedItem_userId_itemId_key" ON "SavedItem"("userId", "itemId");
CREATE INDEX IF NOT EXISTS "SavedItem_userId_idx" ON "SavedItem"("userId");
CREATE INDEX IF NOT EXISTS "SavedItem_itemId_idx" ON "SavedItem"("itemId");

DO $$ BEGIN
  ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
