import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(request) {
  try {
    // Parse the request body
    const ticketData = await request.json();
    
    console.log("Received paid ticket data:", ticketData);
    
    const {
      event_id,
      reference,
      customer_email,
      customer_name,
      customer_phone,
      event_title,
      event_date,
      event_time,
      event_location,
      ticket_type,
      price_paid,
      transaction_id,
      ticket_tier_id,
      quantity = 1 // Get the quantity with default value of 1
    } = ticketData;

    // Validation of required fields only
    if (!event_id || !reference || !customer_email || !customer_name) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

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
      }
    } catch (error) {
      console.warn('Error fetching user:', error);
    }

    // Format the date properly for PostgreSQL
    let formattedDate;
    try {
      formattedDate = event_date ? new Date(event_date).toISOString() : new Date().toISOString();
    } catch (e) {
      console.error('Error formatting date:', e);
      formattedDate = new Date().toISOString();
    }

    // Check if a ticket with this reference already exists in paid_tickets
    const { data: existingTicket, error: checkError } = await supabase
      .from('paid_tickets')
      .select('id')
      .eq('reference', reference)
      .single();

    if (existingTicket) {
      console.log('Paid ticket already exists with reference:', reference);
      return NextResponse.json({
        success: true,
        message: 'Paid ticket already exists',
        data: {
          ticket_id: existingTicket.id,
          reference,
          saved_to_paid_table: true
        }
      });
    }

    // Store the original amount without any deduction (no 10% fee)
    const originalAmount = parseFloat(price_paid) || 0;
    
    console.log('Original amount:', originalAmount, 'Full amount will be stored (no platform fee deduction)');
    console.log('Ticket quantity:', quantity);

    // Prepare data for insertion into paid_tickets table
    const paidTicketData = {
      user_id,
      event_id,
      ticket_tier_id: ticket_tier_id || null,
      reference,
      transaction_id: transaction_id || '',
      customer_email,
      customer_name,
      customer_phone: customer_phone || '',
      event_title: event_title || 'Event',
      event_date: formattedDate,
      event_time: event_time || '',
      event_location: event_location || '',
      ticket_type: ticket_type || 'General Admission',
      price_paid: originalAmount, // Store the full amount without deduction
      status: 'active',
      purchase_date: new Date().toISOString(),
      quantity: quantity // Add the quantity parameter
    };

    // Save to paid_tickets table
    const { data: paidTicket, error: paidError } = await supabase
      .from('paid_tickets')
      .insert([paidTicketData])
      .select()
      .single();

    if (paidError) {
      console.error('Error saving to paid_tickets:', paidError);
      return NextResponse.json(
        { success: false, message: 'Error saving to paid_tickets: ' + paidError.message },
        { status: 500 }
      );
    }
    
    console.log('Paid ticket saved successfully:', paidTicket);
    
    // Manually update the ticket_tier's paid_quantity_sold field if applicable
    if (ticket_tier_id) {
      try {
        // First get the current value
        const { data: tierData, error: tierError } = await supabase
          .from('ticket_tiers')
          .select('paid_quantity_sold')
          .eq('id', ticket_tier_id)
          .single();
          
        if (!tierError && tierData) {
          // Calculate the new value
          const currentQuantity = tierData.paid_quantity_sold || 0;
          const newQuantity = currentQuantity + quantity;
          
          // Update the ticket tier
          const { error: updateError } = await supabase
            .from('ticket_tiers')
            .update({ paid_quantity_sold: newQuantity })
            .eq('id', ticket_tier_id);
            
          if (updateError) {
            console.error('Error updating ticket tier quantity:', updateError);
          } else {
            console.log(`Successfully updated ticket tier quantity from ${currentQuantity} to ${newQuantity}`);
          }
        }
      } catch (error) {
        console.error('Error updating ticket tier:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Paid ticket saved successfully',
      data: {
        reference,
        saved_to_paid_table: true,
        paid_ticket_id: paidTicket?.id,
        quantity: quantity
      }
    });
  } catch (error) {
    console.error('Error processing ticket save request:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while saving your ticket: ' + error.message },
      { status: 500 }
    );
  }
}