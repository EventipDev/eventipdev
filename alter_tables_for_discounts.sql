-- Add columns to the paid_tickets table to track discount information
ALTER TABLE public.paid_tickets
ADD COLUMN IF NOT EXISTS applied_early_bird_discount boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS early_bird_discount_amount numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS applied_multiple_buys_discount boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS multiple_buys_discount_amount numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price numeric(10, 2),
ADD COLUMN IF NOT EXISTS discounted_price numeric(10, 2);

-- Add columns to track total sold tickets with discounts in events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS early_bird_tickets_sold integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS multiple_buys_tickets_sold integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_discount_amount numeric(12, 2) DEFAULT 0;

-- Add columns to track discounts in ticket_tiers table
ALTER TABLE public.ticket_tiers
ADD COLUMN IF NOT EXISTS early_bird_tickets_sold integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS multiple_buys_tickets_sold integer DEFAULT 0;

-- Create a function to update discount stats when a ticket is sold
CREATE OR REPLACE FUNCTION update_discount_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- If this ticket had an early bird discount
    IF NEW.applied_early_bird_discount THEN
        -- Update the event's early bird tickets count
        UPDATE public.events 
        SET early_bird_tickets_sold = COALESCE(early_bird_tickets_sold, 0) + 1,
            total_discount_amount = COALESCE(total_discount_amount, 0) + COALESCE(NEW.early_bird_discount_amount, 0)
        WHERE id = NEW.event_id;
        
        -- Update the ticket tier's early bird tickets count if applicable
        IF NEW.ticket_tier_id IS NOT NULL THEN
            UPDATE public.ticket_tiers
            SET early_bird_tickets_sold = COALESCE(early_bird_tickets_sold, 0) + 1
            WHERE id = NEW.ticket_tier_id;
        END IF;
    END IF;
    
    -- If this ticket had a multiple buys discount
    IF NEW.applied_multiple_buys_discount THEN
        -- Update the event's multiple buys tickets count
        UPDATE public.events 
        SET multiple_buys_tickets_sold = COALESCE(multiple_buys_tickets_sold, 0) + 1,
            total_discount_amount = COALESCE(total_discount_amount, 0) + COALESCE(NEW.multiple_buys_discount_amount, 0)
        WHERE id = NEW.event_id;
        
        -- Update the ticket tier's multiple buys tickets count if applicable
        IF NEW.ticket_tier_id IS NOT NULL THEN
            UPDATE public.ticket_tiers
            SET multiple_buys_tickets_sold = COALESCE(multiple_buys_tickets_sold, 0) + 1
            WHERE id = NEW.ticket_tier_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update discount stats when a ticket is inserted
CREATE TRIGGER update_discount_stats_trigger
AFTER INSERT ON public.paid_tickets
FOR EACH ROW
EXECUTE FUNCTION update_discount_stats(); 