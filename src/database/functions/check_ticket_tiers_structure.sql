-- Check the ticket_tiers table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ticket_tiers';

-- Check if our trigger is listed
SELECT tgname, pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'update_paid_tickets_quantity';

-- Check a sample ticket_tier record
SELECT id, quantity_sold, paid_quantity_sold 
FROM ticket_tiers 
LIMIT 1; 