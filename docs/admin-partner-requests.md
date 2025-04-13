# Partner Requests Admin Guide

This guide explains how to use the Partner Requests management system within the Eventip admin dashboard.

## Overview

The Partner Requests feature allows administrators to manage partnership inquiries, applications, and collaboration requests submitted through the "Become a Partner" form on the website. This system helps streamline the process of reviewing and responding to potential business partnerships.

## Accessing Partner Requests

1. Log in to the admin panel using your admin credentials
2. From the admin dashboard, click on the "Partner Requests" card in the navigation section
3. Alternatively, navigate directly to `/admin/partners`

## Key Features

### Viewing Requests

The Partner Requests page displays a table of all partnership applications with the following information:
- Company name
- Partnership type (Organizer, Venue, Sponsor, Technology Partner, etc.)
- Contact person and email
- Date submitted 
- Current status

Pending partnership requests are highlighted with a yellow background for easy identification.

### Filtering Requests

You can filter requests by status using the dropdown at the top of the page:
- **All Requests**: Shows all partnership applications regardless of status
- **Pending**: Shows only new, unreviewed requests
- **Reviewed**: Shows requests that have been viewed but not acted upon
- **Contacted**: Shows requests where you've reached out to the partner
- **Declined**: Shows requests that have been declined

### Viewing Request Details

To view the complete details of a partnership request:
1. Click the "View Details" button on any request in the table
2. A modal will appear showing all information submitted:
   - Company name
   - Contact person
   - Email address
   - Website (if provided)
   - Partnership type
   - The detailed message/inquiry
   - Submission date and current status

When you view a pending request for the first time, it will automatically be marked as "Reviewed."

### Managing Request Status

From the request detail view, you can update the status using the buttons at the bottom:
- **Mark as Pending**: Reset to initial status (awaiting review)
- **Mark as Reviewed**: Indicate you've seen the request but haven't acted on it
- **Mark as Contacted**: Indicate you've reached out to the partner
- **Mark as Declined**: Indicate the partnership request has been declined

## Request Status Workflow

A typical workflow for handling partnership requests:

1. **Pending** - New requests automatically start with this status
2. **Reviewed** - After viewing the request details (automatic when opening a pending request)
3. **Contacted** - After sending an email or calling the partner to discuss their request
4. **Declined** (if not suitable) or proceed to your partnership onboarding process

## Database Structure

The partner requests are stored in the `partner_requests` table with the following structure:

- `id`: UUID (Primary Key)
- `company_name`: VARCHAR (Company name)
- `website`: VARCHAR (Website URL, nullable)
- `contact_person`: VARCHAR (Name of the contact person)
- `email`: VARCHAR (Email address)
- `partnership_type`: VARCHAR (Type of partnership requested)
- `message`: TEXT (The detailed partnership inquiry)
- `created_at`: TIMESTAMP (When the request was submitted)
- `status`: VARCHAR (Current status: pending, reviewed, contacted, declined)

## Security

The partner requests system includes several security measures:
- Row-level security (RLS) ensures only authenticated admins can view partnership requests
- Access control checks prevent unauthorized users from accessing the admin interface

## Best Practices

1. Review partner requests promptly to maintain good relationships with potential partners
2. Update the status accurately as you progress through the partnership process
3. Use the filter options to focus on requests that need attention
4. Consider establishing SLAs for responding to different types of partnership requests

For any technical issues or questions about the partner requests system, please contact the development team. 