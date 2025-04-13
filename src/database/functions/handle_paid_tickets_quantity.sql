-- Function to handle paid ticket quantities
CREATE OR REPLACE FUNCTION handle_paid_tickets_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update both paid_quantity_sold and quantity_sold in ticket_tiers
    -- We use NEW.quantity to increment by the exact number of tickets purchased
    UPDATE ticket_tiers
    SET 
        paid_quantity_sold = paid_quantity_sold + NEW.quantity,
        quantity_sold = quantity_sold + NEW.quantity
    WHERE id = NEW.ticket_tier_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires AFTER INSERT on paid_tickets table
DROP TRIGGER IF EXISTS update_paid_tickets_quantity ON paid_tickets;
CREATE TRIGGER update_paid_tickets_quantity
    AFTER INSERT ON paid_tickets
    FOR EACH ROW
    EXECUTE FUNCTION handle_paid_tickets_quantity(); 