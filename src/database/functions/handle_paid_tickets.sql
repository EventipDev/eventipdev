-- Function to handle paid ticket quantities (only updates paid_quantity_sold)
CREATE OR REPLACE FUNCTION handle_paid_ticket_quantities()
RETURNS TRIGGER AS $$
DECLARE
    ticket_price DECIMAL(10,2);
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
    
    ticket_price := ticket_tier_row.price;
    
    -- Only process if this is a paid ticket (price > 0)
    IF ticket_price > 0 THEN
        -- Get the quantity from the metadata if it exists, default to 1
        quantity_to_add := COALESCE(
            (NEW.metadata->>'quantity')::INTEGER,
            1
        );
        
        available_tickets := ticket_tier_row.quantity - ticket_tier_row.paid_quantity_sold;
        
        -- Check if enough paid tickets are still available
        IF available_tickets < quantity_to_add THEN
            RAISE EXCEPTION 'Sorry, only % paid tickets remaining in this tier.', available_tickets;
        END IF;
        
        -- Update ONLY paid_quantity_sold for paid tickets based on quantity
        UPDATE ticket_tiers
        SET paid_quantity_sold = paid_quantity_sold + quantity_to_add
        WHERE id = NEW.ticket_tier_id
        AND (paid_quantity_sold + quantity_to_add) <= quantity;
        
        -- Check if the update actually happened
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Failed to update paid ticket quantity. Ticket tier may be sold out.';
        END IF;
        
        -- Set price paid on the ticket
        NEW.price_paid := ticket_price;
        
        RAISE NOTICE 'Updated paid_quantity_sold for tier_id: % (price: %), added: % tickets', 
            NEW.ticket_tier_id, ticket_price, quantity_to_add;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for paid ticket quantity handling
DROP TRIGGER IF EXISTS handle_paid_ticket_quantities_trigger ON paid_tickets;

CREATE TRIGGER handle_paid_ticket_quantities_trigger
    BEFORE INSERT ON paid_tickets
    FOR EACH ROW
    EXECUTE FUNCTION handle_paid_ticket_quantities(); 