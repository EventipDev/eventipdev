-- Add an index on the ticket_tier_id column in the paid_tickets table
-- This will improve the performance of the trigger that updates paid_quantity_sold

-- Create the index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_paid_tickets_ticket_tier_id
ON paid_tickets (ticket_tier_id);

-- Add a comment for documentation
COMMENT ON INDEX idx_paid_tickets_ticket_tier_id IS 'Index to improve performance of paid_quantity_sold update trigger'; 