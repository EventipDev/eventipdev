-- Add metadata column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add an index on the metadata column for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_metadata ON tickets USING gin (metadata); 