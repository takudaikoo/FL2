-- Add use_dropdown column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS use_dropdown BOOLEAN DEFAULT false;

-- Update the type check constraint to ensure data integrity is maintained
-- (The existing check constraint might not need changing if it only checks the string values of 'type', 
-- which we are not changing. 'included' items just get an extra property.)
