-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS update_ticket_tiers_paid_quantity_trigger ON paid_tickets;
DROP FUNCTION IF EXISTS update_ticket_tiers_paid_quantity();

-- Create function to update paid_quantity_sold in ticket_tiers
CREATE OR REPLACE FUNCTION update_ticket_tiers_paid_quantity()
RETURNS TRIGGER AS $$
DECLARE
    current_value INTEGER;
BEGIN
    -- Log the incoming data
    RAISE NOTICE 'Trigger fired for paid ticket insert. ticket_tier_id: %', NEW.ticket_tier_id;
    
    -- Get current value
    SELECT paid_quantity_sold INTO current_value
    FROM ticket_tiers
    WHERE id = NEW.ticket_tier_id;
    
    RAISE NOTICE 'Current paid_quantity_sold: %', current_value;

    -- Update paid_quantity_sold in ticket_tiers
    UPDATE ticket_tiers
    SET paid_quantity_sold = COALESCE(paid_quantity_sold, 0) + 1
    WHERE id = NEW.ticket_tier_id;
    
    -- Verify the update
    SELECT paid_quantity_sold INTO current_value
    FROM ticket_tiers
    WHERE id = NEW.ticket_tier_id;
    
    RAISE NOTICE 'New paid_quantity_sold value: %', current_value;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on paid_tickets table
CREATE TRIGGER update_ticket_tiers_paid_quantity_trigger
    AFTER INSERT ON paid_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_tiers_paid_quantity(); 