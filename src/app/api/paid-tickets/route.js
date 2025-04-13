import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request) {
  try {
    // Check for email query parameter
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
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
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error fetching paid tickets: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching paid tickets:', error);
    
    return NextResponse.json(
      { success: false, message: `Failed to fetch paid tickets: ${error.message}` },
      { status: 500 }
    );
  }
} 