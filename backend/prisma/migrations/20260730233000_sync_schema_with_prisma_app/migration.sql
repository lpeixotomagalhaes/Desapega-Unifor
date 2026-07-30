-- Applied on Supabase project txztxdcunjwfnkxoxamh (2026-07-30).
-- Keeps production schema aligned with prisma/schema.prisma.

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_googleId_key'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_googleId_key" UNIQUE ("googleId");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "User_googleId_idx" ON "User"("googleId");

CREATE TYPE "ItemStatus_new" AS ENUM ('ATIVO', 'NEGOCIANDO', 'CONCLUIDO');

ALTER TABLE "Item" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Item"
  ALTER COLUMN "status" TYPE "ItemStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'VENDIDO' THEN 'CONCLUIDO'::"ItemStatus_new"
      WHEN "status"::text = 'NEGOCIANDO' THEN 'NEGOCIANDO'::"ItemStatus_new"
      WHEN "status"::text = 'CONCLUIDO' THEN 'CONCLUIDO'::"ItemStatus_new"
      ELSE 'ATIVO'::"ItemStatus_new"
    END
  );

DROP TYPE "ItemStatus";
ALTER TYPE "ItemStatus_new" RENAME TO "ItemStatus";
ALTER TABLE "Item" ALTER COLUMN "status" SET DEFAULT 'ATIVO'::"ItemStatus";

ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "negotiatingWithId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Item_negotiatingWithId_fkey'
  ) THEN
    ALTER TABLE "Item"
      ADD CONSTRAINT "Item_negotiatingWithId_fkey"
      FOREIGN KEY ("negotiatingWithId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Item_negotiatingWithId_idx" ON "Item"("negotiatingWithId");
CREATE INDEX IF NOT EXISTS "Item_category_idx" ON "Item"("category");
CREATE INDEX IF NOT EXISTS "Item_userId_idx" ON "Item"("userId");
CREATE INDEX IF NOT EXISTS "Item_status_idx" ON "Item"("status");

CREATE TABLE IF NOT EXISTS "ItemInterest" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItemInterest_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ItemInterest_itemId_buyerId_key'
  ) THEN
    ALTER TABLE "ItemInterest" ADD CONSTRAINT "ItemInterest_itemId_buyerId_key" UNIQUE ("itemId", "buyerId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ItemInterest_itemId_fkey'
  ) THEN
    ALTER TABLE "ItemInterest"
      ADD CONSTRAINT "ItemInterest_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "Item"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ItemInterest_buyerId_fkey'
  ) THEN
    ALTER TABLE "ItemInterest"
      ADD CONSTRAINT "ItemInterest_buyerId_fkey"
      FOREIGN KEY ("buyerId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ItemInterest_itemId_idx" ON "ItemInterest"("itemId");
CREATE INDEX IF NOT EXISTS "ItemInterest_buyerId_idx" ON "ItemInterest"("buyerId");

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('NEW_INTEREST', 'ITEM_STATUS_CHANGED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "itemId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

ALTER TABLE "ItemInterest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
