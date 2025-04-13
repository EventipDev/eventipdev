-- Add a test user to the users table

INSERT INTO users (
  id, 
  email, 
  first_name, 
  last_name, 
  password
)
VALUES (
  uuid_generate_v4(),
  'testuser@example.com',
  'Test',
  'User',
  'password123'  -- In a real app, this should be properly hashed
)
ON CONFLICT (email) DO NOTHING; 