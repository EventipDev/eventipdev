import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(request, { params }) {
  try {
    const eventId = params.id;
    
    if (!eventId) {
      return NextResponse.json(
        { message: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch event data with all related information
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        event_images (*),
        ticket_tiers (*),
        users!events_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', eventId)
      .single();
    
    if (error) {
      console.error('Supabase error fetching event:', error);
      return NextResponse.json(
        { message: error.message || 'Failed to retrieve event' },
        { status: 500 }
      );
    }
    
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 