-- Add 'free_input' to the allowed types in items table
DO $$
BEGIN
    ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
    ALTER TABLE items ADD CONSTRAINT items_type_check 
    CHECK (type IN ('included', 'checkbox', 'dropdown', 'tier_dependent', 'free_input'));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;
