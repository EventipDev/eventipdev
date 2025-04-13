-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table to track all sent notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- 'contact', 'partner', 'system', etc.
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'failed', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'system',
    related_subject VARCHAR(255), -- For contact messages: original subject
    related_company VARCHAR(255)  -- For partner requests: company name
);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Create index on recipient_id for filtering
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Create notification templates table for system notifications
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    event_trigger VARCHAR(100) NOT NULL, -- 'user_signup', 'password_reset', etc.
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint on name and event_trigger
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_templates_unique 
ON public.notification_templates(name, event_trigger);

-- Add row level security policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow admins to view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow admins to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow admins full access to templates" ON public.notification_templates;

-- Only allow admins to view notifications
CREATE POLICY "Allow admins to view notifications" ON public.notifications
    FOR SELECT
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
        (current_setting('request.headers')::json ->> 'x-admin-access') = 'true'
    );

-- Allow admins to insert notifications
CREATE POLICY "Allow admins to insert notifications" ON public.notifications
    FOR INSERT
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
        (current_setting('request.headers')::json ->> 'x-admin-access') = 'true'
    );

-- Allow admins full access to notification templates
CREATE POLICY "Allow admins full access to templates" ON public.notification_templates
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
        (current_setting('request.headers')::json ->> 'x-admin-access') = 'true'
    );

-- Grant necessary privileges
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;

-- Insert some default notification templates
INSERT INTO public.notification_templates (name, type, event_trigger, subject, message, is_active)
VALUES 
('Welcome Email', 'system', 'user_signup', 'Welcome to Eventips!', 
'Dear [NAME],

Welcome to Eventips! We''re excited to have you join our community of event enthusiasts.

Your account has been successfully created with email: [EMAIL]

Start exploring events in your area or create your own event today!

Best regards,
The Eventips Team', 
true),

('Password Reset', 'system', 'password_reset', 'Reset Your Eventips Password', 
'Dear [NAME],

We received a request to reset your password for your Eventips account. Please click the link below to reset your password:

[RESET_LINK]

If you didn''t request a password reset, you can safely ignore this email.

Best regards,
The Eventips Team', 
true),

('Event Reminder', 'system', 'event_reminder', 'Reminder: Upcoming Event', 
'Dear [NAME],

This is a friendly reminder that you have registered for the following event:

Event: [EVENT_NAME]
Date: [EVENT_DATE]
Location: [EVENT_LOCATION]

We look forward to seeing you there!

Best regards,
The Eventips Team', 
true),

('Ticket Purchase Confirmation', 'system', 'ticket_purchased', 'Your Eventips Ticket Confirmation', 
'Dear [NAME],

Thank you for your purchase! Your ticket for [EVENT_NAME] has been confirmed.

Ticket Details:
- Event: [EVENT_NAME]
- Date: [EVENT_DATE]
- Ticket Type: [TICKET_TYPE]
- Ticket ID: [TICKET_ID]

You can view your ticket in your account dashboard at any time.

Best regards,
The Eventips Team', 
true); 