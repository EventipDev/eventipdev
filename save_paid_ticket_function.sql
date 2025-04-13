-- Function to save paid tickets to both tables in a transaction
CREATE OR REPLACE FUNCTION save_paid_ticket(
  p_paid_ticket jsonb,
  p_ticket jsonb
) RETURNS jsonb AS $$
DECLARE
  v_paid_ticket_id uuid;
BEGIN
  -- Start a transaction
  BEGIN
    -- Insert into paid_tickets table only
    INSERT INTO paid_tickets (
      user_id,
      event_id,
      ticket_tier_id,
      reference,
      transaction_id,
      customer_email,
      customer_name,
      customer_phone,
      event_title,
      event_date,
      event_time,
      event_location,
      ticket_type,
      price_paid,
      status,
      purchase_date
    )
    SELECT
      (p_paid_ticket->>'user_id')::uuid,
      (p_paid_ticket->>'event_id')::uuid,
      (p_paid_ticket->>'ticket_tier_id')::uuid,
      p_paid_ticket->>'reference',
      p_paid_ticket->>'transaction_id',
      p_paid_ticket->>'customer_email',
      p_paid_ticket->>'customer_name',
      p_paid_ticket->>'customer_phone',
      p_paid_ticket->>'event_title',
      (p_paid_ticket->>'event_date')::timestamp,
      p_paid_ticket->>'event_time',
      p_paid_ticket->>'event_location',
      p_paid_ticket->>'ticket_type',
      (p_paid_ticket->>'price_paid')::decimal,
      p_paid_ticket->>'status',
      (p_paid_ticket->>'purchase_date')::timestamp
    RETURNING id INTO v_paid_ticket_id;

    -- Return only the paid ticket ID
    RETURN jsonb_build_object(
      'paid_ticket_id', v_paid_ticket_id,
      'ticket_id', null
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE EXCEPTION 'Error saving tickets: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql; 