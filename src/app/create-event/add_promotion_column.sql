-- Add promotion column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_promotion_enabled BOOLEAN DEFAULT false; 