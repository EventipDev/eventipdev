-- Conversations and Messages tables for admin-user communication

-- Create conversations table to track conversations between admin and users
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_admin_id_idx ON conversations(admin_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at);

-- Create messages table to store individual messages in conversations
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'user')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS conversation_messages_conversation_id_idx ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_messages_sender_type_idx ON conversation_messages(sender_type);
CREATE INDEX IF NOT EXISTS conversation_messages_is_read_idx ON conversation_messages(is_read);
CREATE INDEX IF NOT EXISTS conversation_messages_created_at_idx ON conversation_messages(created_at);

-- Function to get or create a conversation between admin and user
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_id UUID, p_admin_id UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if conversation exists
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE user_id = p_user_id;
  
  -- If conversation doesn't exist, create it
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id, admin_id)
    VALUES (p_user_id, p_admin_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql; 