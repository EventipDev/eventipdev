-- Add early bird and multiple buys columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS has_early_bird BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS early_bird_start_date DATE,
ADD COLUMN IF NOT EXISTS early_bird_end_date DATE,
ADD COLUMN IF NOT EXISTS early_bird_discount INTEGER,
ADD COLUMN IF NOT EXISTS has_multiple_buys BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS multiple_buys_min_tickets INTEGER,
ADD COLUMN IF NOT EXISTS multiple_buys_discount INTEGER; 

-- Alter ticket_tiers table to add discount fields
ALTER TABLE public.ticket_tiers
ADD COLUMN IF NOT EXISTS has_early_bird BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS early_bird_start_date DATE,
ADD COLUMN IF NOT EXISTS early_bird_end_date DATE,
ADD COLUMN IF NOT EXISTS early_bird_discount INTEGER,
ADD COLUMN IF NOT EXISTS has_multiple_buys BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS multiple_buys_min_tickets INTEGER,
ADD COLUMN IF NOT EXISTS multiple_buys_discount INTEGER; 
 
 
 
 
 