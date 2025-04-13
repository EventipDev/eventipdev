import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    const email = url.searchParams.get('email');
    
    if (!user_id && !email) {
      return NextResponse.json(
        { success: false, message: 'Either user_id or email is required' },
        { status: 400 }
      );
    }
    
    let tickets = [];
    
    if (user_id) {
      // Fetch tickets by user_id
      const { data, error } = await supabase
        .from('free_tickets')
        .select('*')
        .eq('user_id', user_id)
        .order('purchase_date', { ascending: false });
        
      if (error) {
        throw new Error(`Error fetching tickets by user_id: ${error.message}`);
      }
      
      tickets = data || [];
    } else if (email) {
      // Fetch tickets by email
      const { data, error } = await supabase
        .from('free_tickets')
        .select('*')
        .eq('customer_email', email)
        .order('purchase_date', { ascending: false });
        
      if (error) {
        throw new Error(`Error fetching tickets by email: ${error.message}`);
      }
      
      tickets = data || [];
    }
    
    return NextResponse.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Error fetching free tickets:', error);
    
    return NextResponse.json(
      { success: false, message: `Failed to fetch tickets: ${error.message}` },
      { status: 500 }
    );
  }
} 