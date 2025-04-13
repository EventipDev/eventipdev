-- Function to save a verified ticket and update counters correctly
CREATE OR REPLACE FUNCTION save_verified_ticket(
  p_event_id UUID,
  p_ticket_tier_id UUID,
  p_user_id UUID,
  p_price_paid DECIMAL,
  p_ticket_code VARCHAR,
  p_transaction_id VARCHAR,
  p_customer_email VARCHAR,
  p_ticket_type VARCHAR,
  p_reference VARCHAR,
  p_status VARCHAR
) RETURNS JSONB AS $$
DECLARE
  v_ticket_id UUID;
  v_ticket_tier RECORD;
BEGIN
  -- Start transaction
  BEGIN
    -- Lock the ticket tier row for update
    SELECT * INTO v_ticket_tier
    FROM ticket_tiers
    WHERE id = p_ticket_tier_id
    FOR UPDATE;

    IF v_ticket_tier IS NULL THEN
      RAISE EXCEPTION 'Invalid ticket_tier_id: %', p_ticket_tier_id;
    END IF;

    -- Check if there's still capacity
    IF v_ticket_tier.quantity_sold >= v_ticket_tier.quantity THEN
      RAISE EXCEPTION 'Sorry, this ticket tier is sold out. No tickets remaining.';
    END IF;

    -- Insert the ticket
    INSERT INTO tickets (
      event_id,
      ticket_tier_id,
      user_id,
      price_paid,
      ticket_code,
      transaction_id,
      customer_email,
      ticket_type,
      reference,
      status,
      purchase_date,
      created_at
    ) VALUES (
      p_event_id,
      p_ticket_tier_id,
      p_user_id,
      p_price_paid,
      p_ticket_code,
      p_transaction_id,
      p_customer_email,
      p_ticket_type,
      p_reference,
      p_status,
      NOW(),
      NOW()
    ) RETURNING id INTO v_ticket_id;

    -- Update the counters in a single update
    -- Only increment paid_quantity_sold if price > 0
    IF p_price_paid > 0 THEN
      UPDATE ticket_tiers
      SET 
        quantity_sold = quantity_sold + 1,
        paid_quantity_sold = paid_quantity_sold + 1
      WHERE id = p_ticket_tier_id;
    ELSE
      UPDATE ticket_tiers
      SET quantity_sold = quantity_sold + 1
      WHERE id = p_ticket_tier_id;
    END IF;

    -- Return the ticket data
    RETURN jsonb_build_object(
      'success', true,
      'ticket_id', v_ticket_id,
      'reference', p_reference
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE EXCEPTION 'Error saving ticket: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql; 