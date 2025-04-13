-- Support Messages Table for Admin Dashboard

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_replied BOOLEAN DEFAULT FALSE,
  reply_content TEXT,
  reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS support_messages_user_id_idx ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS support_messages_is_read_idx ON support_messages(is_read);
CREATE INDEX IF NOT EXISTS support_messages_created_at_idx ON support_messages(created_at);

-- Create Notifications Table for Admin Dashboard
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL, -- 'payment', 'event', 'message', etc.
  source_id UUID, -- ID of the payment, event, message, etc.
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_title TEXT,
  p_message TEXT,
  p_source TEXT,
  p_source_id UUID
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (title, message, source, source_id)
  VALUES (p_title, p_message, p_source, p_source_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET 
    read = TRUE,
    updated_at = NOW()
  WHERE id = p_notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification when a new support message is created
CREATE OR REPLACE FUNCTION notify_new_support_message()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Get the user email
  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification
  PERFORM create_notification(
    'New Support Message',
    'New support message from ' || v_user_email,
    'message',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the support_messages table
CREATE TRIGGER trigger_new_support_message
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_support_message(); 