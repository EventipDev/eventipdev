'use server';

import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(request) {
  try {
    const body = await request.json();
    const { reference, user_id, event_id } = body;
    
    if (!reference) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment reference is required' 
      }, { status: 400 });
    }
    
    // Verify the payment with Paystack
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Paystack secret key is not configured' 
      }, { status: 500 });
    }
    
    // Verify the transaction using Paystack API
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const paystackData = await verifyResponse.json();
    
    if (!verifyResponse.ok || !paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment verification failed', 
        details: paystackData.message || 'Unknown error'
      }, { status: 400 });
    }
    
    // Payment was successful - record in database
    const { data: transaction, error: transactionError } = await supabase
      .from('private_event_fees')
      .insert([{
        user_id: user_id,
        event_id: event_id,
        reference: reference,
        amount: 10000, // 10,000 Naira
        status: 'completed',
        payment_data: paystackData.data
      }])
      .select();
    
    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error recording transaction', 
        details: transactionError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment verified and recorded successfully',
      data: transaction[0]
    });
    
  } catch (error) {
    console.error('Error processing payment verification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred during payment verification', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const userId = searchParams.get('user_id');
    
    if (!eventId && !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID or User ID is required' 
      }, { status: 400 });
    }
    
    let query = supabase.from('private_event_fees').select('*');
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Error fetching payment records', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error fetching payment records:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred while fetching payment records', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment reference is required' 
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { event_id } = body;
    
    if (!event_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }
    
    // Update the payment record with the event ID
    const { data, error } = await supabase
      .from('private_event_fees')
      .update({ event_id })
      .eq('reference', reference)
      .select();
    
    if (error) {
      console.error('Error updating payment record:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error updating payment record', 
        details: error.message 
      }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment record not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment record updated successfully',
      data: data[0]
    });
    
  } catch (error) {
    console.error('Error updating payment record:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred while updating payment record', 
      details: error.message 
    }, { status: 500 });
  }
} 