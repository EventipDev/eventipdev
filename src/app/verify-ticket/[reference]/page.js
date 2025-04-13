'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyTicket() {
  const { reference } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verified, error

  useEffect(() => {
    const verifyTicket = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/verify-ticket?reference=${reference}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to verify ticket');
        }

        setTicket(result.data);
        setVerificationStatus('verified');
      } catch (err) {
        console.error('Error verifying ticket:', err);
        setError(err.message || 'Failed to verify ticket');
        setVerificationStatus('error');
      } finally {
        setLoading(false);
      }
    };

    if (reference) {
      verifyTicket();
    }
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying Ticket</h2>
          <p className="text-gray-600">Please wait while we verify this ticket...</p>
        </div>
      </div>
    );
  }

  if (error || verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Invalid Ticket</h1>
          <p className="text-gray-600 text-center mb-6">{error || 'This ticket could not be verified.'}</p>
          <div className="text-center">
            <Link href="/" className="inline-block px-6 py-3 bg-[#0077B6] text-white font-medium rounded-md hover:bg-[#03045E] transition-colors">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format the date
  const purchaseDate = ticket?.purchase_date ? new Date(ticket.purchase_date) : null;
  const formattedPurchaseDate = purchaseDate ? 
    purchaseDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'Date not available';

  // Format the event date
  const eventDate = ticket?.event?.date ? new Date(ticket.event.date) : null;
  const formattedEventDate = eventDate ? 
    eventDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'Date not available';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Verification Header */}
          <div className="bg-[#0077B6] p-6 text-white text-center">
            <div className="mb-4">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Ticket Verified</h1>
            <p className="opacity-90">This is a valid ticket</p>
          </div>
          
          {/* Ticket Details */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Event Details</h2>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">{ticket.event?.title || 'Event Title Not Available'}</h3>
                <p className="text-gray-600 mb-1">{formattedEventDate}</p>
                <p className="text-gray-600 mb-1">{ticket.event?.time || 'Time not available'}</p>
                <p className="text-gray-600">{ticket.event?.location || 'Location not available'}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ticket Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Ticket Type</span>
                  <span className="font-medium">{ticket.ticket_type || 'Standard'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Ticket Price</span>
                  <span className="font-medium">
                    {ticket.is_free || ticket.amount === 0 ? 
                      'Free' : 
                      `₦${ticket.amount?.toLocaleString() || '0'}`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Attendee</span>
                  <span className="font-medium truncate max-w-[200px]">{ticket.customer_name || ticket.customer_email}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium">{ticket.reference}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Purchase Date</span>
                  <span className="font-medium">{formattedPurchaseDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium inline-flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {ticket.status === 'completed' ? 'Valid' : ticket.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Verification Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Verified at {new Date().toLocaleTimeString()} on {new Date().toLocaleDateString()}</p>
              <Link 
                href="/"
                className="inline-block px-6 py-2 bg-[#0077B6] text-white text-sm font-medium rounded-md hover:bg-[#03045E] transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 