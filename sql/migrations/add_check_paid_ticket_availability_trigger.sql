-- Drop existing triggers that might conflict with our new trigger
DROP TRIGGER IF EXISTS update_paid_quantity_sold_trigger ON paid_tickets;
DROP TRIGGER IF EXISTS handle_paid_ticket_quantities_trigger ON paid_tickets;
DROP TRIGGER IF EXISTS update_paid_tickets_quantity ON paid_tickets;
DROP TRIGGER IF EXISTS handle_paid_ticket_quantity_trigger ON paid_tickets;
DROP TRIGGER IF EXISTS check_paid_ticket_availability_trigger ON tickets;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_paid_quantity_sold();
DROP FUNCTION IF EXISTS handle_paid_ticket_quantities();
DROP FUNCTION IF EXISTS handle_paid_tickets_quantity();
DROP FUNCTION IF EXISTS handle_paid_ticket_quantity();
DROP FUNCTION IF EXISTS check_paid_ticket_availability();

-- Create new function to check paid ticket availability and update paid_quantity_sold
CREATE OR REPLACE FUNCTION check_paid_ticket_availability()
RETURNS TRIGGER AS $$
DECLARE
    ticket_price DECIMAL(10,2);
    available_tickets INTEGER;
    ticket_tier_row RECORD;
BEGIN
    -- Get ticket tier information with FOR UPDATE to lock the row
    SELECT * INTO ticket_tier_row
    FROM ticket_tiers
    WHERE id = NEW.ticket_tier_id
    FOR UPDATE;
    
    IF ticket_tier_row IS NULL THEN
        RAISE EXCEPTION 'Invalid ticket_tier_id: %', NEW.ticket_tier_id;
    END IF;
    
    ticket_price := ticket_tier_row.price;
    
    -- Only process if this is a paid ticket (price > 0)
    IF ticket_price > 0 THEN
        available_tickets := ticket_tier_row.quantity - ticket_tier_row.paid_quantity_sold;
        
        -- Check if paid tickets are still available
        IF available_tickets <= 0 THEN
            RAISE EXCEPTION 'Sorry, this paid ticket tier is sold out. No tickets remaining.';
        END IF;
        
        -- Update paid_quantity_sold for paid tickets
        UPDATE ticket_tiers
        SET paid_quantity_sold = paid_quantity_sold + 1
        WHERE id = NEW.ticket_tier_id
        AND paid_quantity_sold < quantity;
        
        -- Check if the update actually happened
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Failed to update paid ticket quantity. Ticket may have been sold out.';
        END IF;
        
        RAISE NOTICE 'Updated paid_quantity_sold for tier_id: % (price: %)', NEW.ticket_tier_id, ticket_price;
    END IF;
    
    -- Set price paid on the ticket
    NEW.price_paid := ticket_price;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for paid ticket availability check on tickets table
CREATE TRIGGER check_paid_ticket_availability_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION check_paid_ticket_availability();

-- Create the same trigger for paid_tickets table to ensure consistent behavior
CREATE TRIGGER check_paid_ticket_availability_paid_trigger
    BEFORE INSERT ON paid_tickets
    FOR EACH ROW
    EXECUTE FUNCTION check_paid_ticket_availability();

-- Add comments for documentation
COMMENT ON FUNCTION check_paid_ticket_availability() IS 'Checks if paid tickets are available and increments paid_quantity_sold by 1 for each ticket purchased';
COMMENT ON TRIGGER check_paid_ticket_availability_trigger ON tickets IS 'Trigger that runs before ticket insertion to increment paid_quantity_sold';
COMMENT ON TRIGGER check_paid_ticket_availability_paid_trigger ON paid_tickets IS 'Trigger that runs before paid ticket insertion to increment paid_quantity_sold'; 