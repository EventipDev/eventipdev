-- Get all triggers and their definitions for the tickets table
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(pg_trigger.oid) AS trigger_definition,
    pg_get_functiondef(pg_trigger.tgfoid) AS function_definition
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE pg_class.relname = 'tickets'
AND NOT tgisinternal; -- Exclude internal triggers 