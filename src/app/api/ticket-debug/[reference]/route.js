import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(request, { params }) {
  try {
    const { reference } = params;
    
    if (!reference) {
      return NextResponse.json({
        success: false,
        message: 'Reference is required'
      }, { status: 400 });
    }
    
    console.log('Debug API: Looking up ticket with reference:', reference);
    
    // Direct database query
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('reference', reference);
    
    if (error) {
      console.error('Debug API error:', error);
      return NextResponse.json({
        success: false,
        message: 'Database error: ' + error.message
      }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No ticket found with this reference',
        reference
      }, { status: 404 });
    }
    
    // Return the raw database data
    return NextResponse.json({
      success: true,
      reference,
      count: data.length,
      tickets: data
    });
    
  } catch (err) {
    console.error('Debug API exception:', err);
    return NextResponse.json({
      success: false,
      message: 'Server error: ' + err.message
    }, { status: 500 });
  }
} 