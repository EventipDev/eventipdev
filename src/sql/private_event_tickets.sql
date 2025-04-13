-- Create the private_event_tickets table to store ticket information for private events
CREATE TABLE IF NOT EXISTS private_event_tickets (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES private_events(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  customer_email VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_reference TEXT,
  ticket_code VARCHAR(20) NOT NULL,
  reference VARCHAR(100) NOT NULL,
  transaction_id VARCHAR(100) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  purchase_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  event_data JSONB NOT NULL, -- Store event details as JSON at purchase time for historical record
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_private_event_tickets_event_id ON private_event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_private_event_tickets_buyer_email ON private_event_tickets(buyer_email);
CREATE INDEX IF NOT EXISTS idx_private_event_tickets_customer_email ON private_event_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_private_event_tickets_ticket_code ON private_event_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_private_event_tickets_reference ON private_event_tickets(reference);

COMMENT ON TABLE private_event_tickets IS 'Stores tickets purchased for private events';
COMMENT ON COLUMN private_event_tickets.id IS 'Unique identifier for the ticket';
COMMENT ON COLUMN private_event_tickets.event_id IS 'Reference to the private event this ticket is for';
COMMENT ON COLUMN private_event_tickets.buyer_name IS 'Name of the person who purchased the ticket';
COMMENT ON COLUMN private_event_tickets.buyer_email IS 'Email of the person who purchased the ticket';
COMMENT ON COLUMN private_event_tickets.customer_email IS 'Email of the customer who will use the ticket';
COMMENT ON COLUMN private_event_tickets.buyer_phone IS 'Phone number of the person who purchased the ticket (optional)';
COMMENT ON COLUMN private_event_tickets.quantity IS 'Number of tickets purchased';
COMMENT ON COLUMN private_event_tickets.price_paid IS 'Price paid per individual ticket at time of purchase';
COMMENT ON COLUMN private_event_tickets.total_price IS 'Total price paid for the tickets';
COMMENT ON COLUMN private_event_tickets.payment_reference IS 'Reference ID from payment processor if applicable';
COMMENT ON COLUMN private_event_tickets.ticket_code IS 'Unique code for ticket verification';
COMMENT ON COLUMN private_event_tickets.reference IS 'Reference number for the ticket purchase';
COMMENT ON COLUMN private_event_tickets.transaction_id IS 'Transaction ID from payment processor (optional)';
COMMENT ON COLUMN private_event_tickets.status IS 'Status of the ticket (active, used, cancelled, etc.)';
COMMENT ON COLUMN private_event_tickets.is_paid IS 'Whether this was a paid ticket or free';
COMMENT ON COLUMN private_event_tickets.purchase_date IS 'Date and time when the ticket was purchased';
COMMENT ON COLUMN private_event_tickets.event_data IS 'Copy of event details at time of purchase for historical record';
COMMENT ON COLUMN private_event_tickets.created_at IS 'Date and time when the record was created'; 