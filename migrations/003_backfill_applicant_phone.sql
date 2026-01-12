-- Migration: Backfill applicant phone for existing estimates
-- Created at: 2026-01-12

-- Updates the customer_info JSONB column for existing records.
-- Copies 'chiefMournerMobile' or 'chiefMournerPhone' to 'applicantPhone' if 'applicantPhone' is missing.
-- Prioritizes Mobile over Phone as the primary contact for the applicant.

UPDATE estimates
SET customer_info = customer_info || jsonb_build_object(
    'applicantPhone', 
    COALESCE(customer_info->>'applicantPhone', customer_info->>'chiefMournerMobile', customer_info->>'chiefMournerPhone', '')
)
WHERE customer_info->>'applicantPhone' IS NULL;
