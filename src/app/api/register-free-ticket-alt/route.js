import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const {
      event_id,
      email,
      first_name,
      last_name,
      phone,
      ticket_type,
      ticket_tier_id,
      reference
    } = await request.json();

    console.log('Received request to register free ticket (alt):', {
      event_id,
      email,
      ticket_type,
      ticket_tier_id,
      reference
    });

    // Validation
    if (!event_id || !email || !reference) {
      console.error('Missing required fields:', { event_id, email, reference });
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a ticket code
    const ticket_code = `TIX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Generate a valid UUID if ticket_tier_id is 'default' or not provided
    let tier_id = ticket_tier_id;
    if (!tier_id || tier_id === 'default') {
      tier_id = uuidv4(); // Generate a valid UUID for local storage
      console.log('Generated UUID for ticket tier:', tier_id);
    }

    // Create a ticket object
    const ticket = {
      id: Math.floor(Math.random() * 1000000),
      event_id,
      user_id: null, // No user linking in local storage mode
      ticket_tier_id: tier_id,
      customer_email: email, // Keep these fields for display purposes
      customer_name: `${first_name} ${last_name}`.trim(),
      customer_phone: phone || null,
      ticket_type: ticket_type || 'General Admission',
      ticket_code,
      price_paid: 0, // Free ticket
      reference,
      status: 'active',
      purchase_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Try to write to local file system (for development only)
    try {
      const dataDirectory = path.join(process.cwd(), 'public', 'data');
      await fs.mkdir(dataDirectory, { recursive: true });
      
      const ticketsFile = path.join(dataDirectory, 'tickets.json');
      
      // Read existing tickets or create empty array
      let tickets = [];
      try {
        const fileContent = await fs.readFile(ticketsFile, 'utf8');
        tickets = JSON.parse(fileContent);
      } catch (e) {
        // File doesn't exist or is invalid, start with empty array
        tickets = [];
      }
      
      // Add the new ticket
      tickets.push(ticket);
      
      // Write back to file
      await fs.writeFile(ticketsFile, JSON.stringify(tickets, null, 2), 'utf8');
      
      console.log('Free ticket saved to local storage');
    } catch (fsError) {
      console.warn('Could not save ticket to file:', fsError);
      // This is not critical, just for development, so continue
    }

    console.log('Free ticket registered successfully (alt method)');
    return NextResponse.json({
      success: true,
      message: 'Free ticket registered successfully',
      data: {
        ticket_id: ticket.id,
        reference,
        email
      }
    });
  } catch (error) {
    console.error('Error processing free ticket request (alt):', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request: ' + error.message },
      { status: 500 }
    );
  }
} 