-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  account_number VARCHAR(255) NOT NULL,
  routing_number VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional fields that might be useful
  holder_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- You might want constraints
  CONSTRAINT unique_default_per_user UNIQUE (user_id, is_default) 
    WHERE (is_default = true)
);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- This function ensures only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one default payment method per user
DROP TRIGGER IF EXISTS ensure_single_default_payment_method_trigger ON payment_methods;
CREATE TRIGGER ensure_single_default_payment_method_trigger
BEFORE INSERT OR UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_payment_method();

-- Add comments to the table and important columns
COMMENT ON TABLE payment_methods IS 'Stores user payment methods for payouts';
COMMENT ON COLUMN payment_methods.user_id IS 'References the user ID in the users table';
COMMENT ON COLUMN payment_methods.bank_name IS 'Name of the bank or financial institution';
COMMENT ON COLUMN payment_methods.account_number IS 'Encrypted account number';
COMMENT ON COLUMN payment_methods.is_default IS 'Flag indicating whether this is the default payment method for the user'; 