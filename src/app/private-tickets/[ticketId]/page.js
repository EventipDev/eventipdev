'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../../lib/supabaseClient';

// This is a client component that displays a private event ticket
export default function PrivateTicketPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticketId) return;
    
    const fetchTicket = async () => {
      try {
        setLoading(true);
        console.log("Fetching ticket with ID:", ticketId);
        
        // Query the private_event_tickets table using the ticketId
        const { data, error } = await supabase
          .from('private_event_tickets')
          .select('*')
          .eq('id', ticketId)
          .single();
        
        if (error) {
          console.error("Supabase error:", error);
          throw new Error('Ticket not found or has been removed');
        }
        
        if (!data) {
          throw new Error('Ticket not found');
        }
        
        console.log("Ticket data received:", data);
        setTicket(data);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setError(error.message || 'An error occurred while fetching the ticket');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticketId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
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
  
  // Generate QR code data
  const generateQRData = () => {
    if (!ticket) return '';
    
    const eventData = ticket.event_data;
    return JSON.stringify({
      ticketId: ticket.id,
      ticketCode: ticket.ticket_code,
      reference: ticket.reference,
      eventName: eventData.event_name,
      ticketHolder: ticket.buyer_name,
      customerEmail: ticket.customer_email,
      quantity: ticket.quantity,
      isPaid: ticket.is_paid,
      status: ticket.status,
      ticketType: ticket.ticket_type || 'Standard Ticket'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ticket Not Found</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">This ticket is no longer available.</p>
          <Link href="/" className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const eventData = ticket.event_data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Modern Navigation Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
              Ticket Confirmed
            </span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden mb-8">
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">{eventData.event_name}</h1>
                  <p className="text-indigo-100">Private Event Ticket</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {ticket.is_paid ? 'Paid Ticket' : 'Free Ticket'}
                </div>
              </div>
            </div>
            
            {/* Ticket Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Event Info */}
                <div className="md:col-span-2 space-y-6">
                  {/* Event Cover Image */}
                  {eventData.cover_image_url && (
                    <div className="rounded-lg overflow-hidden">
                      <Image
                        src={eventData.cover_image_url}
                        alt={eventData.event_name}
                        width={500}
                        height={280}
                        className="object-cover w-full"
                      />
                    </div>
                  )}
                  
                  {/* Event Date & Time */}
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">Date & Time</h2>
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div className="font-medium text-slate-800">
                          {formatDate(eventData.event_start_date)}
                          {eventData.event_end_date && eventData.event_end_date !== eventData.event_start_date && (
                            <> - {formatDate(eventData.event_end_date)}</>
                          )}
                        </div>
                        <div className="text-slate-600">
                          {formatTime(eventData.start_time)} - {formatTime(eventData.end_time)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">Location</h2>
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-slate-800">{eventData.address || 'Not specified'}</div>
                        {(eventData.city || eventData.state || eventData.country) && (
                          <div className="text-slate-600">
                            {[
                              eventData.city,
                              eventData.state,
                              eventData.country
                            ].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ticket Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">Ticket Information</h2>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ticket Holder:</span>
                        <span className="font-medium text-slate-800">{ticket.buyer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Buyer Email:</span>
                        <span className="font-medium text-slate-800">{ticket.buyer_email}</span>
                      </div>
                      {ticket.customer_email && ticket.customer_email !== ticket.buyer_email && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Attendee Email:</span>
                          <span className="font-medium text-slate-800">{ticket.customer_email}</span>
                        </div>
                      )}
                      {ticket.buyer_phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Phone:</span>
                          <span className="font-medium text-slate-800">{ticket.buyer_phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ticket Code:</span>
                        <span className="font-medium text-slate-800">{ticket.ticket_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Reference:</span>
                        <span className="font-medium text-slate-800">{ticket.reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={`font-medium ${
                          ticket.status === 'active' ? 'text-green-600' : 
                          ticket.status === 'used' ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Quantity:</span>
                        <span className="font-medium text-slate-800">{ticket.quantity} ticket(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Purchase Date:</span>
                        <span className="font-medium text-slate-800">{formatDate(ticket.purchase_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Verification Code:</span>
                        <span className="font-medium text-slate-800">{ticket.id.substring(0, 6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column: QR Code */}
                <div>
                  <div className="p-6 text-center border-t border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Scan for Entry</h2>
                    <div className="bg-white p-2 rounded-lg inline-block mb-3">
                      <QRCodeSVG 
                        value={generateQRData()} 
                        size={180}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-slate-500">Present this QR code at the event entrance</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ticket Footer */}
            <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
              <p className="text-sm text-slate-500">This ticket was issued by Eventips. For any queries, please contact the event organizer.</p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.print()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Ticket
            </button>
            
            <button 
              onClick={() => {
                const mailtoLink = `mailto:?subject=My Ticket for ${eventData.event_name}&body=Hi,%0D%0A%0D%0AHere is my ticket for ${eventData.event_name}.%0D%0A%0D%0ADate: ${formatDate(eventData.event_start_date)}%0D%0ATime: ${formatTime(eventData.start_time)} - ${formatTime(eventData.end_time)}%0D%0ALocation: ${eventData.address || 'Not specified'}%0D%0A%0D%0APlease show this ticket at the entrance.%0D%0A%0D%0AThanks!`;
                window.location.href = mailtoLink;
              }}
              className="px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Ticket
            </button>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} Eventips. All rights reserved.</p>
            <p className="mt-1">This is a private event ticket. Please respect the privacy of the event.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 