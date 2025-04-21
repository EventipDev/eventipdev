-- Add organizer column to private_events table
ALTER TABLE private_events 
ADD COLUMN organizer VARCHAR(255);

-- Add a comment to explain the purpose of the column
COMMENT ON COLUMN private_events.organizer IS 'Name of the person or organization hosting the event';

-- Update existing records with default value
-- This is optional and can be adjusted based on your needs
UPDATE private_events 
SET organizer = 'Unknown Organizer' 
WHERE organizer IS NULL; 