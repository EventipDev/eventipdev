-- Drop the existing table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create the users table with the correct structure
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    is_google_user BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;





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
    share_token UUID DEFAULT uuid_generate_v4(), -- Unique token for sharing
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_publish_date TIMESTAMP WITH TIME ZONE,
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

-- Event Access Table (for private events)
CREATE TABLE event_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL, -- 'owner', 'viewer'
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

-- Create indexes for better query performance
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_share_token ON events(share_token);
CREATE INDEX idx_events_is_public ON events(is_public);
CREATE INDEX idx_event_access_event_id ON event_access(event_id);
CREATE INDEX idx_event_access_user_id ON event_access(user_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);

-- Create a view for event statistics
CREATE VIEW event_statistics AS
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.user_id as organizer_id,
    e.is_public,
    COUNT(DISTINCT t.id) as total_tickets_sold,
    SUM(t.price_paid) as total_revenue,
    COUNT(DISTINCT t.user_id) as unique_attendees
FROM events e
LEFT JOIN tickets t ON e.id = t.event_id
GROUP BY e.id, e.name, e.user_id, e.is_public;

-- Function to update event updated_at timestamp
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

-- Add RLS (Row Level Security) policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_access ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Users can view public events"
    ON events FOR SELECT
    USING (
        is_public = true 
        OR user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM event_access 
            WHERE event_id = events.id 
            AND user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM tickets 
            WHERE event_id = events.id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON events FOR DELETE
    USING (auth.uid() = user_id);

-- Function to generate or refresh share token
CREATE OR REPLACE FUNCTION refresh_share_token(event_id UUID)
RETURNS UUID AS $$
DECLARE
    new_token UUID;
BEGIN
    new_token := uuid_generate_v4();
    UPDATE events SET share_token = new_token WHERE id = event_id;
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Function to check event access by share token
CREATE OR REPLACE FUNCTION check_event_access_by_token(token UUID)
RETURNS TABLE (
    event_id UUID,
    event_name VARCHAR(255),
    is_public BOOLEAN,
    can_access BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.is_public,
        (e.is_public OR e.share_token = token) as can_access
    FROM events e
    WHERE e.share_token = token;
END;
$$ LANGUAGE plpgsql;