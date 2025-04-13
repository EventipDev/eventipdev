-- Set default values for event_link and online_event_link if they are NULL
UPDATE public.events 
SET event_link = '' 
WHERE event_link IS NULL;

UPDATE public.events 
SET online_event_link = '' 
WHERE online_event_link IS NULL;

-- Alter the table to make sure these columns are never NULL
ALTER TABLE public.events 
ALTER COLUMN event_link SET DEFAULT '',
ALTER COLUMN event_link SET NOT NULL;

ALTER TABLE public.events 
ALTER COLUMN online_event_link SET DEFAULT '',
ALTER COLUMN online_event_link SET NOT NULL;

-- Add missing ticket_price and ticket_quantity columns
ALTER TABLE public.events
ADD COLUMN ticket_price numeric(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN ticket_quantity integer NOT NULL DEFAULT 0;

-- Fix the constraints on online_event_link and event_link columns

-- First handle any NULL values that might already exist
UPDATE events 
SET online_event_link = '' 
WHERE online_event_link IS NULL;

UPDATE events 
SET event_link = '' 
WHERE event_link IS NULL;

-- Then alter the columns to properly enforce NOT NULL with default
ALTER TABLE events 
ALTER COLUMN online_event_link SET DEFAULT '',
ALTER COLUMN event_link SET DEFAULT '';

-- Create a trigger to ensure these fields are never NULL
CREATE OR REPLACE FUNCTION ensure_event_links_not_null()
RETURNS TRIGGER AS $$
BEGIN
  NEW.online_event_link := COALESCE(NEW.online_event_link, '');
  NEW.event_link := COALESCE(NEW.event_link, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_event_links_trigger
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION ensure_event_links_not_null(); 