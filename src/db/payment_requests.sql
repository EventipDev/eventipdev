-- Payment Requests table for payment requests from users

-- Create payment_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  payment_method TEXT,
  account_number TEXT,
  account_name TEXT,
  bank_name TEXT,
  transaction_ref TEXT,
  notes TEXT,
  processed_by UUID REFERENCES admins(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS payment_requests_user_id_idx ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS payment_requests_status_idx ON payment_requests(status);
CREATE INDEX IF NOT EXISTS payment_requests_created_at_idx ON payment_requests(created_at);

-- Grant permissions
GRANT ALL ON payment_requests TO authenticated, anon;

-- Add some test data if users table has data
DO $$
DECLARE
  v_user_id UUID;
  v_user_ids UUID[];
  i INTEGER;
BEGIN
  -- Get up to 5 user IDs from the users table
  SELECT ARRAY(SELECT id FROM users LIMIT 5) INTO v_user_ids;
  
  -- If we have users, create test payment requests
  IF array_length(v_user_ids, 1) > 0 THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      -- Create a pending request
      INSERT INTO payment_requests (
        user_id, 
        amount, 
        status,
        payment_method,
        account_number,
        account_name,
        bank_name,
        notes
      ) VALUES (
        v_user_id,
        (random() * 100000)::INTEGER + 10000, -- Random amount between 10,000 and 110,000
        'pending',
        'bank_transfer',
        '0' || (1000000000 + (random() * 9000000000)::INTEGER)::TEXT, -- Random 10-digit account number
        'User ' || substr(v_user_id::TEXT, 1, 8), -- Placeholder account name
        (ARRAY['Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank'])[1 + (random() * 4)::INTEGER],
        'Payment request for event ticket sales'
      );
      
      -- Create a completed request with a different status
      INSERT INTO payment_requests (
        user_id, 
        amount, 
        status,
        payment_method,
        account_number,
        account_name,
        bank_name,
        notes,
        processed_at
      ) VALUES (
        v_user_id,
        (random() * 50000)::INTEGER + 5000, -- Random amount between 5,000 and 55,000
        (ARRAY['approved', 'rejected', 'paid'])[1 + (random() * 2)::INTEGER], -- Random status
        'bank_transfer',
        '0' || (1000000000 + (random() * 9000000000)::INTEGER)::TEXT, -- Random 10-digit account number
        'User ' || substr(v_user_id::TEXT, 1, 8), -- Placeholder account name
        (ARRAY['Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank'])[1 + (random() * 4)::INTEGER],
        'Previous payment request',
        NOW() - (random() * INTERVAL '10 days') -- Random date in the past 10 days
      );
    END LOOP;
  END IF;
END $$; 