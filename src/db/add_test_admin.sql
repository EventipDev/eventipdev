-- Add a test admin user to the admins table

INSERT INTO admins (
  id, 
  email, 
  password,
  created_at
)
VALUES (
  uuid_generate_v4(),
  'admin@example.com',
  'admin123',  -- In a real app, this should be properly hashed
  NOW()
)
ON CONFLICT (email) DO NOTHING; 

-- Make sure the admin can be returned by the test query
SELECT * FROM admins WHERE email = 'admin@example.com'; 