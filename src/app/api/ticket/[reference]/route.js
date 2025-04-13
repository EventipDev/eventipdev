import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(request, { params }) {
  try {
    const { reference } = params;
    
    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Reference is required' },
        { status: 400 }
      );
    }
    
    // First try to get the ticket from Supabase
    let ticket = null;
    let event = null;
    
    try {
      // Query ticket from database with better error logging
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('reference', reference)
        .single();
        
      if (ticketError) {
        console.error('Error fetching ticket from database:', ticketError);
      }
        
      if (ticketData) {
        ticket = ticketData;
        
        // Try to fetch event data
        if (ticket.event_id) {
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', ticket.event_id)
            .single();
            
          if (eventError) {
            console.error('Error fetching event data:', eventError);
          }
            
          if (eventData) {
            event = eventData;
          } else {
            console.warn('Event not found for event_id:', ticket.event_id);
          }
        }
      }
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError);
    }
    
    // If not found in Supabase, try to get from local storage
    if (!ticket) {
      try {
        const dataDirectory = path.join(process.cwd(), 'public', 'data');
        const ticketsFile = path.join(dataDirectory, 'tickets.json');
        
        const fileContent = await fs.readFile(ticketsFile, 'utf8');
        const tickets = JSON.parse(fileContent);
        
        ticket = tickets.find(t => t.reference === reference);
        
        if (ticket) {
          console.log('Ticket found in local JSON file');
          
          // If ticket found in JSON, try to get event data from events.json if it exists
          try {
            const eventsFile = path.join(dataDirectory, 'events.json');
            const eventsContent = await fs.readFile(eventsFile, 'utf8');
            const events = JSON.parse(eventsContent);
            
            event = events.find(e => e.id === ticket.event_id);
          } catch (eventError) {
            console.warn('Could not read event from file:', eventError);
          }
        }
      } catch (fsError) {
        console.warn('Could not read ticket from file:', fsError);
      }
    }
    
    // If still not found, return error in production or mock data in development
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Format and return the response
    return NextResponse.json({
      success: true,
      data: {
        ticket: ticket,
        event: event
      }
    });
    
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ticket: ' + error.message },
      { status: 500 }
    );
  }
} 