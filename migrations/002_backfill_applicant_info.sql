-- Migration: Backfill applicant info for existing estimates
-- Created at: 2026-01-12

-- Updates the customer_info JSONB column for existing records.
-- 1. Copies 'chiefMournerAddress' to 'applicantAddress' if 'applicantAddress' is missing.
--    (This preserves the previous behavior where the single address field likely contained the applicant's address)
-- 2. Initializes 'applicantPostalCode' to an empty string if missing.

UPDATE estimates
SET customer_info = customer_info || jsonb_build_object(
    'applicantAddress', 
    COALESCE(customer_info->>'applicantAddress', customer_info->>'chiefMournerAddress', ''),
    'applicantPostalCode', 
    COALESCE(customer_info->>'applicantPostalCode', '')
)
WHERE customer_info->>'applicantAddress' IS NULL 
   OR customer_info->>'applicantPostalCode' IS NULL;
