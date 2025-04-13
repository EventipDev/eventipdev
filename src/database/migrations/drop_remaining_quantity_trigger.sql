-- Drop the remaining trigger that's causing quantity_sold updates
DROP TRIGGER IF EXISTS paid_tickets_update_quantity_sold ON paid_tickets;

-- Also drop its associated function if it exists
DROP FUNCTION IF EXISTS update_quantity_sold(); 