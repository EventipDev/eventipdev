-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS update_paid_quantity_trigger ON paid_tickets;
DROP FUNCTION IF EXISTS update_paid_quantity();

-- Create function to update only paid_quantity_sold
CREATE OR REPLACE FUNCTION update_paid_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update only paid_quantity_sold in ticket_tiers based on number of tickets
    UPDATE ticket_tiers
    SET paid_quantity_sold = COALESCE(paid_quantity_sold, 0) + NEW.quantity
    WHERE id = NEW.ticket_tier_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on paid_tickets table
CREATE TRIGGER update_paid_quantity_trigger
    AFTER INSERT ON paid_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_paid_quantity(); 