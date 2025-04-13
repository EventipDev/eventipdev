import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

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

    console.log('Received request to register free ticket:', {
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

    // Find a ticket tier if not provided or if it's 'default'
    let tier_id = ticket_tier_id;
    if (!tier_id || tier_id === 'default') {
      try {
        console.log('Looking up a valid ticket tier for event:', event_id);
        // Try to find a default ticket tier for this event
        const { data: tierData, error: tierError } = await supabase
          .from('ticket_tiers')
          .select('id')
          .eq('event_id', event_id)
          .limit(1)
          .single();

        if (tierError) {
          console.error('Error finding ticket tier:', tierError);
          return NextResponse.json(
            { success: false, message: 'Could not find ticket tier for this event' },
            { status: 400 }
          );
        }

        if (tierData) {
          tier_id = tierData.id;
          console.log('Found ticket tier ID:', tier_id);
        } else {
          return NextResponse.json(
            { success: false, message: 'No ticket tiers found for this event' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error finding ticket tier:', error);
        return NextResponse.json(
          { success: false, message: 'Error processing ticket tier: ' + error.message },
          { status: 500 }
        );
      }
    }

    // Try to get the user_id from email
    let user_id = null;
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!userError && userData) {
        user_id = userData.id;
      } else {
        console.warn('User not found with email:', email);
      }
    } catch (error) {
      console.warn('Error fetching user:', error);
    }

    // Generate a ticket code
    const ticket_code = `TIX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    console.log('Creating free ticket with data:', {
      event_id,
      ticket_tier_id: tier_id,
      user_id,
      ticket_code,
      price_paid: 0
    });

    // Save the free ticket to the database
    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          event_id,
          ticket_tier_id: tier_id,
          user_id,
          customer_email: email,
          ticket_code,
          ticket_type: ticket_type || 'General Admission',
          reference,
          price_paid: 0, // Free ticket
          status: 'active',
          purchase_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error registering free ticket:', error);
      return NextResponse.json(
        { success: false, message: 'Error registering ticket: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Free ticket registered successfully:', data);
    return NextResponse.json({
      success: true,
      message: 'Free ticket registered successfully',
      data: {
        ticket_id: data ? data[0]?.id : null,
        reference,
        email
      }
    });
  } catch (error) {
    console.error('Error processing free ticket request:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request: ' + error.message },
      { status: 500 }
    );
  }
}