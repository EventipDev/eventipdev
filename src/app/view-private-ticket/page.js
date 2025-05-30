'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'event-manager-app'
      }
    }
  }
);

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

// Enhance the DownloadTicket function for better mobile support
function DownloadQRCode({ ticket }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('png'); // Default format

  const handleDownload = async () => {
    try {
      setDownloading(true);
      console.log('Using QR code download mode');

      // Get just the QR code element
      const qrCodeElement = document.querySelector('.bg-white.p-2.rounded-lg.inline-block.mb-3');
      
      if (!qrCodeElement) {
        throw new Error('QR code element not found');
      }

      // Create a canvas element to render just the QR code
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(qrCodeElement, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      
      // Convert canvas to a data URL
      const mimeType = downloadFormat === 'png' ? 'image/png' : 'image/jpeg';
      const imageData = canvas.toDataURL(mimeType, 1.0);
      
      // Save the image
      const fileExt = downloadFormat === 'png' ? 'png' : 'jpg';
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `ticket-qr-${ticket.ticket_code}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Could not download QR code. Please take a screenshot instead.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex mb-2 gap-2 justify-center">
        <button
          type="button"
          onClick={() => setDownloadFormat('png')}
          className={`px-3 py-1 text-xs rounded ${downloadFormat === 'png' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}
        >
          PNG
        </button>
        <button
          type="button"
          onClick={() => setDownloadFormat('jpeg')}
          className={`px-3 py-1 text-xs rounded ${downloadFormat === 'jpeg' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}
        >
          JPEG
        </button>
      </div>
      
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
      >
        {downloading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Downloading...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download QR Code
          </>
        )}
      </button>
      
      <p className="text-xs text-gray-500 mt-1 text-center">
        The QR code contains all your ticket information.
      </p>
    </div>
  );
}

// Make print button more mobile friendly
function PrintTicket() {
  const [isPrinting, setIsPrinting] = useState(false);
  
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrinting(false), 1000);
    }, 300);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={isPrinting}
      className="w-full mt-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
    >
      {isPrinting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Preparing to print...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Ticket
        </>
      )}
    </button>
  );
}

// Content component that uses searchParams
function TicketContent() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('id');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticketId) {
      setError('No ticket ID provided');
      setLoading(false);
      return;
    }
    
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
    
    // Create a plain text version with line breaks instead of JSON
    return `EVENT: ${eventData.event_name}
DESCRIPTION: ${eventData.description?.substring(0, 100)}${eventData.description?.length > 100 ? '...' : ''}
DATE: ${formatDate(eventData.event_start_date)}
TIME: ${formatTime(eventData.start_time)} - ${formatTime(eventData.end_time)}
LOCATION: ${eventData.address || 'Not specified'}, ${[eventData.city, eventData.state, eventData.country].filter(Boolean).join(', ')}
TICKET HOLDER: ${ticket.buyer_name}
TICKET CODE: ${ticket.ticket_code}
REFERENCE: ${ticket.reference}
STATUS: ${ticket.status.toUpperCase()}
QUANTITY: ${ticket.quantity} ticket(s)
CONTACT EMAIL: ${ticket.customer_email || ticket.buyer_email}
VERIFICATION: ${ticket.id.substring(0, 6).toUpperCase()}`;
  };

  // Add CSS styles for print media
  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #downloadable-ticket, #downloadable-ticket * {
          visibility: visible;
        }
        #downloadable-ticket {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          border: none !important;
          box-shadow: none !important;
        }
        .no-print, .event-image, .event-image * {
          display: none !important;
        }
        /* Improve layout for print */
        #downloadable-ticket .bg-gradient-to-r {
          background: #4f46e5 !important;
          background-image: none !important;
          color: white !important;
        }
        /* Ensure QR code is clearly visible */
        .bg-white.p-2.rounded-lg.inline-block.mb-3 {
          display: block !important;
          margin: 0 auto !important;
          padding: 8px !important;
          background-color: white !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  // Rest of your existing render code for when ticket is available
  const eventData = ticket.event_data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Modern Navigation Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-10 no-print">
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
          {/* Enhanced Ticket Card with decorative elements */}
          <div id="downloadable-ticket" className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden mb-8 relative">
            {/* Decorative corner cuts for a ticket-like appearance */}
            <div className="absolute top-0 left-0 h-6 w-6 bg-slate-50 transform rotate-45 translate-x-[-50%] translate-y-[-50%]"></div>
            <div className="absolute top-0 right-0 h-6 w-6 bg-slate-50 transform rotate-45 translate-x-[50%] translate-y-[-50%]"></div>
            <div className="absolute bottom-0 left-0 h-6 w-6 bg-slate-50 transform rotate-45 translate-x-[-50%] translate-y-[50%]"></div>
            <div className="absolute bottom-0 right-0 h-6 w-6 bg-slate-50 transform rotate-45 translate-x-[50%] translate-y-[50%]"></div>
            
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">{eventData.event_name}</h1>
                  <p className="text-indigo-100">Private Event Ticket</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {ticket.is_paid ? 'Paid Ticket' : 'Free Ticket'}
                </div>
              </div>
              {/* Add a subtle pattern overlay for decoration */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAgMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            </div>
            
            {/* Add a ticket validation mark */}
            <div className="absolute top-4 right-4 z-10 no-print">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-200 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            {/* Ticket Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Event Info */}
                <div className="md:col-span-2 space-y-6">
                  {/* Event Cover Image */}
                  {eventData.cover_image_url && (
                    <div className="rounded-lg overflow-hidden event-image">
                      <Image
                        src={eventData.cover_image_url}
                        alt={eventData.event_name}
                        width={500}
                        height={280}
                        className="w-full object-cover"
                        unoptimized={!eventData.cover_image_url.startsWith('/')}
                      />
                    </div>
                  )}
                  
                  {/* Event Details */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-800">Event Details</h2>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 text-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">Date & Time</div>
                          <div className="text-sm text-slate-600">
                            {formatDate(eventData.event_start_date)}
                            <br />
                            {formatTime(eventData.start_time)} - {formatTime(eventData.end_time)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 text-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">Location</div>
                          <div className="text-sm text-slate-600">
                            {eventData.address && <div>{eventData.address}</div>}
                            <div>{[eventData.city, eventData.state, eventData.country].filter(Boolean).join(', ')}</div>
                          </div>
                        </div>
                      </div>
                      
                      {eventData.description && (
                        <div className="flex items-start">
                          <div className="mt-1 flex-shrink-0 text-indigo-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-800">Description</div>
                            <div className="text-sm text-slate-600">
                              {eventData.description}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Ticket Holder Information */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-800">Ticket Information</h2>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 text-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">Attendee</div>
                          <div className="text-sm text-slate-600">{ticket.buyer_name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 text-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">Email</div>
                          <div className="text-sm text-slate-600">{ticket.customer_email || ticket.buyer_email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 text-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">Ticket Reference</div>
                          <div className="text-sm font-mono text-slate-600">{ticket.reference}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 text-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">Ticket Code</div>
                          <div className="text-sm font-mono text-slate-600">{ticket.ticket_code}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 text-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">Status</div>
                          <div className="text-sm text-slate-600">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              {ticket.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 text-indigo-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">Ticket Type</div>
                          <div className="text-sm text-slate-600">
                            {ticket.is_paid ? 'Paid Ticket' : 'Free Ticket'}
                            {ticket.is_paid && ` (${eventData.price || ticket.price_paid})`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column: QR Code */}
                <div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Scan for Entry</h2>
                    <ClientQRCode value={generateQRData()} />
                    <p className="text-sm text-slate-500">Present this QR code at the event entrance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Instruction note */}
          <div className="text-center text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="font-medium mb-1">📱 Your Ticket is Ready!</div>
            <p className="mb-2">Download or print this ticket and present the QR code at the event entrance for validation.</p>
            <ul className="text-xs text-left space-y-1 max-w-xs mx-auto">
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-1">•</span> 
                <span>Mobile: Save to your photos and show when you arrive</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-1">•</span> 
                <span>Desktop: Print or save to your device for later</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 font-bold mr-1">•</span> 
                <span>The QR code contains your unique ticket information</span>
              </li>
            </ul>
          </div>
          
          {/* Download and Print Ticket Buttons */}
          <div className="max-w-xs mx-auto no-print">
            <DownloadQRCode ticket={ticket} />
            <PrintTicket />
          </div>
        </div>
      </main>
    </div>
  );
}

// Loading placeholder
function TicketLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Animated loading header */}
          <div className="h-20 bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse"></div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Animated loading content */}
                <div className="h-40 bg-slate-200 rounded-lg animate-pulse"></div>
                
                <div className="space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
                  <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto mb-4 animate-pulse"></div>
                  <div className="w-40 h-40 bg-slate-200 rounded-lg mx-auto mb-3 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ViewPrivateTicketPage() {
  return (
    <Suspense fallback={<TicketLoadingFallback />}>
      <TicketContent />
    </Suspense>
  );
} 