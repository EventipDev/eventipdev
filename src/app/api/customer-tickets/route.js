import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request) {
  try {
    // Check for email query parameter
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const table = url.searchParams.get('table') || 'tickets'; // Default to tickets table
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching tickets from ${table} table for email: ${email}`);
    
    // Query the tickets table for the given email
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('customer_email', email)
      .order('purchase_date', { ascending: false });
    
    if (error) {
      console.error(`Error fetching tickets from ${table}:`, error);
      return NextResponse.json(
        { success: false, message: `Error fetching tickets: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Found ${data?.length || 0} tickets in ${table} for ${email}`);
    
    return NextResponse.json({
      success: true,
      data: data || [],
      table: table
    });
  } catch (error) {
    console.error('Error processing customer tickets request:', error);
    return NextResponse.json(
      { success: false, message: `An error occurred: ${error.message}` },
      { status: 500 }
    );
  }
} 