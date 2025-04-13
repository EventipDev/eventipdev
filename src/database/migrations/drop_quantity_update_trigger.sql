-- Drop the trigger that's causing double increment of quantity_sold
DROP TRIGGER IF EXISTS paid_tickets_quantity_update ON paid_tickets;

-- Also drop its associated function if it exists
DROP FUNCTION IF EXISTS update_ticket_quantity(); 