-- Add an admin user

-- Insert admin user directly with plain password field
INSERT INTO admins (email, password, first_name, last_name)
VALUES (
  'admin@example.com', 
  'admin123',
  'Admin',
  'User'
) ON CONFLICT (email) DO NOTHING;

-- This script is for demonstration purposes only
-- In a production environment, passwords should be hashed properly
-- using a secure hashing function like bcrypt or Argon2 