-- Create free_tickets table to store all ticket information
CREATE TABLE free_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  reference VARCHAR(100) NOT NULL UNIQUE,
  
  -- Customer information
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  
  -- Event details (denormalized for ticket display)
  event_title VARCHAR(255) NOT NULL,
  event_date TIMESTAMP NOT NULL,
  event_time VARCHAR(100),
  event_location VARCHAR(255),
  
  -- Ticket details
  ticket_type VARCHAR(100) NOT NULL,
  price_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_used BOOLEAN DEFAULT false,
  
  -- Timestamps
  purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for improved query performance
CREATE INDEX idx_free_tickets_user_id ON free_tickets(user_id);
CREATE INDEX idx_free_tickets_event_id ON free_tickets(event_id);
CREATE INDEX idx_free_tickets_reference ON free_tickets(reference);
CREATE INDEX idx_free_tickets_customer_email ON free_tickets(customer_email);
CREATE INDEX idx_free_tickets_purchase_date ON free_tickets(purchase_date);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_free_tickets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER free_tickets_updated
BEFORE UPDATE ON free_tickets
FOR EACH ROW
EXECUTE FUNCTION update_free_tickets_timestamp();

-- Create API function to fetch tickets for a specific user
CREATE OR REPLACE FUNCTION get_user_free_tickets(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  reference VARCHAR(100),
  event_title VARCHAR(255),
  event_date TIMESTAMP,
  event_time VARCHAR(100),
  event_location VARCHAR(255),
  ticket_type VARCHAR(100),
  status VARCHAR(20),
  is_used BOOLEAN,
  purchase_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.id,
    ft.reference,
    ft.event_title,
    ft.event_date,
    ft.event_time,
    ft.event_location,
    ft.ticket_type,
    ft.status,
    ft.is_used,
    ft.purchase_date
  FROM 
    free_tickets ft
  WHERE 
    ft.user_id = p_user_id
  ORDER BY 
    ft.purchase_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create API function to fetch tickets by email (for users without accounts)
CREATE OR REPLACE FUNCTION get_email_free_tickets(p_email VARCHAR)
RETURNS TABLE (
  id UUID,
  reference VARCHAR(100),
  event_title VARCHAR(255),
  event_date TIMESTAMP,
  event_time VARCHAR(100),
  event_location VARCHAR(255),
  ticket_type VARCHAR(100),
  status VARCHAR(20),
  is_used BOOLEAN,
  purchase_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.id,
    ft.reference,
    ft.event_title,
    ft.event_date,
    ft.event_time,
    ft.event_location,
    ft.ticket_type,
    ft.status,
    ft.is_used,
    ft.purchase_date
  FROM 
    free_tickets ft
  WHERE 
    ft.customer_email = p_email
  ORDER BY 
    ft.purchase_date DESC;
END;
$$ LANGUAGE plpgsql; 