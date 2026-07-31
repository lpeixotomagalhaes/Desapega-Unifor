-- Migrate Item.category (enum) → Item.categories (enum[])
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "categories" "Category"[];

UPDATE "Item"
SET "categories" = ARRAY["category"]::"Category"[]
WHERE "categories" IS NULL AND "category" IS NOT NULL;

-- Fallback for any orphan rows
UPDATE "Item"
SET "categories" = ARRAY['OUTROS']::"Category"[]
WHERE "categories" IS NULL OR cardinality("categories") = 0;

ALTER TABLE "Item" ALTER COLUMN "categories" SET NOT NULL;

ALTER TABLE "Item" DROP COLUMN IF EXISTS "category";

DROP INDEX IF EXISTS "Item_category_idx";
