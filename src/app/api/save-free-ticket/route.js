import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(request) {
  try {
    // Parse the request body
    const ticketData = await request.json();
    
    console.log("Received ticket data:", ticketData);
    
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
      price_paid = 0
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
      // If it's already a valid date string, use it
      formattedDate = event_date ? new Date(event_date).toISOString() : new Date().toISOString();
    } catch (e) {
      console.error('Error formatting date:', e);
      formattedDate = new Date().toISOString();
    }

    // Prepare data for insertion
    const insertData = {
      user_id,
      event_id,
      reference,
      customer_email,
      customer_name,
      customer_phone: customer_phone || '',
      event_title: event_title || 'Event',
      event_date: formattedDate,
      event_time: event_time || '',
      event_location: event_location || '',
      ticket_type: ticket_type || 'General Admission',
      price_paid: price_paid || 0,
      status: 'active',
      purchase_date: new Date().toISOString()
    };
    
    console.log("Inserting data into free_tickets:", insertData);

    // Save the free ticket to the free_tickets table
    const { data, error } = await supabase
      .from('free_tickets')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Error saving free ticket:', error);
      return NextResponse.json(
        { success: false, message: 'Error saving ticket: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Free ticket saved successfully:', data);
    return NextResponse.json({
      success: true,
      message: 'Free ticket saved successfully',
      data: {
        ticket_id: data?.[0]?.id,
        reference
      }
    });
  } catch (error) {
    console.error('Error processing free ticket save request:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while saving your ticket: ' + error.message },
      { status: 500 }
    );
  }
}