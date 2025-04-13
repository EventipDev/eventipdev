'use server';

import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { initiatePaystackRefund } from '../../../lib/paymentUtils';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Extract ticket ID and direct transaction ID if provided
    const { ticketId, transaction_id, amount, reason, event_id } = body;
    
    // If we have a transaction_id directly, process as a direct refund
    if (transaction_id) {
      console.log('Processing direct refund for transaction:', transaction_id);
      
      // Process the refund directly with Paystack
      const refundResult = await initiatePaystackRefund(
        transaction_id,
        amount ? parseFloat(amount) : undefined,
        reason || 'Event cancelled by organizer'
      );
      
      if (!refundResult.success) {
        return NextResponse.json({ 
          success: false, 
          error: refundResult.error 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        paystackReference: refundResult.paystackReference,
        message: 'Refund processed successfully'
      });
    }
    
    // Proceed with ticket-based refund
    if (!ticketId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameter: ticketId or transaction_id' 
      }, { status: 400 });
    }
    
    console.log('Processing refund for ticket:', ticketId);
    
    // First try to find in private_event_tickets
    let { data: ticket, error: ticketError } = await supabase
      .from('private_event_tickets')
      .select('*, private_events(*)')
      .eq('id', ticketId)
      .single();
    
    let tableName = 'private_event_tickets';
    
    // If not found in private_event_tickets, try regular tickets
    if (ticketError || !ticket) {
      console.log('Ticket not found in private_event_tickets, checking regular tickets...');
      
      const { data: regularTicket, error: regularTicketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (regularTicketError || !regularTicket) {
        console.log('Checking paid_tickets table as last resort...');
        
        const { data: paidTicket, error: paidTicketError } = await supabase
          .from('paid_tickets')
          .select('*')
          .eq('id', ticketId)
          .single();
          
        if (paidTicketError || !paidTicket) {
          console.error('Ticket not found in any ticket table:', ticketId);
          return NextResponse.json({ 
            success: false, 
            error: 'Ticket not found in any table' 
          }, { status: 404 });
        }
        
        ticket = paidTicket;
        tableName = 'paid_tickets';
      } else {
        ticket = regularTicket;
        tableName = 'tickets';
      }
    }
    
    // Check if ticket is eligible for refund
    if (ticket.status === 'refunded') {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticket has already been refunded' 
      }, { status: 400 });
    }
    
    // Check if ticket was paid
    const isPaid = ticket.is_paid || parseFloat(ticket.price_paid) > 0;
    if (!isPaid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticket was not paid and cannot be refunded' 
      }, { status: 400 });
    }
    
    // Check if this is a private event ticket
    const isPrivateEvent = tableName === 'private_event_tickets';
    
    // Get the refund amount - only refund the original ticket price (without processing fees)
    let refundAmount = parseFloat(ticket.price_paid);
    
    // Note: For both private and regular events, we now store the full original price
    // in price_paid, and we only want to refund this original amount, not any fees
    
    // Check for a valid payment reference - needed for Paystack refund
    const paymentRef = ticket.payment_reference || ticket.transaction_id || ticket.reference;
    if (!paymentRef) {
      // If no payment reference, mark as manual refund required
      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          ticket_id: ticket.id,
          event_id: ticket.event_id,
          amount: refundAmount,
          payment_reference: 'manual-refund',
          reason: reason || 'Event cancelled by organizer',
          status: 'manual_required',
          buyer_email: ticket.buyer_email || ticket.customer_email,
          buyer_name: ticket.buyer_name || ticket.customer_name,
          notes: 'No payment reference found. Manual refund required. Refund only the original ticket price (excluding processing fees).'
        })
        .select()
        .single();
      
      if (refundError) {
        console.error('Error recording refund:', refundError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to record refund' 
        }, { status: 500 });
      }
      
      // Update ticket status
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ status: 'manual_refund_required' })
        .eq('id', ticket.id);
      
      if (updateError) {
        console.error(`Error updating ${tableName} status:`, updateError);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to update ${tableName} status` 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        refund,
        manual: true,
        message: 'Ticket marked for manual refund due to missing payment reference'
      });
    }
    
    // For both private and regular event tickets, we store the original amount in price_paid,
    // and we only want to refund this original amount, not any additional processing fees
    console.log(`Processing refund for ${isPrivateEvent ? 'private event' : 'regular'} ticket: ${ticketId}`);
    console.log(`Refund amount: ${refundAmount}`);
    
    // Continue with normal Paystack refund if we have a payment reference
    console.log(`Initiating Paystack refund for ${tableName} with reference:`, paymentRef);
    
    // Calculate refund amount (keep 3% as Paystack fee)
    const originalAmount = parseFloat(ticket.price_paid) || 0;
    // Use the provided amount if available, otherwise calculate 97% of original
    const finalRefundAmount = amount !== undefined ? parseFloat(amount) : (originalAmount * 0.97);
    
    // Add quantity information to the reason if available
    const ticketQuantity = ticket.quantity || 1;
    const refundReason = ticketQuantity > 1 
      ? `${reason} (Refunding ${ticketQuantity} tickets minus 3% fee)`
      : reason;
    
    console.log(`Refunding ${finalRefundAmount.toFixed(2)} of ${originalAmount} (keeping 3% fee), quantity: ${ticketQuantity}`);
    
    const refundResult = await initiatePaystackRefund(
      paymentRef,
      finalRefundAmount,
      refundReason
    );
    
    if (!refundResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: refundResult.error 
      }, { status: 500 });
    }
    
    // Record refund in database
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        amount: finalRefundAmount,
        payment_reference: paymentRef,
        paystack_refund_reference: refundResult.paystackReference,
        paystack_response: refundResult.paystackResponse,
        reason: refundReason,
        status: 'processed',
        buyer_email: ticket.buyer_email || ticket.customer_email,
        buyer_name: ticket.buyer_name || ticket.customer_name,
        notes: 'Refunded the original ticket price minus 3% processing fee'
      })
      .select()
      .single();
    
    if (refundError) {
      console.error('Error recording refund:', refundError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to record refund' 
      }, { status: 500 });
    }
    
    // Update ticket status to refunded
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ status: 'refunded' })
      .eq('id', ticket.id);
    
    if (updateError) {
      console.error(`Error updating ${tableName} status:`, updateError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to update ${tableName} status` 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      refund,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Error in refund API:', error);
    return NextResponse.json({ 
        success: false,
        error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const refundId = searchParams.get('id');
    const ticketId = searchParams.get('ticketId');
    
    if (!refundId && !ticketId) {
      return NextResponse.json({
        success: false, 
        error: 'Refund ID or Ticket ID is required'
      }, { status: 400 });
    }
    
    let query = supabase.from('refunds').select('*');
    
    if (refundId) {
      query = query.eq('id', refundId);
    } else if (ticketId) {
      query = query.eq('ticket_id', ticketId);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching refund:', error);
      return NextResponse.json({
        success: false, 
        error: 'Failed to fetch refund details'
      }, { status: 500 });
    }
    
    return NextResponse.json({
        success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching refund:', error);
    return NextResponse.json({
        success: false,
        error: error.message || 'Internal server error'
    }, { status: 500 });
  }
} 