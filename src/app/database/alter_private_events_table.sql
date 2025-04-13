-- Add quantity_sold column to private_events table
ALTER TABLE private_events 
ADD COLUMN IF NOT EXISTS quantity_sold INTEGER DEFAULT 0;

-- Add comment to explain the column purpose
COMMENT ON COLUMN private_events.quantity_sold IS 'Tracks the number of tickets sold for this event'; 