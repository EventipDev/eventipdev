-- Add quantity column to paid_tickets table
ALTER TABLE paid_tickets 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Update any existing records to have quantity = 1
UPDATE paid_tickets 
SET quantity = 1 
WHERE quantity IS NULL; 