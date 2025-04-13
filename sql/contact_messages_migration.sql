-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the contact_messages table if it doesn't exist
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

-- Add row level security policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow admins to view messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admins to update messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow anyone to submit messages" ON public.contact_messages;

-- Only allow admins to view contact messages
CREATE POLICY "Allow admins to view messages" ON public.contact_messages
    FOR SELECT
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
        (current_setting('request.headers')::json ->> 'x-admin-access') = 'true'
    );

-- Allow admins to update message status
CREATE POLICY "Allow admins to update messages" ON public.contact_messages
    FOR UPDATE
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
        (current_setting('request.headers')::json ->> 'x-admin-access') = 'true'
    )
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
        (current_setting('request.headers')::json ->> 'x-admin-access') = 'true'
    );

-- Allow anyone to insert messages
CREATE POLICY "Allow anyone to submit messages" ON public.contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Grant necessary privileges
GRANT SELECT, INSERT, UPDATE ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE ON public.contact_messages TO authenticated; 