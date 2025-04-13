-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS handle_paid_ticket_quantities_trigger ON paid_tickets;
DROP FUNCTION IF EXISTS handle_paid_ticket_quantities();

-- Create function to handle paid ticket quantities
CREATE OR REPLACE FUNCTION handle_paid_ticket_quantities()
RETURNS TRIGGER AS $$
BEGIN
    -- Update both quantity columns in ticket_tiers
    UPDATE ticket_tiers
    SET 
        paid_quantity_sold = COALESCE(paid_quantity_sold, 0) + NEW.quantity,
        quantity_sold = COALESCE(quantity_sold, 0) + NEW.quantity
    WHERE id = NEW.ticket_tier_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on paid_tickets table
CREATE TRIGGER handle_paid_ticket_quantities_trigger
    AFTER INSERT ON paid_tickets
    FOR EACH ROW
    EXECUTE FUNCTION handle_paid_ticket_quantities(); 