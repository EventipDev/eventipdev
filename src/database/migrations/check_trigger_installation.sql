-- Check if our trigger exists and show its definition
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition,
    tgenabled AS is_enabled
FROM pg_trigger 
WHERE tgname = 'update_ticket_tiers_paid_quantity_trigger';

-- Also check a recent paid ticket insert to see if it has the right data
SELECT pt.*, tt.paid_quantity_sold
FROM paid_tickets pt
JOIN ticket_tiers tt ON tt.id = pt.ticket_tier_id
ORDER BY pt.created_at DESC
LIMIT 1; 