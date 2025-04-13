'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function TicketsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventId, setEventId] = useState(null);

  // Safely get event ID from search params
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      setEventId(searchParams.get('event'));
    }
  }, [searchParams]);

  const fetchTickets = useCallback(async () => {
    if (!user || !eventId) return;
    
    try {
      // Fetch event details first
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          event_images (*),
          users!events_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch tickets for this event and user
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_tiers (*)
        `)
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Could not load tickets');
    } finally {
      setLoading(false);
    }
  }, [user, eventId]);

  useEffect(() => {
    if (user && eventId && typeof window !== 'undefined') {
      fetchTickets();
    }
  }, [user, eventId, fetchTickets]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error loading tickets</h1>
          <Link href="/" className="text-pink-500 hover:text-pink-600">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = event?.event_images?.find(img => img.is_cover)?.image_url || '/placeholder-event.jpg';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-900 to-pink-600 text-white">
            <h1 className="text-2xl font-bold mb-2">Thank you for your purchase!</h1>
            <p>Your tickets have been confirmed and sent to your email.</p>
          </div>

          {/* Event Details */}
          <div className="p-6 border-b">
            <div className="flex items-start gap-6">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={coverImage}
                  alt={event?.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">{event?.name}</h2>
                <div className="flex items-center gap-4 text-gray-600 mb-2">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(event?.event_date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{event?.start_time}</span>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p>{event?.address}</p>
                    <p>{event?.city}, {event?.state}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Tickets</h3>
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:border-pink-500 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{ticket.ticket_tiers.name}</h4>
                      <p className="text-sm text-gray-600">{ticket.ticket_tiers.description}</p>
                      <p className="text-sm text-gray-500 mt-2">Ticket Code: {ticket.ticket_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₦{ticket.price_paid}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 flex justify-between items-center">
            <Link 
              href={`/events/${event?.id}`}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Back to Event
            </Link>
            <button 
              onClick={() => window.print()}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
            >
              Print Tickets
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Main component with suspense boundary
export default function TicketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    }>
      <TicketsContent />
    </Suspense>
  );
} 