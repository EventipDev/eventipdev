-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  account_name VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint to users table
  CONSTRAINT fk_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);

-- Function to set a single payment method as default for a user
CREATE OR REPLACE FUNCTION set_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new payment method is being set as default
  IF NEW.is_default = true THEN
    -- Set all other payment methods for this user to not default
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one default payment method per user
DROP TRIGGER IF EXISTS trig_set_default_payment_method ON payment_methods;
CREATE TRIGGER trig_set_default_payment_method
BEFORE INSERT OR UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION set_default_payment_method();

-- Add a comment to the table
COMMENT ON TABLE payment_methods IS 'Stores user payment methods for withdrawals and deposits'; 