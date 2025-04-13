-- Drop only the general ticket availability trigger, leaving free ticket triggers untouched
DROP TRIGGER IF EXISTS check_ticket_availability_trigger ON tickets;

-- Also drop its associated function if it exists
DROP FUNCTION IF EXISTS check_ticket_availability(); 