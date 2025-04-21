-- Create news_posts table
CREATE TABLE public.news_posts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title character varying(255) NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  image_url text NULL, -- Using text type for base64 encoded images
  category character varying(50) NOT NULL,
  author_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status character varying(20) NOT NULL DEFAULT 'draft'::character varying,
  is_featured boolean NOT NULL DEFAULT false,
  slug character varying(255) NULL,
  
  CONSTRAINT news_posts_pkey PRIMARY KEY (id),
  CONSTRAINT news_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES users (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_posts_created_at ON public.news_posts USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_news_posts_category ON public.news_posts USING btree (category) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_news_posts_status ON public.news_posts USING btree (status) TABLESPACE pg_default;

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON news_posts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Note: This assumes that the trigger_set_timestamp() function already exists
-- If it doesn't, you'll need to create it with:
/*
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

COMMENT ON TABLE public.news_posts IS 'Stores news posts for the platform'; 