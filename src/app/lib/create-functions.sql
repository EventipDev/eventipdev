-- First make sure the users table exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  bio TEXT,
  interests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upsert_user function
CREATE OR REPLACE FUNCTION upsert_user(
  p_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone_number TEXT,
  p_bio TEXT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Try to update first
  UPDATE users
  SET 
    first_name = p_first_name,
    last_name = p_last_name,
    phone_number = p_phone_number,
    bio = p_bio,
    updated_at = NOW()
  WHERE id = p_id
  RETURNING to_jsonb(users.*) INTO result;
  
  -- If no rows affected, insert
  IF result IS NULL THEN
    INSERT INTO users (
      id, 
      email, 
      first_name, 
      last_name, 
      phone_number, 
      bio, 
      created_at, 
      updated_at
    ) VALUES (
      p_id,
      p_email,
      p_first_name,
      p_last_name,
      p_phone_number,
      p_bio,
      NOW(),
      NOW()
    )
    RETURNING to_jsonb(users.*) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 