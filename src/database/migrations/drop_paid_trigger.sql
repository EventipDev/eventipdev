-- Drop only the paid ticket trigger and its function
DROP TRIGGER IF EXISTS check_paid_ticket_availability_trigger ON tickets;
DROP FUNCTION IF EXISTS check_paid_ticket_availability();

-- Keep the regular ticket availability trigger for free tickets
-- DO NOT drop check_ticket_availability_trigger or check_ticket_availability function 