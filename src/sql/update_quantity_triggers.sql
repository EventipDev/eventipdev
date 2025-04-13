-- First, identify and drop any existing triggers on paid_tickets that update ticket_tiers
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'paid_tickets'::regclass
        AND tgname LIKE '%quantity%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON paid_tickets';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END
$$;

-- Create a new function to handle quantity-aware updates
CREATE OR REPLACE FUNCTION update_ticket_quantities()
RETURNS TRIGGER AS $$
DECLARE
    qty INTEGER;
BEGIN
    -- Get the quantity from the new record, default to 1 if not set
    qty := COALESCE(NEW.quantity, 1);
    
    -- Only proceed if we have a ticket_tier_id
    IF NEW.ticket_tier_id IS NOT NULL THEN
        -- Update the ticket_tier's paid_quantity_sold
        UPDATE ticket_tiers
        SET paid_quantity_sold = COALESCE(paid_quantity_sold, 0) + qty
        WHERE id = NEW.ticket_tier_id;
        
        RAISE NOTICE 'Updated ticket_tier % paid_quantity_sold by adding %', NEW.ticket_tier_id, qty;
    ELSE
        -- If no ticket_tier_id, update the event's ticket_quantity
        UPDATE events
        SET ticket_quantity = GREATEST(0, COALESCE(ticket_quantity, 0) - qty)
        WHERE id = NEW.event_id;
        
        RAISE NOTICE 'Updated event % ticket_quantity by subtracting %', NEW.event_id, qty;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a new trigger
CREATE TRIGGER update_ticket_quantities_trigger
AFTER INSERT ON paid_tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_quantities();

-- Notify the user that triggers have been updated
SELECT 'Ticket quantity triggers updated successfully. Now handling multiple ticket quantities correctly.' AS result; 