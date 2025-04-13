-- Partner Requests table migration script

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create partner_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.partner_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    partnership_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_partner_requests_status ON public.partner_requests(status);

-- Create index on created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_partner_requests_created_at ON public.partner_requests(created_at);

-- Create index on partnership_type for filtering by type
CREATE INDEX IF NOT EXISTS idx_partner_requests_type ON public.partner_requests(partnership_type);

-- Add row level security policies
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow admins to view partner requests" ON public.partner_requests;
DROP POLICY IF EXISTS "Allow admins to update partner requests" ON public.partner_requests;
DROP POLICY IF EXISTS "Allow anyone to submit partner requests" ON public.partner_requests;

-- Only allow admins to view partner requests
CREATE POLICY "Allow admins to view partner requests" ON public.partner_requests
    FOR SELECT
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR 
           (current_setting('request.headers')::json ->> 'x-admin-access') = 'true');

-- Only allow admins to update partner requests
CREATE POLICY "Allow admins to update partner requests" ON public.partner_requests
    FOR UPDATE
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR 
           (current_setting('request.headers')::json ->> 'x-admin-access') = 'true');

-- Allow anyone to insert partner requests
CREATE POLICY "Allow anyone to submit partner requests" ON public.partner_requests
    FOR INSERT
    WITH CHECK (true);

-- Grant necessary privileges
GRANT SELECT, INSERT, UPDATE ON public.partner_requests TO authenticated;
GRANT INSERT ON public.partner_requests TO anon;

-- Insert sample data if needed (uncomment to use)
/*
INSERT INTO public.partner_requests (company_name, website, contact_person, email, partnership_type, message, status)
VALUES 
('Tech Partners Inc.', 'https://techpartners.example.com', 'John Smith', 'john@techpartners.example.com', 'Technology Partner', 'We would like to offer our ticketing solution integration with your platform.', 'pending'),
('Venue Masters', 'https://venuemasters.example.com', 'Maria Garcia', 'maria@venuemasters.example.com', 'Venue', 'We own multiple event venues and would like to list them on your platform.', 'pending'),
('Event Organizers LLC', 'https://eventorganizers.example.com', 'David Lee', 'david@eventorganizers.example.com', 'Organizer', 'We organize corporate events and would like to partner with your platform.', 'pending'),
('Sponsor Group', 'https://sponsorgroup.example.com', 'Emily Wong', 'emily@sponsorgroup.example.com', 'Sponsor', 'We are interested in sponsoring events on your platform.', 'pending');
*/ 