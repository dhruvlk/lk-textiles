-- Migration: Safely update LK Textiles company phone to current number +91 9828121931 if holding the legacy number
UPDATE public.companies
SET phone = '+91 9828121931',
    updated_at = now()
WHERE phone ILIKE '%9825121931%'
   OR phone = '+919825121931'
   OR phone = '9825121931'
   OR phone = '+91 9825121931';
