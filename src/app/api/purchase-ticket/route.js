import { NextResponse } from 'next/server';
import supabase from '../../lib/supabase';

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { eventId, quantity = 1, buyerInfo } = body;
    
    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Event ID is required' 
      }, { status: 400 });
    }
    
    // Get current event data
    const { data: event, error: fetchError } = await supabase
      .from('private_events')
      .select('quantity, quantity_sold, is_paid, price')
      .eq('id', eventId)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch event details',
        error: fetchError.message
      }, { status: 404 });
    }
    
    // Check if tickets are available
    const availableTickets = event.quantity - (event.quantity_sold || 0);
    
    if (availableTickets < quantity) {
      return NextResponse.json({ 
        success: false, 
        message: `Only ${availableTickets} tickets available`
      }, { status: 400 });
    }
    
    // For a real app, here you would:
    // 1. Process payment if event is paid
    // 2. Create ticket records in a tickets table
    // 3. Send confirmation emails, etc.
    
    // Update the quantity_sold field
    const newQuantitySold = (event.quantity_sold || 0) + quantity;
    
    const { error: updateError } = await supabase
      .from('private_events')
      .update({ quantity_sold: newQuantitySold })
      .eq('id', eventId);
    
    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update ticket count',
        error: updateError.message
      }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: `Successfully purchased ${quantity} ticket(s)`,
      ticketsRemaining: event.quantity - newQuantitySold,
      ticketDetails: {
        eventId,
        quantity,
        totalPrice: event.is_paid ? (event.price * quantity) : 0,
        isPaid: event.is_paid
      }
    });
    
  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error while processing ticket purchase',
      error: error.message
    }, { status: 500 });
  }
} 