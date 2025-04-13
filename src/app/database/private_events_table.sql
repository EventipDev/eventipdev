-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create private_events table
CREATE TABLE IF NOT EXISTS private_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_start_date DATE NOT NULL,
    event_end_date DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    is_paid BOOLEAN DEFAULT false,
    price DECIMAL(10, 2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    cover_image_url TEXT,
    share_link UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on user_id for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_private_events_user_id ON private_events(user_id);

-- Create index on share_link for fast lookups when accessing via link
CREATE INDEX IF NOT EXISTS idx_private_events_share_link ON private_events(share_link); 