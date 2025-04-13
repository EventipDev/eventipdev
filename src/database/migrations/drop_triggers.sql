-- Drop ONLY the paid ticket trigger and its function
DROP TRIGGER IF EXISTS check_paid_ticket_availability_trigger ON tickets;
DROP FUNCTION IF EXISTS check_paid_ticket_availability();

-- DO NOT drop these as they handle free tickets:
-- DO NOT drop check_ticket_availability_trigger
-- DO NOT drop check_ticket_availability function

-- Our new handle_paid_ticket_quantities_trigger will handle ONLY paid tickets
-- The existing check_ticket_availability_trigger remains for free tickets 