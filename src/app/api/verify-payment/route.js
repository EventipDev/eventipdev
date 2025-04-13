import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(request) {
  try {
    const body = await request.json();
    const { reference, paystackResponse } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Reference is required' },
        { status: 400 }
      );
    }

    // Get the Paystack secret key from environment variables
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      console.error('Paystack secret key is not defined');
      return NextResponse.json(
        { success: false, message: 'Payment verification is not available' },
        { status: 500 }
      );
    }

    // Log which key is being used (only show first few characters for security)
    console.log('Using Paystack secret key starting with:', paystackSecretKey.substring(0, 8) + '...');
    console.log('Is test key?', paystackSecretKey.startsWith('sk_test_'));
    console.log('Is live key?', paystackSecretKey.startsWith('sk_live_'));

    console.log('Verifying payment with reference:', reference);

    // Use the provided paystackResponse if available, otherwise fetch from Paystack API
    let data;
    if (paystackResponse && paystackResponse.status === 'success') {
      console.log('Using provided Paystack response data');
      data = { status: true, data: paystackResponse };
    } else {
      // Verify the payment with Paystack API
      try {
        console.log('Making request to Paystack API...');
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Paystack API error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
        }

        data = await response.json();
        console.log('Paystack API verification response:', JSON.stringify(data));
      } catch (error) {
        console.error('Error verifying with Paystack:', error);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to verify payment with Paystack',
            error: error.message
          },
          { status: 500 }
        );
      }
    }

    // Check if payment is successful
    if (!data || !data.status || data.data?.status !== 'success') {
      console.error('Invalid or unsuccessful payment:', data);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment verification failed - invalid or unsuccessful payment',
          details: data?.data?.gateway_response || 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Payment was successful, extract the metadata
    const paystackData = data.data;
    let event_id, ticket_type, customer_name, ticket_tier_id;
    
    // Try different ways to extract the event_id and ticket_type
    // First look in the metadata
    if (paystackData.metadata) {
      console.log('Paystack metadata:', JSON.stringify(paystackData.metadata));
      
      // Direct metadata fields
      if (paystackData.metadata.event_id) {
        event_id = paystackData.metadata.event_id;
      }
      
      if (paystackData.metadata.ticket_type) {
        ticket_type = paystackData.metadata.ticket_type;
      }

      if (paystackData.metadata.ticket_tier_id) {
        ticket_tier_id = paystackData.metadata.ticket_tier_id;
      }
      
      // Check in custom_fields
      if (paystackData.metadata.custom_fields && Array.isArray(paystackData.metadata.custom_fields)) {
        const eventIdField = paystackData.metadata.custom_fields.find(f => 
          f.variable_name === 'event_id' || f.display_name === 'Event ID');
        
        if (eventIdField && eventIdField.value) {
          event_id = eventIdField.value;
        }
        
        const ticketTypeField = paystackData.metadata.custom_fields.find(f => 
          f.variable_name === 'ticket_type' || f.display_name === 'Ticket Type');
        
        if (ticketTypeField && ticketTypeField.value) {
          ticket_type = ticketTypeField.value;
        }

        const customerNameField = paystackData.metadata.custom_fields.find(f => 
          f.variable_name === 'customer_name' || f.display_name === 'Customer Name');
        
        if (customerNameField && customerNameField.value) {
          customer_name = customerNameField.value;
        }

        const ticketTierField = paystackData.metadata.custom_fields.find(f => 
          f.variable_name === 'ticket_tier_id' || f.display_name === 'Ticket Tier ID');
        
        if (ticketTierField && ticketTierField.value) {
          ticket_tier_id = ticketTierField.value;
        }
      }
    }
    
    // If event_id is still not found, this is an error
    if (!event_id) {
      console.error('Event ID not found in payment metadata');
      return NextResponse.json(
        { success: false, message: 'Invalid event information' },
        { status: 400 }
      );
    }

    // Get the ticket tier if not provided or if it's 'default'
    if (!ticket_tier_id || ticket_tier_id === 'default') {
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
          ticket_tier_id = tierData.id;
          console.log('Found ticket tier ID:', ticket_tier_id);
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
    
    // Final validation of ticket_tier_id - must be a valid UUID
    if (typeof ticket_tier_id !== 'string' || !ticket_tier_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Invalid ticket_tier_id format:', ticket_tier_id);
      return NextResponse.json(
        { success: false, message: 'Invalid ticket tier ID format' },
        { status: 400 }
      );
    }
    
    const customer_email = paystackData.customer.email;
    const price_paid = paystackData.amount / 100; // Convert from kobo to naira
    
    // Ensure price_paid is never null (set to 0 if no amount is available)
    const final_price = price_paid || 0;
    console.log('Price paid:', final_price);
    
    const transaction_id = paystackData.id;

    // Try to get the user_id from email
    let user_id = null;
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customer_email)
        .single();

      if (!userError && userData) {
        user_id = userData.id;
      } else {
        console.warn('User not found with email:', customer_email);
      }
    } catch (error) {
      console.warn('Error fetching user:', error);
    }
    
    // Generate a ticket code
    const ticket_code = `TIX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Store the full amount without platform fee deduction
    const originalAmount = parseFloat(final_price) || 0;
    
    console.log('Original amount:', originalAmount, 'Full amount will be stored (no platform fee deduction)');
    
    console.log('Saving ticket with data:', {
      event_id,
      ticket_tier_id,
      user_id,
      price_paid: originalAmount, // Store full amount
      ticket_code,
      transaction_id,
      reference
    });
    
    // Check if a ticket with this reference already exists in either table
    const { data: existingTicket, error: checkError } = await supabase
      .from('tickets')
      .select('id')
      .eq('reference', reference)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing ticket:', checkError);
      return NextResponse.json(
        { success: false, message: 'Error checking for existing ticket' },
        { status: 500 }
      );
    }

    if (existingTicket) {
      console.log('Ticket already exists with reference:', reference);
      return NextResponse.json({
        success: true,
        message: 'Payment verification successful (ticket already exists)',
        data: {
          reference,
          transaction_id,
          price_paid: final_price,
          ticket_type,
          event_id,
          status: 'active'
        }
      });
    }

    // Save to tickets table first
    const ticketData = {
      event_id,
      ticket_tier_id,
      user_id,
      customer_email,
      price_paid: originalAmount,
      ticket_code,
      ticket_type,
      reference,
      transaction_id,
      status: 'active',
      purchase_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    console.log('Saving to tickets table:', ticketData);
    
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select();

    if (ticketError) {
      console.error('Error saving to tickets:', ticketError);
      return NextResponse.json(
        { success: false, message: 'Error saving ticket: ' + ticketError.message },
        { status: 500 }
      );
    }

    // Then save to paid_tickets table
    const paidTicketData = {
      event_id,
      ticket_tier_id,
      user_id,
      transaction_id,
      reference,
      customer_email,
      customer_name: customer_name || paystackData.customer?.name || '',
      ticket_type,
      price_paid: originalAmount,
      status: 'active',
      purchase_date: new Date().toISOString()
    };
    
    console.log('Saving to paid_tickets table:', paidTicketData);
    
    const { data: paidTicket, error: paidError } = await supabase
      .from('paid_tickets')
      .insert([paidTicketData])
      .select();
      
    if (paidError) {
      console.error('Error saving to paid_tickets:', paidError);
      // Don't return error here since the ticket was already saved successfully
      console.warn('Failed to save to paid_tickets but ticket was created');
    } else {
      console.log('Paid ticket saved successfully:', paidTicket);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment verification successful',
      data: {
        reference,
        transaction_id,
        price_paid: final_price,
        ticket_type,
        event_id,
        status: 'active',
        ticket_code
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while verifying payment: ' + error.message },
      { status: 500 }
    );
  }
}