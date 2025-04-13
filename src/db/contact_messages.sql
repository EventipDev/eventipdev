-- Create contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'unread'
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);

-- Create index on created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);

-- Add row level security policies if not exists
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admins to view messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow anyone to submit messages" ON public.contact_messages;

-- Only allow admins to view contact messages
CREATE POLICY "Allow admins to view messages" ON public.contact_messages
    FOR SELECT
    TO authenticated
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Allow anyone to insert messages
CREATE POLICY "Allow anyone to submit messages" ON public.contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Insert sample data for testing
INSERT INTO public.contact_messages (name, email, subject, message, status, created_at)
VALUES
    ('John Doe', 'john.doe@example.com', 'Event Question', 'I have a question about the upcoming music festival. What time does it start?', 'unread', NOW() - INTERVAL '1 day'),
    ('Jane Smith', 'jane.smith@example.com', 'Ticket Refund', 'I purchased tickets for the wrong date. Can I get a refund?', 'unread', NOW() - INTERVAL '2 days'),
    ('Michael Johnson', 'michael.j@example.com', 'Partnership Opportunity', 'Our company would like to sponsor your next event. Please contact me to discuss.', 'read', NOW() - INTERVAL '5 days'),
    ('Sarah Williams', 'sarah.w@example.com', 'Accessibility Concerns', 'I would like to know if your venue is wheelchair accessible?', 'unread', NOW() - INTERVAL '3 hours'),
    ('Robert Brown', 'robert.b@example.com', 'Technical Issues', 'I'm having trouble accessing my tickets in the app. Can you help?', 'read', NOW() - INTERVAL '4 days'),
    ('Emily Davis', 'emily.d@example.com', 'Vendor Application', 'I would like to apply as a food vendor for your summer festival.', 'archived', NOW() - INTERVAL '2 weeks'),
    ('David Wilson', 'david.w@example.com', 'Event Security', 'What security measures will be in place for the upcoming concert?', 'unread', NOW() - INTERVAL '12 hours'),
    ('Jennifer Lopez', 'jennifer.l@example.com', 'Media Pass', 'I'm a journalist looking to cover your next event. How can I get a media pass?', 'read', NOW() - INTERVAL '6 days'),
    ('Thomas Anderson', 'thomas.a@example.com', 'Sponsorship Proposal', 'Please find attached our sponsorship proposal for your next event.', 'archived', NOW() - INTERVAL '3 weeks'),
    ('Olivia Martin', 'olivia.m@example.com', 'Event Photography', 'I would like to apply as an official photographer for your events.', 'unread', NOW() - INTERVAL '2 days');

-- Confirm completion
SELECT 'Added sample contact messages for testing' as result; 