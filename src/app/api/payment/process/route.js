import { NextResponse } from 'next/server';
import { calculatePlatformFee } from '../../../../lib/paymentUtils';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      amount, 
      user_id, 
      event_id, 
      payment_method, 
      ticket_type,
      fee_percentage = 5 // Default platform fee percentage
    } = body;
    
    // Validate required parameters
    if (!amount || !user_id || !event_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: amount, user_id, event_id' },
        { status: 400 }
      );
    }
    
    // Calculate platform fee
    console.log('Calculating platform fee for amount:', amount);
    const feeCalculation = calculatePlatformFee(amount);
    console.log('Fee calculation result:', feeCalculation);
    
    // In a real implementation, you would call the Paystack API here
    // This is a placeholder for demonstration
    const paystackReference = `pay_${Math.random().toString(36).substring(2, 12)}`;
    
    // Create the transaction record with platform fee details
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id,
        event_id,
        amount: feeCalculation.originalAmount.toString(),
        platform_fee: feeCalculation.feeAmount.toString(),
        organizer_amount: feeCalculation.amountAfterFee.toString(),
        fee_percentage: feeCalculation.feePercentage,
        status: 'completed',
        payment_method: payment_method || 'card',
        ticket_type: ticket_type || 'regular',
        reference: paystackReference
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Update ticket inventory if applicable
    if (ticket_type) {
      try {
        const { error: ticketError } = await supabase.rpc('update_ticket_inventory', {
          p_event_id: event_id,
          p_ticket_type: ticket_type,
          p_quantity: 1 // Assuming 1 ticket per transaction for simplicity
        });
        
        if (ticketError) {
          console.error('Error updating ticket inventory:', ticketError);
        }
      } catch (ticketError) {
        console.error('Error calling update_ticket_inventory:', ticketError);
      }
    }
    
    // Create notification for the event organizer
    try {
      // Get the event organizer ID
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', event_id)
        .single();
        
      if (!eventError && event && event.organizer_id) {
        await supabase.rpc('create_notification', {
          p_title: 'New Ticket Sale',
          p_message: `New ticket sold for $${amount}. Platform fee: $${feeCalculation.feeAmount.toFixed(2)}. Customer pays: $${feeCalculation.customerPays.toFixed(2)}. You receive: $${amount.toFixed(2)}.`,
          p_source: 'payment',
          p_source_id: transaction.id
        });
      }
    } catch (notifyError) {
      console.error('Error creating notification:', notifyError);
    }
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Payment processed successfully',
        transaction_id: transaction.id,
        reference: paystackReference,
        fee_details: feeCalculation
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing payment:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
} 