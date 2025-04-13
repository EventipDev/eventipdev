-- Check the paid_tickets table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'paid_tickets';

-- Check a sample paid_ticket record
SELECT id, ticket_tier_id, quantity 
FROM paid_tickets 
ORDER BY id DESC 
LIMIT 1; 