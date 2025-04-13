import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request) {
  try {
    // Get the reference from the URL
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Ticket reference is required' },
        { status: 400 }
      );
    }

    // Query the database for the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        events:event_id (
          title,
          date,
          time,
          location
        )
      `)
      .eq('reference', reference)
      .single();

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      return NextResponse.json(
        { success: false, message: 'Error fetching ticket' },
        { status: 500 }
      );
    }

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Format the response data
    const responseData = {
      ticket_id: ticket.id,
      reference: ticket.reference,
      customer_name: ticket.customer_name,
      customer_email: ticket.customer_email,
      ticket_type: ticket.ticket_type,
      amount: ticket.amount,
      status: ticket.status,
      is_free: ticket.is_free,
      purchase_date: ticket.purchase_date,
      event: ticket.events ? {
        id: ticket.event_id,
        title: ticket.events.title,
        date: ticket.events.date,
        time: ticket.events.time,
        location: ticket.events.location
      } : null
    };

    return NextResponse.json({
      success: true,
      message: 'Ticket verified successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error verifying ticket:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while verifying the ticket' },
      { status: 500 }
    );
  }
} 