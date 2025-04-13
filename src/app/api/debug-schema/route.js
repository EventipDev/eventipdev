import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Supabase client not initialized' },
        { status: 500 }
      );
    }
    
    // List all tables
    const { data: tableData, error: tablesError } = await supabase
      .rpc('get_tables');
      
    if (tablesError) {
      return NextResponse.json(
        { success: false, message: 'Error fetching tables: ' + tablesError.message },
        { status: 500 }
      );
    }
    
    // Try to introspect the tickets table specifically
    const { data: ticketsInfo, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(1);
      
    // Check if we can create a ticket directly
    const testReference = `test_${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('tickets')
      .insert([
        {
          event_id: '1', // Test ID
          customer_email: 'test@example.com',
          customer_name: 'Test User',
          ticket_type: 'Test Ticket',
          amount: 0,
          reference: testReference,
          status: 'test',
          purchase_date: new Date().toISOString(),
          is_free: true
        }
      ]);
    
    // Return the debug information
    return NextResponse.json({
      success: true,
      supabaseInitialized: !!supabase,
      tables: tableData || [],
      ticketsTableExists: !ticketsError || ticketsError.code !== 'PGRST116',
      ticketsData: ticketsInfo,
      ticketsError: ticketsError ? ticketsError.message : null,
      insertTest: {
        success: !insertError,
        error: insertError ? insertError.message : null,
        data: insertData
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error during debug: ' + error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 