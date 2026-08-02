-- Item.category (enum) → Item.categories (enum[])
-- Idempotent: safe if partially applied already.

ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "categories" "Category"[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Item'
      AND column_name = 'category'
  ) THEN
    UPDATE "Item"
    SET "categories" = ARRAY["category"]::"Category"[]
    WHERE "categories" IS NULL AND "category" IS NOT NULL;
  END IF;
END $$;

UPDATE "Item"
SET "categories" = ARRAY['OUTROS']::"Category"[]
WHERE "categories" IS NULL OR cardinality("categories") = 0;

ALTER TABLE "Item" ALTER COLUMN "categories" SET NOT NULL;

ALTER TABLE "Item" DROP COLUMN IF EXISTS "category";

DROP INDEX IF EXISTS "Item_category_idx";
