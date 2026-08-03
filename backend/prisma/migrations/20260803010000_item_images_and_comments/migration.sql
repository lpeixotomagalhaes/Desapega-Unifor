-- AlterTable
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill cover into imageUrls when empty
UPDATE "Item"
SET "imageUrls" = ARRAY["imageUrl"]
WHERE ("imageUrls" IS NULL OR cardinality("imageUrls") = 0)
  AND "imageUrl" IS NOT NULL
  AND "imageUrl" <> '';

-- CreateTable
CREATE TABLE IF NOT EXISTS "ItemComment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ItemComment_itemId_idx" ON "ItemComment"("itemId");
CREATE INDEX IF NOT EXISTS "ItemComment_userId_idx" ON "ItemComment"("userId");

DO $$ BEGIN
  ALTER TABLE "ItemComment" ADD CONSTRAINT "ItemComment_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ItemComment" ADD CONSTRAINT "ItemComment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
