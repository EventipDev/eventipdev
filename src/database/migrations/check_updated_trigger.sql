-- Check what the paid_tickets_updated trigger does
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'paid_tickets_updated';

-- Also check its associated function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_paid_tickets_timestamp'; 