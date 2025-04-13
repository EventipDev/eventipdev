-- Drop the old triggers that are causing double increments
DROP TRIGGER IF EXISTS check_ticket_availability_trigger ON tickets;
DROP TRIGGER IF EXISTS check_paid_ticket_availability_trigger ON tickets;

-- Drop the old functions as well
DROP FUNCTION IF EXISTS check_ticket_availability();
DROP FUNCTION IF EXISTS check_paid_ticket_availability(); 