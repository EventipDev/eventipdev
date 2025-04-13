-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS discounts CASCADE;
DROP TABLE IF EXISTS ticket_tiers CASCADE;
DROP TABLE IF EXISTS event_organizers CASCADE;
DROP TABLE IF EXISTS event_images CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create the users table with the correct structure
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    is_google_user BOOLEAN DEFAULT false,
    reset_token TEXT,
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Events Table
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    location_coordinates POINT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    timezone VARCHAR(50),
    is_public BOOLEAN DEFAULT true,
    is_paid BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, scheduled, cancelled
    share_token UUID DEFAULT uuid_generate_v4(),
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_publish_date TIMESTAMP WITH TIME ZONE,
    -- Early bird discount fields
    has_early_bird BOOLEAN DEFAULT false,
    early_bird_days INTEGER,
    early_bird_discount INTEGER, -- percentage discount
    -- Multiple buys discount fields
    has_multiple_buys BOOLEAN DEFAULT false,
    multiple_buys_min_tickets INTEGER,
    multiple_buys_discount INTEGER, -- percentage discount
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Event Images Table
CREATE TABLE event_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_cover BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Ticket Tiers Table
CREATE TABLE ticket_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_sold INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sale_starts_at TIMESTAMP WITH TIME ZONE,
    sale_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Event Organizers Table (for multiple organizers per event)
CREATE TABLE event_organizers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- main_organizer, co_organizer, staff
    permissions JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(event_id, user_id)
);

-- Tickets Table (for purchased tickets)
CREATE TABLE tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_tier_id UUID REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
    event_id UUID REFERENCES events(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    ticket_code VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'active', -- active, used, cancelled, refunded
    price_paid DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_event_images_event_id ON event_images(event_id);
CREATE INDEX idx_ticket_tiers_event_id ON ticket_tiers(event_id);

-- Create a view for event statistics
CREATE VIEW event_statistics AS
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.user_id as organizer_id,
    COUNT(DISTINCT t.id) as total_tickets_sold,
    SUM(t.price_paid) as total_revenue,
    COUNT(DISTINCT t.user_id) as unique_attendees,
    (
        SELECT COUNT(*) 
        FROM ticket_tiers tt 
        WHERE tt.event_id = e.id
    ) as number_of_tiers
FROM events e
LEFT JOIN tickets t ON e.id = t.event_id
GROUP BY e.id, e.name, e.user_id;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_tiers_updated_at
    BEFORE UPDATE ON ticket_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check ticket availability before purchase
CREATE OR REPLACE FUNCTION check_ticket_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM ticket_tiers
        WHERE id = NEW.ticket_tier_id
        AND quantity_sold >= quantity
    ) THEN
        RAISE EXCEPTION 'Ticket tier is sold out';
    END IF;
    
    UPDATE ticket_tiers
    SET quantity_sold = quantity_sold + 1
    WHERE id = NEW.ticket_tier_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for ticket availability check
CREATE TRIGGER check_ticket_availability_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION check_ticket_availability();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);

-- Create policies for events
CREATE POLICY "Users can view public events"
    ON events FOR SELECT
    USING (
        is_public = true 
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM event_organizers 
            WHERE event_id = events.id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON events FOR UPDATE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM event_organizers 
            WHERE event_id = events.id 
            AND user_id = auth.uid()
            AND role IN ('main_organizer', 'co_organizer')
        )
    );

CREATE POLICY "Users can delete their own events"
    ON events FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for event images
CREATE POLICY "Users can view event images"
    ON event_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE id = event_images.event_id
            AND (is_public = true OR user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage event images"
    ON event_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE id = event_images.event_id
            AND user_id = auth.uid()
        )
    );

-- Create policies for ticket tiers
CREATE POLICY "Anyone can view ticket tiers for public events"
    ON ticket_tiers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE id = ticket_tiers.event_id
            AND (is_public = true OR user_id = auth.uid())
        )
    );

-- Create policies for tickets
CREATE POLICY "Users can view their own tickets"
    ON tickets FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can purchase tickets"
    ON tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for event organizers
CREATE POLICY "Users can view event organizers"
    ON event_organizers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE id = event_organizers.event_id
            AND (is_public = true OR user_id = auth.uid())
        )
    );

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;
GRANT ALL ON events TO authenticated;
GRANT ALL ON events TO service_role;
GRANT ALL ON event_images TO authenticated;
GRANT ALL ON event_images TO service_role;
GRANT ALL ON ticket_tiers TO authenticated;
GRANT ALL ON ticket_tiers TO service_role;
GRANT ALL ON tickets TO authenticated;
GRANT ALL ON tickets TO service_role;
GRANT ALL ON event_organizers TO authenticated;
GRANT ALL ON event_organizers TO service_role; 