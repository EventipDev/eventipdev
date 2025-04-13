# Contact Messages Admin Guide

This document explains how to use the contact messages management system in the EventIP admin panel.

## Overview

The contact messages feature allows admins to view and manage all messages submitted through the website's contact form. Visitors can submit inquiries, feedback, or support requests through the contact form, and admins can review, respond to, and track the status of these messages.

## Accessing Contact Messages

1. Log in to the admin panel using your admin credentials
2. Navigate to the admin dashboard
3. Click on the "Contact Messages" card in the dashboard navigation section
4. Alternatively, you can directly access the contact messages page at `/admin/contact-us`

## Key Features

### Viewing Messages

- All contact messages are displayed in a table format showing the sender's name, subject, date, and status
- Messages are sorted by date, with the most recent messages appearing first
- Unread messages are highlighted with a yellow background for easy identification

### Filtering Messages

Use the status filter dropdown to view messages by status:
- **All Messages**: Shows all messages regardless of status
- **Unread**: Shows only messages that haven't been read yet
- **Read**: Shows messages that have been viewed but not yet resolved
- **Resolved**: Shows messages that have been marked as resolved

### Message Details

Click the "View" button next to any message to see its full details, including:
- Sender's name and email
- Subject and date
- Full message content
- Current status

### Managing Message Status

From the message list, you can:
- Click "View" to read a message's full content
- Click "Mark Read" to change an unread message to read status
- Click "Mark Unread" to change a read message back to unread status
- Click "Resolve" to mark a message as resolved (indicating action has been taken)

From the message detail view, you can:
- Mark a message as read
- Mark a message as resolved
- Reply to the sender via email (opens your default email client)

## Message Status Workflow

The typical workflow for handling contact messages:

1. New messages come in with "Unread" status
2. Admin views the message, which automatically changes status to "Read"
3. Admin takes necessary action (responds to the query, forwards to appropriate department, etc.)
4. Admin marks the message as "Resolved" once the matter is closed

## Database Structure

The contact messages are stored in the `contact_messages` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier for the message |
| name | VARCHAR(255) | Name of the sender |
| email | VARCHAR(255) | Email address of the sender |
| subject | VARCHAR(255) | Subject of the message |
| message | TEXT | Full message content |
| created_at | TIMESTAMP WITH TIME ZONE | When the message was submitted |
| status | VARCHAR(50) | Current status (unread, read, resolved) |

## Security

- Only authenticated administrators can view and update contact messages
- Contact messages are protected by row-level security in the database
- Anyone (including anonymous users) can submit new contact messages 