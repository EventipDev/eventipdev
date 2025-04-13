'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

// Client-side only QR code component
function ClientQRCode({ value }) {
  const [isMounted, setIsMounted] = useState(false);
  const [QRCodeComponent, setQRCodeComponent] = useState(null);

  useEffect(() => {
    // Load the QR code library dynamically on the client side only
    const loadQRCode = async () => {
      try {
        const qrModule = await import('qrcode.react');
        setQRCodeComponent(() => qrModule.default || qrModule.QRCodeSVG || qrModule);
        setIsMounted(true);
      } catch (error) {
        console.error('Failed to load QR code library:', error);
      }
    };
    
    loadQRCode();
  }, []);

  // Return a placeholder until the QR code component is loaded
  if (!isMounted || !QRCodeComponent) {
    return (
      <div className="bg-white p-2 rounded-lg inline-block mb-3">
        <div style={{ width: '180px', height: '180px' }} className="bg-gray-100 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-2 rounded-lg inline-block mb-3">
      <QRCodeComponent value={value} size={180} />
    </div>
  );
}

export default function TicketPage() {
  const router = useRouter();
  const params = useParams();
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reference = params.reference;
  
  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  useEffect(() => {
    async function fetchTicketData() {
      try {
        setLoading(true);
        
        // First try to get the debug data
        if (typeof window !== 'undefined') {
          console.log('Looking up ticket with reference:', reference);
          
          // Check for paid ticket data first
          const paidTicketData = localStorage.getItem('paidTicketData');
          if (paidTicketData) {
            const parsedData = JSON.parse(paidTicketData);
            // Only use if reference matches
            if (parsedData.reference === reference) {
              console.log('Using paid ticket data from localStorage:', parsedData);
              console.log('Event link in parsed data:', parsedData.event_link);
              console.log('Online event link in parsed data:', parsedData.online_event_link);
              setTicket(parsedData);
              
              // Set event data from localStorage if available
              if (parsedData.event_title || parsedData.event_date || parsedData.event_time || parsedData.event_location) {
                setEvent({
                  title: parsedData.event_title || 'Event',
                  date: parsedData.event_date || parsedData.purchase_date,
                  time: parsedData.event_time || 'Time not available',
                  location: parsedData.event_location || 'Location not available',
                  is_online: parsedData.is_online || false,
                  event_link: parsedData.event_link || null,
                  event_type: parsedData.event_type || 'physical',
                  online_event_link: parsedData.online_event_link || null
                });
                setLoading(false);
                return;
              }
              
              try {
                // Try to fetch event info if we have the ID
                if (parsedData.event_id) {
                  const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*, is_online, event_link, event_type, online_event_link')
                    .eq('id', parsedData.event_id)
                    .maybeSingle();
                  
                  if (!eventError && eventData) {
                    console.log('Event data from database:', eventData);
                    console.log('Event link in database:', eventData.event_link);
                    console.log('Online event link in database:', eventData.online_event_link);
                    setEvent(eventData);
                  } else {
                    setEvent({
                      title: parsedData.event_title || 'Event',
                      date: parsedData.event_date || parsedData.purchase_date,
                      time: parsedData.event_time || 'Time not available',
                      location: parsedData.event_location || 'Location not available',
                      is_online: parsedData.is_online || false,
                      event_link: parsedData.event_link || null,
                      event_type: parsedData.event_type || 'physical',
                      online_event_link: parsedData.online_event_link || null
                    });
                  }
                }
              } catch (eventError) {
                console.error('Error fetching event data:', eventError);
                setEvent({
                  title: parsedData.event_title || 'Event',
                  date: parsedData.event_date || parsedData.purchase_date,
                  time: parsedData.event_time || 'Time not available',
                  location: parsedData.event_location || 'Location not available',
                  is_online: parsedData.is_online || false,
                  event_link: parsedData.event_link || null,
                  event_type: parsedData.event_type || 'physical',
                  online_event_link: parsedData.online_event_link || null
                });
              }
              
              setLoading(false);
              return;
            }
          }
          
          // Check localStorage for temp free ticket data
          const tempTicketData = localStorage.getItem('tempTicketData');
          if (tempTicketData) {
            const parsedData = JSON.parse(tempTicketData);
            // Only use if reference matches
            if (parsedData.reference === reference) {
              console.log('Using free ticket data from localStorage:', parsedData);
              
              // Set ticket data from localStorage
              setTicket(parsedData);
              
              // Set event data from localStorage if available
              if (parsedData.event_title || parsedData.event_date || parsedData.event_time || parsedData.event_location) {
                setEvent({
                  title: parsedData.event_title || 'Event',
                  date: parsedData.event_date || parsedData.purchase_date,
                  time: parsedData.event_time || 'Time not available',
                  location: parsedData.event_location || 'Location not available',
                  is_online: parsedData.is_online || false,
                  event_link: parsedData.event_link || null,
                  event_type: parsedData.event_type || 'physical',
                  online_event_link: parsedData.online_event_link || null
                });
                setLoading(false);
                return;
              }
              
              try {
                // Try to fetch event info if we have the ID
                if (parsedData.event_id) {
                  const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*, is_online, event_link, event_type, online_event_link')
                    .eq('id', parsedData.event_id)
                    .maybeSingle();
                  
                  if (!eventError && eventData) {
                    console.log('Event data from database:', eventData);
                    console.log('Event link in database:', eventData.event_link);
                    console.log('Online event link in database:', eventData.online_event_link);
                    setEvent(eventData);
                  } else {
                    setEvent({
                      title: parsedData.event_title || 'Event',
                      date: parsedData.event_date || parsedData.purchase_date,
                      time: parsedData.event_time || 'Time not available',
                      location: parsedData.event_location || 'Location not available',
                      is_online: parsedData.is_online || false,
                      event_link: parsedData.event_link || null,
                      event_type: parsedData.event_type || 'physical',
                      online_event_link: parsedData.online_event_link || null
                    });
                  }
                }
              } catch (eventError) {
                console.error('Error fetching event data:', eventError);
                setEvent({
                  title: parsedData.event_title || 'Event',
                  date: parsedData.event_date || parsedData.purchase_date,
                  time: parsedData.event_time || 'Time not available',
                  location: parsedData.event_location || 'Location not available',
                  is_online: parsedData.is_online || false,
                  event_link: parsedData.event_link || null,
                  event_type: parsedData.event_type || 'physical',
                  online_event_link: parsedData.online_event_link || null
                });
              }
              
              setLoading(false);
              return;
            }
          }
        }
        
        // If no localStorage data or reference doesn't match, fetch from database
        console.log('Fetching ticket from database with reference:', reference);
        
        // First check the paid_tickets table
        const { data: paidTicketsData, error: paidTicketError } = await supabase
          .from('paid_tickets')
          .select('*')
          .eq('reference', reference);
        
        if (paidTicketError) {
          console.error('Failed to fetch from paid_tickets table:', paidTicketError.message);
          // Don't throw error yet, try the general tickets table
        }
        
        // Check if we got any results from paid tickets table
        if (paidTicketsData && paidTicketsData.length > 0) {
          // Use the first paid ticket result
          const paidTicketData = paidTicketsData[0];
          setTicket(paidTicketData);
          
          // For paid tickets, event data is already included
          setEvent({
            title: paidTicketData.event_title || 'Event',
            date: paidTicketData.event_date || paidTicketData.purchase_date,
            time: paidTicketData.event_time || 'Time not available',
            location: paidTicketData.event_location || 'Location not available',
            is_online: paidTicketData.is_online || false,
            event_link: paidTicketData.event_link || null,
            event_type: paidTicketData.event_type || 'physical',
            online_event_link: paidTicketData.online_event_link || null
          });
          
          console.log('Loaded paid ticket data:', { 
            type: paidTicketData.ticket_type,
            price: paidTicketData.price_paid,
            attendee: paidTicketData.customer_email,
            status: paidTicketData.status
          });
          
          return;
        } 
        
        // If not found in paid_tickets, try general tickets table
        console.log('No paid ticket found, checking general tickets table');
        const { data: generalTicketsData, error: generalTicketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('ticket_code', reference);
        
        if (generalTicketError) {
          console.error('Failed to fetch from tickets table:', generalTicketError.message);
          // Don't throw error yet, try the free_tickets table
        }
        
        // Check if we got any results from general tickets table
        if (generalTicketsData && generalTicketsData.length > 0) {
          // Use the first general ticket result
          const generalTicketData = generalTicketsData[0];
          setTicket(generalTicketData);
          
          // For general tickets, we need to fetch event data
          try {
            if (generalTicketData.event_id) {
              const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*, is_online, event_link, event_type, online_event_link')
                .eq('id', generalTicketData.event_id)
                .maybeSingle();
              
              if (!eventError && eventData) {
                setEvent(eventData);
              } else {
                setEvent({
                  title: 'Event',
                  date: generalTicketData.purchase_date,
                  time: 'Time not available',
                  location: 'Location not available',
                  is_online: false,
                  event_link: null,
                  event_type: 'physical',
                  online_event_link: null
                });
              }
            }
          } catch (eventError) {
            console.error('Error fetching event data:', eventError);
            setEvent({
              title: 'Event',
              date: generalTicketData.purchase_date,
              time: 'Time not available',
              location: 'Location not available',
              is_online: false,
              event_link: null,
              event_type: 'physical',
              online_event_link: null
            });
          }
          
          console.log('Loaded general ticket data:', { 
            type: generalTicketData.ticket_type,
            price: generalTicketData.price_paid,
            attendee: generalTicketData.customer_email,
            status: generalTicketData.status
          });
          
          return;
        }
        
        // If not found in general tickets, try free_tickets table
        console.log('No general ticket found, checking free_tickets table');
        const { data: freeTicketsData, error: freeTicketError } = await supabase
          .from('free_tickets')
          .select('*')
          .eq('reference', reference);
        
        if (freeTicketError) {
          console.error('Failed to fetch from free_tickets table:', freeTicketError.message);
          throw new Error('Failed to fetch ticket from both tables');
        }
        
        // Check if we got any results from free tickets table
        if (freeTicketsData && freeTicketsData.length > 0) {
          // Use the first free ticket result
          const freeTicketData = freeTicketsData[0];
          setTicket(freeTicketData);
          
          // For free tickets, event data is already included
          setEvent({
            title: freeTicketData.event_title || 'Event',
            date: freeTicketData.event_date || freeTicketData.purchase_date,
            time: freeTicketData.event_time || 'Time not available',
            location: freeTicketData.event_location || 'Location not available',
            is_online: freeTicketData.is_online || false,
            event_link: freeTicketData.event_link || null,
            event_type: freeTicketData.event_type || 'physical',
            online_event_link: freeTicketData.online_event_link || null
          });
          
          console.log('Loaded free ticket data:', { 
            type: freeTicketData.ticket_type,
            price: freeTicketData.price_paid,
            attendee: freeTicketData.customer_email,
            status: freeTicketData.status
          });
          
          return;
        }
        
        // If we get here, no ticket was found in either table
        console.log('No ticket found in either table with reference:', reference);
        throw new Error('Ticket not found in any table');
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError(err.message);
        
        // Last resort: check localStorage even if reference doesn't match
        if (typeof window !== 'undefined') {
          // Try paid ticket data first
          const paidTicketData = localStorage.getItem('paidTicketData');
          if (paidTicketData) {
            const parsedData = JSON.parse(paidTicketData);
            console.log('Using fallback paid ticket data from localStorage');
            setTicket(parsedData);
            setEvent({
              title: parsedData.event_title || 'Event',
              date: parsedData.event_date || parsedData.purchase_date,
              time: parsedData.event_time || 'Time not available',
              location: parsedData.event_location || 'Location not available',
              is_online: parsedData.is_online || false,
              event_link: parsedData.event_link || null,
              event_type: parsedData.event_type || 'physical',
              online_event_link: parsedData.online_event_link || null
            });
            setError(null);
            return;
          }
          
          // Then try free ticket data
          const tempTicketData = localStorage.getItem('tempTicketData');
          if (tempTicketData) {
            const parsedData = JSON.parse(tempTicketData);
            console.log('Using fallback free ticket data from localStorage');
            setTicket(parsedData);
            setEvent({
              title: parsedData.event_title || 'Event',
              date: parsedData.event_date || parsedData.purchase_date,
              time: parsedData.event_time || 'Time not available',
              location: parsedData.event_location || 'Location not available',
              is_online: parsedData.is_online || false,
              event_link: parsedData.event_link || null,
              event_type: parsedData.event_type || 'physical',
              online_event_link: parsedData.online_event_link || null
            });
            setError(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (reference) {
      fetchTicketData();
    }
  }, [reference]);

  // Additional effect to fetch event data directly if we have an event_id
  useEffect(() => {
    async function fetchEventDirectly() {
      if (ticket?.event_id) {
        console.log("Fetching event data directly for event ID:", ticket.event_id);
        try {
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*, event_link, online_event_link')
            .eq('id', ticket.event_id)
            .single();
          
          if (eventError) {
            console.error("Error fetching event:", eventError);
            return;
          }
          
          if (eventData) {
            console.log("Found event data directly:", eventData);
            console.log("Event link from direct query:", eventData.event_link);
            console.log("Online event link from direct query:", eventData.online_event_link);
            
            // Update the event state with this data
            setEvent(prev => ({
              ...prev,
              ...eventData,
              event_link: eventData.event_link || prev?.event_link || '',
              online_event_link: eventData.online_event_link || prev?.online_event_link || ''
            }));
          }
        } catch (error) {
          console.error("Error in direct event fetch:", error);
        }
      }
    }
    
    if (ticket) {
      fetchEventDirectly();
    }
  }, [ticket]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Ticket Not Found</h1>
          <p className="text-gray-600 mb-4">{error || "We couldn't find the ticket you're looking for."}</p>
          <Link 
            href="/my-tickets"
            className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  // Format the date from the event or ticket
  const eventDate = event?.date ? new Date(event.date) : 
                    ticket.purchase_date ? new Date(ticket.purchase_date) : new Date();
  
  const formattedDate = formatDate(eventDate);
  
  // Generate QR code data
  const generateQRData = () => {
    if (!ticket || !event) return '';
    
    // Format time for display
    const formatTime = (timeString) => {
      if (!timeString) return 'Not specified';
      try {
        // Handle HH:MM format
        const parts = timeString.split(':');
        if (parts.length === 2) {
          const hours = parseInt(parts[0], 10);
          const minutes = parts[1];
          const period = hours >= 12 ? 'PM' : 'AM';
          const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
          return `${formattedHours}:${minutes} ${period}`;
        }
        return timeString;
      } catch (e) {
        return timeString;
      }
    };
    
    // Find the event link from all possible sources
    const getEventLink = () => {
      if (event?.event_link && event.event_link !== '') {
        return event.event_link;
      } 
      if (event?.online_event_link && event.online_event_link !== '') {
        return event.online_event_link;
      }
      if (ticket?.event_link && ticket.event_link !== '') {
        return ticket.event_link;
      }
      if (ticket?.online_event_link && ticket.online_event_link !== '') {
        return ticket.online_event_link;
      }
      return '';
    };
    
    // Get the event link
    const eventLink = getEventLink();
    
    // Create a plain text version with line breaks instead of JSON
    return `EVENT: ${event.title || 'Event'}
DESCRIPTION: ${event.description?.substring(0, 100)}${event.description?.length > 100 ? '...' : ''}
DATE: ${formatDate(event.date)}
TIME: ${formatTime(event.time || event.start_time)} - ${formatTime(event.end_time)}
LOCATION: ${(event.is_online || event.event_type === 'online') ? 'Online Event' : (event.location || event.venue || 'Not specified')}
${eventLink ? `EVENT LINK: ${eventLink}` : ''}
TICKET TYPE: ${ticket.ticket_type || 'Standard Ticket'}
TICKET HOLDER: ${ticket.customer_name || ticket.buyer_name || ticket.customer_email || 'Not specified'}
TICKET CODE: ${ticket.ticket_code || ticket.reference}
REFERENCE: ${ticket.reference}
STATUS: ${(ticket.status || 'Valid').toUpperCase()}
QUANTITY: ${ticket.quantity || 1} ticket(s)
CONTACT EMAIL: ${ticket.customer_email || ticket.buyer_email}
VERIFICATION: ${ticket.id ? ticket.id.substring(0, 6).toUpperCase() : reference.substring(0, 6).toUpperCase()}`;
  };

  // Generate QR code URL with complete ticket details
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(generateQRData())}&size=200x200`;

  // Use customer_name from ticket if available, or format from email
  const attendeeName = ticket.customer_name || ticket.customer_email;
  
  // Helper function to get the best available event link
  const getBestEventLink = () => {
    if (event?.event_link && event.event_link !== '') {
      return event.event_link;
    } 
    if (event?.online_event_link && event.online_event_link !== '') {
      return event.online_event_link;
    }
    if (ticket?.event_link && ticket.event_link !== '') {
      return ticket.event_link;
    }
    if (ticket?.online_event_link && ticket.online_event_link !== '') {
      return ticket.online_event_link;
    }
    return 'No link available';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-blue-600 text-white p-6 text-center">
            <h1 className="text-2xl font-bold">Event Ticket</h1>
            <p className="mt-2">Reference: {ticket.reference}</p>
          </div>
          
          {/* Event Info */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">{event?.title || 'Event'}</h2>
            <p className="text-gray-600">
              {formattedDate}<br />
              {event?.time || 'Time not available'}<br />
              {event?.location || 'Location not available'}
            </p>
            
            {/* QR Code */}
            <div className="flex justify-center my-6">
              <div className="text-center">
                <ClientQRCode value={generateQRData()} />
                <p className="text-xs text-gray-500 mt-2">Scan for verification</p>
              </div>
            </div>
            
            {/* Ticket Details */}
            <div className="border-t border-b border-gray-200 py-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Ticket Type</p>
                  <p className="font-medium">{ticket.ticket_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">
                    {String(ticket.price_paid) === '0' || String(ticket.price_paid) === '0.00' ? 
                      'Free' : 
                      `₦${ticket.price_paid}`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Attendee</p>
                  <p className="font-medium">{attendeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {ticket.status === 'active' ? 'Confirmed' : ticket.status}
                  </p>
                </div>
                {/* Event Link */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Event Link</p>
                  <p className="font-medium break-all">
                    {getBestEventLink()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <p className="text-sm text-gray-600 mb-6">
              Bring this ticket (printed or on your phone) to the event<br />
              For support: support@eventips.com
            </p>
            
            {/* Back Button */}
            <div className="text-center">
              <Link 
                href="/my-tickets"
                className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to My Tickets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for fetching event data
async function fetchEventData(ticketData) {
  if (ticketData.event_id) {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*, is_online, event_link, event_type, online_event_link')
      .eq('id', ticketData.event_id)
      .maybeSingle();
    
    if (!eventError && eventData) {
      setEvent(eventData);
    } else {
      // Create a minimal event object from ticket data
      setEvent({
        title: 'Event',
        date: ticketData.purchase_date,
        time: 'Time not available',
        location: 'Location not available',
        is_online: false,
        event_link: null,
        event_type: 'physical',
        online_event_link: null
      });
    }
  }
}