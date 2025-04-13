-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS update_paid_quantity_sold_trigger ON paid_tickets;
DROP FUNCTION IF EXISTS update_paid_quantity_sold();

-- Create function to update paid_quantity_sold in the ticket_tiers table
CREATE OR REPLACE FUNCTION update_paid_quantity_sold()
RETURNS TRIGGER AS $$
BEGIN
    -- Update paid_quantity_sold column in ticket_tiers table
    -- Use COALESCE to handle NULL values in the ticket_tiers.paid_quantity_sold column
    -- If the quantity column exists in the paid_tickets record, use it, otherwise use 1
    UPDATE ticket_tiers
    SET paid_quantity_sold = COALESCE(paid_quantity_sold, 0) + COALESCE(NEW.quantity, 1)
    WHERE id = NEW.ticket_tier_id;
    
    -- Log the update for debugging
    RAISE NOTICE 'Updated paid_quantity_sold for ticket_tier_id: %, added: % ticket(s)', 
        NEW.ticket_tier_id, COALESCE(NEW.quantity, 1);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on paid_tickets table that fires AFTER INSERT
CREATE TRIGGER update_paid_quantity_sold_trigger
    AFTER INSERT ON paid_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_paid_quantity_sold();

COMMENT ON FUNCTION update_paid_quantity_sold() IS 'Updates the paid_quantity_sold column in ticket_tiers table when a new paid ticket is purchased';
COMMENT ON TRIGGER update_paid_quantity_sold_trigger ON paid_tickets IS 'Trigger to update paid_quantity_sold in ticket_tiers when a new paid ticket is inserted'; 