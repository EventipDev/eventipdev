-- Create refunds table to track refunds for private event tickets
CREATE TABLE public.refunds (
  id uuid not null default extensions.uuid_generate_v4(),
  ticket_id uuid not null,
  event_id uuid not null,
  amount numeric(10, 2) not null default 0,
  payment_reference text not null,
  paystack_refund_reference text null,
  paystack_response jsonb null,
  reason text not null,
  refund_date timestamp with time zone not null default timezone ('utc'::text, now()),
  status character varying(20) not null default 'pending',
  buyer_email text not null,
  buyer_name text not null,
  notes text null,
  admin_user_id uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint refunds_pkey primary key (id),
  constraint refunds_ticket_id_fkey foreign key (ticket_id) references private_event_tickets (id),
  constraint refunds_event_id_fkey foreign key (event_id) references private_events (id)
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_refunds_ticket_id ON public.refunds USING btree (ticket_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_event_id ON public.refunds USING btree (event_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_payment_reference ON public.refunds USING btree (payment_reference) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_paystack_refund_reference ON public.refunds USING btree (paystack_refund_reference) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_refunds_buyer_email ON public.refunds USING btree (buyer_email) TABLESPACE pg_default; 