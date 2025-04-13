-- Drop all conflicting triggers that update paid_quantity_sold

-- Drop triggers on tickets table
DROP TRIGGER IF EXISTS check_paid_ticket_availability_trigger ON tickets;
DROP TRIGGER IF EXISTS check_ticket_availability_trigger ON tickets;

-- Drop triggers on paid_tickets table
DROP TRIGGER IF EXISTS update_ticket_tiers_paid_quantity_trigger ON paid_tickets;
DROP TRIGGER IF EXISTS update_paid_quantity_trigger ON paid_tickets;
DROP TRIGGER IF EXISTS handle_paid_ticket_quantities_trigger ON paid_tickets;
DROP TRIGGER IF EXISTS update_paid_tickets_quantity ON paid_tickets;

-- Create a single consolidated trigger for paid tickets
CREATE OR REPLACE FUNCTION handle_paid_ticket_quantity()
RETURNS TRIGGER AS $$
DECLARE
    available_tickets INTEGER;
    ticket_tier_row RECORD;
    quantity_to_add INTEGER;
BEGIN
    -- Get ticket tier information with FOR UPDATE to lock the row
    SELECT * INTO ticket_tier_row
    FROM ticket_tiers
    WHERE id = NEW.ticket_tier_id
    FOR UPDATE;
    
    IF ticket_tier_row IS NULL THEN
        RAISE EXCEPTION 'Invalid ticket_tier_id: %', NEW.ticket_tier_id;
    END IF;
    
    -- Only process if this ticket tier has a price > 0
    IF ticket_tier_row.price > 0 THEN
        -- Get quantity from metadata if it exists, otherwise default to 1
        quantity_to_add := COALESCE(NEW.quantity, 1);
        
        available_tickets := ticket_tier_row.quantity - ticket_tier_row.paid_quantity_sold;
        
        -- Check if enough paid tickets are still available
        IF available_tickets < quantity_to_add THEN
            RAISE EXCEPTION 'Sorry, only % paid tickets remaining in this tier.', available_tickets;
        END IF;
        
        -- Update paid_quantity_sold for paid tickets
        UPDATE ticket_tiers
        SET paid_quantity_sold = paid_quantity_sold + quantity_to_add
        WHERE id = NEW.ticket_tier_id
        AND (paid_quantity_sold + quantity_to_add) <= quantity;
        
        -- Check if the update actually happened
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Failed to update paid ticket quantity. Ticket tier may be sold out.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a single trigger for paid tickets
CREATE TRIGGER handle_paid_ticket_quantity_trigger
    AFTER INSERT ON paid_tickets
    FOR EACH ROW
    EXECUTE FUNCTION handle_paid_ticket_quantity(); 