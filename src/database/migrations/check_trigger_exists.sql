-- Check if our trigger exists
SELECT tgname, pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'update_ticket_tiers_paid_quantity_trigger';

-- Check the most recent paid_tickets insert
SELECT id, ticket_tier_id, created_at 
FROM paid_tickets 
ORDER BY created_at DESC 
LIMIT 1;

-- Add some logging to the trigger function
CREATE OR REPLACE FUNCTION update_ticket_tiers_paid_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the values we're working with
    RAISE NOTICE 'Trigger fired for ticket_tier_id: %, current paid_quantity_sold: %', 
        NEW.ticket_tier_id,
        (SELECT paid_quantity_sold FROM ticket_tiers WHERE id = NEW.ticket_tier_id);

    -- Update only paid_quantity_sold in ticket_tiers when a paid ticket is inserted
    UPDATE ticket_tiers
    SET paid_quantity_sold = COALESCE(paid_quantity_sold, 0) + 1
    WHERE id = NEW.ticket_tier_id;
    
    -- Log the new value
    RAISE NOTICE 'Updated paid_quantity_sold for tier_id: % to: %',
        NEW.ticket_tier_id,
        (SELECT paid_quantity_sold FROM ticket_tiers WHERE id = NEW.ticket_tier_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 