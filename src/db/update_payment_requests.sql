-- Update payment_requests table to ensure status column can handle all required states
-- Check if status column exists and has correct definition
DO $$
BEGIN
    -- First ensure the table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_requests') THEN
        -- Ensure status column has valid values
        -- First check if we need to update the column type
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payment_requests' 
            AND column_name = 'status' 
            AND data_type = 'character varying'
        ) THEN
            -- Add the status column if it doesn't exist
            ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
        ELSE
            -- Status column exists, ensure it has the correct default
            ALTER TABLE payment_requests ALTER COLUMN status SET DEFAULT 'pending';
        END IF;
        
        -- Add a check constraint to ensure only valid status values
        -- First drop the constraint if it exists to avoid errors
        ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS check_valid_status;
        
        -- Add the constraint to ensure only valid status values
        ALTER TABLE payment_requests ADD CONSTRAINT check_valid_status 
        CHECK (status IN ('pending', 'approved', 'rejected', 'paid'));
        
        RAISE NOTICE 'Payment requests table successfully updated with valid status options';
    ELSE
        RAISE NOTICE 'payment_requests table does not exist. Please create it first';
    END IF;
END $$;

-- Create a function to update payment request status with timestamp tracking
CREATE OR REPLACE FUNCTION update_payment_request_status(
    p_request_id UUID,
    p_new_status VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN;
BEGIN
    -- Validate the new status is one of the allowed values
    IF p_new_status NOT IN ('pending', 'approved', 'rejected', 'paid') THEN
        RAISE EXCEPTION 'Invalid status value. Must be one of: pending, approved, rejected, paid';
    END IF;
    
    -- Update the payment request status
    UPDATE payment_requests
    SET 
        status = p_new_status,
        updated_at = NOW(),
        -- If status is changing to approved, rejected, or paid, set processed_at
        processed_at = CASE 
            WHEN p_new_status IN ('approved', 'rejected', 'paid') THEN NOW()
            ELSE processed_at
        END
    WHERE id = p_request_id;
    
    -- Check if update was successful
    GET DIAGNOSTICS v_success = ROW_COUNT;
    
    RETURN v_success > 0;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the function
COMMENT ON FUNCTION update_payment_request_status IS 'Updates a payment request status with appropriate timestamp tracking';

-- Example usage:
-- SELECT update_payment_request_status('payment-request-uuid-here', 'approved');
-- SELECT update_payment_request_status('payment-request-uuid-here', 'rejected');
-- SELECT update_payment_request_status('payment-request-uuid-here', 'paid'); 