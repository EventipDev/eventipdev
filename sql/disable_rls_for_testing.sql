-- Temporarily disable Row Level Security on contact_messages table for troubleshooting
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- After testing, you can re-enable it with:
-- ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY; 