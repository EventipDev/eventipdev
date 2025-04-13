-- Query to view all triggers in the database
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    n.nspname AS schema_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        WHEN 'R' THEN 'Replica'
        WHEN 'A' THEN 'Always'
        ELSE t.tgenabled::text
    END AS trigger_status,
    CASE t.tgtype & 1
        WHEN 1 THEN 'BEFORE'
        ELSE 'AFTER'
    END AS trigger_timing,
    CASE t.tgtype & 2
        WHEN 2 THEN 'ROW'
        ELSE 'STATEMENT'
    END AS trigger_level,
    CASE t.tgtype & 4
        WHEN 4 THEN 'INSERT'
        ELSE ''
    END ||
    CASE t.tgtype & 8
        WHEN 8 THEN ' DELETE'
        ELSE ''
    END ||
    CASE t.tgtype & 16
        WHEN 16 THEN ' UPDATE'
        ELSE ''
    END AS trigger_events,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM 
    pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE 
    NOT t.tgisinternal
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY 
    n.nspname,
    c.relname,
    t.tgname; 