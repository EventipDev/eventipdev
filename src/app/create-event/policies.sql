-- Disable RLS on events table
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- In case we need to clean up policies
DROP POLICY IF EXISTS "Users can create their own events" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
DROP POLICY IF EXISTS "Public can view published events" ON events;

-- Also disable RLS on event_images table
ALTER TABLE event_images DISABLE ROW LEVEL SECURITY;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download images" ON storage.objects;

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;

-- Events table policies
CREATE POLICY "Enable read access for all users" ON events
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for event owners" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for event owners" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- Event images table policies
CREATE POLICY "Enable read access for all users" ON event_images
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON event_images
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_images.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for event owners" ON event_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_images.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for event owners" ON event_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_images.event_id
      AND user_id = auth.uid()
    )
  );

-- Ticket tiers table policies
CREATE POLICY "Enable read access for all users" ON ticket_tiers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for event owners" ON ticket_tiers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = ticket_tiers.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for event owners" ON ticket_tiers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = ticket_tiers.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for event owners" ON ticket_tiers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = ticket_tiers.event_id
      AND user_id = auth.uid()
    )
  );

-- Storage bucket policies
DO $$
BEGIN
    -- Check if the bucket doesn't exist before creating it
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'events'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('events', 'events', true);
    END IF;
END $$;

-- Create storage policies (these will be replaced if they already exist)
DROP POLICY IF EXISTS "Give users read access to events storage" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users insert access to events storage" ON storage.objects;
DROP POLICY IF EXISTS "Give users delete access to own events storage" ON storage.objects;

CREATE POLICY "Give users read access to events storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'events');

CREATE POLICY "Give authenticated users insert access to events storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'events' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Give users delete access to own events storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'events' AND
    auth.uid() = owner
  );

-- Grant necessary permissions
GRANT ALL ON events TO authenticated;
GRANT ALL ON event_images TO authenticated;
GRANT ALL ON ticket_tiers TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create policies for events table
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can create their own events" ON events;
    DROP POLICY IF EXISTS "Users can view their own events" ON events;
    DROP POLICY IF EXISTS "Users can update their own events" ON events;
    DROP POLICY IF EXISTS "Users can delete their own events" ON events;
    DROP POLICY IF EXISTS "Public can view published events" ON events;
    
    -- Create new policies
    CREATE POLICY "Users can create their own events" 
    ON events FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can view their own events" 
    ON events FOR SELECT 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own events" 
    ON events FOR UPDATE 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own events" 
    ON events FOR DELETE 
    USING (auth.uid() = user_id);

    CREATE POLICY "Public can view published events" 
    ON events FOR SELECT 
    USING (status = 'published' AND is_public = true);
END
$$; 