-- Table to store fees paid for free private events
CREATE TABLE IF NOT EXISTS private_event_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID REFERENCES private_events(id),
  reference VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_private_event_fees_user_id ON private_event_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_private_event_fees_event_id ON private_event_fees(event_id);
CREATE INDEX IF NOT EXISTS idx_private_event_fees_reference ON private_event_fees(reference); 