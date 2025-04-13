-- Script to disable RLS on all tables
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_tiers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Remove any existing policies that might conflict
DROP POLICY IF EXISTS "Users can create their own events" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
DROP POLICY IF EXISTS "Public can view published events" ON events;

-- Remove storage policies
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download images" ON storage.objects;
DROP POLICY IF EXISTS "Give users read access to events storage" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users insert access to events storage" ON storage.objects;
DROP POLICY IF EXISTS "Give users delete access to own events storage" ON storage.objects;

-- Create events bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'events'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('events', 'events', true);
    END IF;
END $$;

-- Grant all permissions
GRANT ALL ON events TO authenticated, anon;
GRANT ALL ON event_images TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated, anon;
GRANT ALL ON storage.buckets TO authenticated, anon; 