-- Admin Authentication SQL

-- Function to verify admin password
CREATE OR REPLACE FUNCTION verify_admin_password(admin_email TEXT, admin_password TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
  result BOOLEAN;
BEGIN
  -- Get the stored password hash for the admin
  SELECT password_hash INTO stored_hash
  FROM admins
  WHERE email = admin_email;
  
  -- If no admin found with that email, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Use pgcrypto to verify the password against the stored hash
  -- This assumes password_hash is stored using pgcrypto's crypt function
  SELECT stored_hash = crypt(admin_password, stored_hash) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new admin
CREATE OR REPLACE FUNCTION create_admin(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Generate a cryptographically secure hash of the password using pgcrypto
  INSERT INTO admins (email, password_hash, first_name, last_name)
  VALUES (
    LOWER(p_email), 
    crypt(p_password, gen_salt('bf')), -- Use Blowfish algorithm for hashing
    p_first_name,
    p_last_name
  )
  RETURNING id INTO v_admin_id;
  
  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update admin password
CREATE OR REPLACE FUNCTION update_admin_password(
  p_admin_id UUID,
  p_old_password TEXT,
  p_new_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
  v_valid BOOLEAN;
BEGIN
  -- Get the current password hash
  SELECT password_hash INTO v_password_hash
  FROM admins
  WHERE id = p_admin_id;
  
  -- Verify the old password is correct
  SELECT v_password_hash = crypt(p_old_password, v_password_hash) INTO v_valid;
  
  IF NOT v_valid THEN
    RETURN FALSE;
  END IF;
  
  -- Update to the new password
  UPDATE admins
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_admin_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 