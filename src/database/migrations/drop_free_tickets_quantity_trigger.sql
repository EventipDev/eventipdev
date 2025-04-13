-- Drop the duplicate quantity update trigger from free_tickets table
DROP TRIGGER IF EXISTS free_tickets_update_quantity_sold ON free_tickets;

-- Also drop its associated function if it exists
DROP FUNCTION IF EXISTS update_free_ticket_quantity_sold(); 