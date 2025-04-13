-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  payment_method_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  note TEXT,
  payment_method_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Foreign key constraint
  CONSTRAINT fk_payment_method FOREIGN KEY (payment_method_id)
    REFERENCES payment_methods(id) ON DELETE CASCADE,
    
  -- Ensure amount is positive
  CONSTRAINT check_positive_amount CHECK (amount > 0)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

-- Add a comment to the table
COMMENT ON TABLE payment_requests IS 'Stores user payment requests for processing'; 