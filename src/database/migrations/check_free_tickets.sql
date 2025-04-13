-- Get ALL triggers for the free_tickets table
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(pg_trigger.oid) AS trigger_definition
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE pg_class.relname = 'free_tickets'
ORDER BY tgname; 