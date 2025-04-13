-- First, drop the specific trigger by name if it exists
DROP TRIGGER IF EXISTS update_ticket_quantities_trigger_for_tickets ON tickets;

-- First, identify and drop any existing triggers on tickets that update ticket_tiers
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'tickets'::regclass
        AND tgname LIKE '%quantity%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON tickets';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END
$$;

-- Create a new function to handle quantity-aware updates
CREATE OR REPLACE FUNCTION update_ticket_quantities_from_tickets()
RETURNS TRIGGER AS $$
BEGIN
    -- Always increment by 1 since tickets table doesn't have a quantity column
    
    -- Only proceed if we have a ticket_tier_id
    IF NEW.ticket_tier_id IS NOT NULL THEN
        -- Update the ticket_tier's quantity_sold
        UPDATE ticket_tiers
        SET quantity_sold = COALESCE(quantity_sold, 0) + 1
        WHERE id = NEW.ticket_tier_id;
        
        RAISE NOTICE 'Updated ticket_tier % quantity_sold by adding 1', NEW.ticket_tier_id;
    ELSE
        -- If no ticket_tier_id, update the event's ticket_quantity
        UPDATE events
        SET tickets_sold = COALESCE(tickets_sold, 0) + 1
        WHERE id = NEW.event_id;
        
        RAISE NOTICE 'Updated event % tickets_sold by adding 1', NEW.event_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a new trigger for the tickets table
CREATE TRIGGER update_ticket_quantities_trigger_for_tickets
AFTER INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_quantities_from_tickets();

-- Notify the user that triggers have been updated
SELECT 'Ticket quantity triggers updated successfully for tickets table. Always incrementing by 1.' AS result; 