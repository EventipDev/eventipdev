import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request) {
  try {
    // Check for email query parameter
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    console.log('Tickets API called', email ? `for email: ${email}` : 'for all tickets');
    
    // Get tickets ONLY from paid_tickets table
    let query = supabase
      .from('paid_tickets')
      .select('*')
      .order('purchase_date', { ascending: false });
    
    // Filter by email if provided
    if (email) {
      console.log('Filtering paid tickets by email:', email);
      query = query.eq('customer_email', email);
    }
    
    // Execute the query
    const { data: paidTickets, error: paidError } = await query;
    
    if (paidError) {
      console.error('Error fetching from paid_tickets table:', paidError);
      return NextResponse.json(
        { success: false, message: 'Database error: ' + paidError.message },
        { status: 500 }
      );
    }
    
    // Ensure we always return an array
    const allTickets = paidTickets || [];
    
    return NextResponse.json({
      success: true,
      data: allTickets
    });
    
  } catch (error) {
    console.error('Error in tickets API:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request: ' + error.message },
      { status: 500 }
    );
  }
}