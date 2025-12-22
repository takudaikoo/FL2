-- Add details column to items table for multiple modal content blocks
ALTER TABLE "items" 
ADD COLUMN IF NOT EXISTS "details" JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN "items"."details" IS 'Array of content blocks: { title, description, imagePath }';
