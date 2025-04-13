'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import supabase from '../../lib/supabase';

export default function SharedPrivateEventPage() {
  const { share_link } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        
        // Query the private_events table using the share_link
        const { data, error } = await supabase
          .from('private_events')
          .select('*')
          .eq('share_link', share_link)
          .single();
        
        if (error) {
          throw new Error('Event not found or has been removed');
        }
        
        if (!data) {
          throw new Error('Event not found');
        }
        
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
        setError(error.message || 'An error occurred while fetching the event');
      } finally {
        setLoading(false);
      }
    };
    
    if (share_link) {
      fetchEvent();
    }
  }, [share_link]);
  
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
  
  // Function to initialize PayStack payment without using the react-paystack library
  const initializePaystackPayment = () => {
    if (!buyerEmail) {
      alert('Please enter your email address');
      return;
    }
    
    if (!buyerName) {
      alert('Please enter your name');
      return;
    }
    
    setPurchaseLoading(true);
    
    // Generate a unique reference
    const reference = `PVT-${event.id}-${Date.now()}`;
    
    // Calculate the amount with 3% fee
    const baseAmount = event.price * purchaseQuantity;
    const amountWithFee = baseAmount + (event.price * 0.03); // Add 3% platform fee once per order
    const payableAmount = Math.round(amountWithFee * 100); // Convert to kobo and round
    
    // Add PayStack script dynamically if it doesn't exist
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        processPaystackPayment(reference, payableAmount);
      };
      document.body.appendChild(script);
    } else {
      processPaystackPayment(reference, payableAmount);
    }
  };
  
  // Process payment using PayStack inline
  const processPaystackPayment = (reference, amount) => {
    try {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here',
        email: buyerEmail,
        amount: amount,
        currency: 'NGN',
        ref: reference,
        firstname: buyerName.split(' ')[0],
        lastname: buyerName.split(' ').slice(1).join(' '),
        metadata: {
          eventId: event.id,
          quantity: purchaseQuantity,
          custom_fields: [
            {
              display_name: "Event Name",
              variable_name: "event_name",
              value: event.event_name
            }
          ]
        },
        onClose: () => {
          setPurchaseLoading(false);
          console.log('Payment window closed');
        },
        callback: (response) => {
          handlePaymentSuccess(response);
        }
      });
      
      handler.openIframe();
    } catch (error) {
      console.error('Error initializing PayStack:', error);
      alert('Failed to initialize payment. Please try again.');
      setPurchaseLoading(false);
    }
  };
  
  // Function to handle redirection
  const redirectToTicket = (url) => {
    console.log("Redirecting to:", url);
    // Use window.location.href for full page navigation
    window.location.href = url;
  };
  
  // Handle successful payment response
  const handlePaymentSuccess = async (response) => {
    try {
      // Call the dedicated private event ticket purchase API
      const apiResponse = await fetch('/api/private-event-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity: purchaseQuantity,
          paymentReference: response.reference,
          buyerInfo: {
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone
          }
        }),
      });
      
      const data = await apiResponse.json();
      
      if (!apiResponse.ok) {
        throw new Error(data.message || 'Failed to complete ticket purchase');
      }
      
      console.log("Purchase successful, received data:", data);
      
      // Redirect to the ticket page
      if (data.redirectUrl) {
        redirectToTicket(data.redirectUrl);
        return;
      }
      
      // Fallback if no redirect URL is returned
      // Update the local event data to reflect the new ticket count
      setEvent({
        ...event,
        quantity_sold: (event.quantity_sold || 0) + purchaseQuantity
      });
      
      // Show success message and reset form
      setPurchaseSuccess(true);
      setShowPaymentForm(false);
      setTimeout(() => setPurchaseSuccess(false), 5000); // Hide after 5 seconds
      
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  // Handle ticket purchase button click
  const handlePurchaseTicket = async () => {
    try {
      setPurchaseLoading(true);
      
      // Simple validation
      if (purchaseQuantity < 1) {
        alert('Please select at least 1 ticket');
        return;
      }
      
      const availableTickets = event.quantity - (event.quantity_sold || 0);
      if (purchaseQuantity > availableTickets) {
        alert(`Only ${availableTickets} tickets available`);
        return;
      }
      
      // For free events, skip payment and process directly
      if (!event.is_paid) {
        // Show payment form to collect contact info even for free events
        setShowPaymentForm(true);
      } else {
        // For paid events, show the payment form
        setShowPaymentForm(true);
      }
      
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  // Process free ticket
  const processFreeTicket = async () => {
    try {
      if (!buyerEmail || !buyerName || !buyerPhone) {
        alert('Please fill in all required fields');
        return;
      }
      
      setPurchaseLoading(true);
      
      const response = await fetch('/api/private-event-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity: purchaseQuantity,
          buyerInfo: {
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone
          }
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to purchase ticket');
      }
      
      console.log("Free ticket purchase successful, received data:", data);
      
      // Redirect to the ticket page
      if (data.redirectUrl) {
        redirectToTicket(data.redirectUrl);
        return;
      }
      
      // Fallback if no redirect URL is returned
      // Update the local event data
      setEvent({
        ...event,
        quantity_sold: (event.quantity_sold || 0) + purchaseQuantity
      });
      
      // Show success message
      setPurchaseSuccess(true);
      setShowPaymentForm(false);
      setTimeout(() => setPurchaseSuccess(false), 5000);
      
    } catch (error) {
      console.error('Error purchasing free ticket:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading event details...</p>
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
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Event Not Found</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">This event is no longer available.</p>
          <Link href="/" className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Calculate tickets available
  const ticketsAvailable = event.quantity - (event.quantity_sold || 0);
  
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
              Private Event
            </span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Cover Image with Gradient Overlay */}
          <div className="relative rounded-xl overflow-hidden mb-8 shadow-xl">
            <div className="aspect-[21/9] relative">
              {event.cover_image_url ? (
                <Image
                  src={event.cover_image_url}
                  alt={event.event_name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                  </svg>
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
              
              {/* Event Title Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-3 py-1 bg-white/90 text-indigo-800 rounded-full text-sm font-medium">
                    {event.is_paid ? 'Paid Event' : 'Free Event'}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {event.event_name}
                </h1>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Event Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Date & Time Section */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Date & Time</h2>
                      <div className="text-slate-600 space-y-1 mt-1">
                        <div>
                          <span className="font-medium">
                            {formatDate(event.event_start_date)}
                            {event.event_end_date && event.event_end_date !== event.event_start_date && (
                              <> - {formatDate(event.event_end_date)}</>
                            )}
                          </span>
                        </div>
                        <div>
                          <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Location Section */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <h2 className="text-lg font-semibold text-slate-800">Location</h2>
                      <div className="text-slate-600 space-y-1 mt-1">
                        <div className="font-medium">{event.address || 'Not specified'}</div>
                        {(event.city || event.state || event.country) && (
                          <div>
                            {[
                              event.city && <span key="city">{event.city}</span>,
                              event.state && <span key="state">{event.state}</span>,
                              event.country && <span key="country">{event.country}</span>
                            ].filter(Boolean).reduce((prev, curr, i) => [
                              ...prev,
                              i > 0 && <span key={`sep-${i}`}>, </span>,
                              curr
                            ], [])}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* About Section */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">About this event</h2>
                  <div className="prose max-w-none text-slate-600">
                    <p className="whitespace-pre-line">{event.description || 'No description available.'}</p>
                  </div>
                </div>
              </div>
              
              {/* Organizer Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Organizer</h2>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                    {event.event_name ? event.event_name.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-slate-800">Event Host</p>
                    <p className="text-sm text-slate-500">Private event organizer</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column: Ticket Information */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-800">Tickets</h2>
                    {ticketsAvailable > 0 ? (
                      <p className="text-sm text-slate-500 mt-1">Secure your spot now</p>
                    ) : (
                      <p className="text-sm text-red-500 mt-1">Sold out</p>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {/* Ticket Price */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-medium text-slate-800">
                          {event.is_paid ? 'Paid Ticket' : 'Free Ticket'}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {ticketsAvailable} tickets available
                        </p>
                      </div>
                      <div className="text-xl font-bold text-indigo-600">
                        {event.is_paid ? `₦${event.price.toFixed(2)}` : 'Free'}
                      </div>
                    </div>
                    
                    {/* Ticket Quantity Selector */}
                    {ticketsAvailable > 0 && (
                      <div className="mb-6">
                        <label htmlFor="ticketQuantity" className="block text-sm font-medium text-slate-700 mb-2">
                          Select quantity
                        </label>
                        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg">
                          <button 
                            type="button"
                            className="bg-white rounded-md w-8 h-8 flex items-center justify-center border border-slate-200 shadow-sm hover:bg-slate-50"
                            onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            id="ticketQuantity"
                            min="1"
                            max={ticketsAvailable}
                            value={purchaseQuantity}
                            onChange={(e) => setPurchaseQuantity(Math.min(
                              ticketsAvailable,
                              Math.max(1, parseInt(e.target.value) || 1)
                            ))}
                            className="w-16 px-3 py-2 text-center border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                          <button 
                            type="button"
                            className="bg-white rounded-md w-8 h-8 flex items-center justify-center border border-slate-200 shadow-sm hover:bg-slate-50"
                            onClick={() => setPurchaseQuantity(Math.min(
                              ticketsAvailable,
                              purchaseQuantity + 1
                            ))}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Total Price (if paid) */}
                    {event.is_paid && ticketsAvailable > 0 && !showPaymentForm && (
                      <div className="mb-6 py-3 border-t border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700">Ticket Price</span>
                          <span className="font-bold text-indigo-600">₦{(event.price * purchaseQuantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-medium text-slate-700">Charges</span>
                          <span className="font-medium text-slate-600">₦{(event.price * 0.03).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                          <span className="font-medium text-slate-700">Total</span>
                          <span className="font-bold text-xl text-indigo-600">₦{(event.price * purchaseQuantity + event.price * 0.03).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Footnote about fees */}
                    {event.is_paid && ticketsAvailable > 0 && (
                      <div className="mt-2 text-xs text-slate-500 italic">
                        * 3% service charge is added once per order. Only the original ticket price will be recorded for the event.
                      </div>
                    )}
                    
                    {/* Payment Form - Only shown when user clicks Get Tickets for paid events */}
                    {showPaymentForm && event.is_paid && (
                      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-slate-800 mb-3">Enter Payment Details</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="buyerName" className="block text-sm font-medium text-slate-700 mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              id="buyerName"
                              value={buyerName}
                              onChange={(e) => setBuyerName(e.target.value)}
                              placeholder="John Doe"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="buyerEmail" className="block text-sm font-medium text-slate-700 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="buyerEmail"
                              value={buyerEmail}
                              onChange={(e) => setBuyerEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="buyerPhone" className="block text-sm font-medium text-slate-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="buyerPhone"
                              value={buyerPhone}
                              onChange={(e) => setBuyerPhone(e.target.value)}
                              placeholder="+234 123 456 7890"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          
                          <div className="flex justify-between mt-4">
                            <button
                              type="button"
                              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                              onClick={() => setShowPaymentForm(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                              onClick={initializePaystackPayment}
                              disabled={purchaseLoading}
                            >
                              {purchaseLoading ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : `Pay ₦${(event.price * purchaseQuantity + event.price * 0.03).toFixed(2)} (Incl. 3% fee)*`}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Payment Form - For free tickets */}
                    {showPaymentForm && !event.is_paid && (
                      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-slate-800 mb-3">Enter Your Details</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="buyerName" className="block text-sm font-medium text-slate-700 mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              id="buyerName"
                              value={buyerName}
                              onChange={(e) => setBuyerName(e.target.value)}
                              placeholder="John Doe"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="buyerEmail" className="block text-sm font-medium text-slate-700 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="buyerEmail"
                              value={buyerEmail}
                              onChange={(e) => setBuyerEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="buyerPhone" className="block text-sm font-medium text-slate-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="buyerPhone"
                              value={buyerPhone}
                              onChange={(e) => setBuyerPhone(e.target.value)}
                              placeholder="+234 123 456 7890"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          
                          <div className="flex justify-between mt-4">
                            <button
                              type="button"
                              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                              onClick={() => setShowPaymentForm(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                              onClick={processFreeTicket}
                              disabled={purchaseLoading}
                            >
                              {purchaseLoading ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : `Get Free Tickets`}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Success message */}
                    {purchaseSuccess && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-lg flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium">Success!</p>
                          <p className="text-sm">Your tickets have been reserved. Thank you for your purchase!</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Get Tickets Button - Only show if payment form is not visible */}
                    {!showPaymentForm && (
                      <button 
                        className={`w-full py-3 rounded-lg transition-all duration-300 font-medium shadow-sm ${
                          ticketsAvailable > 0 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                        disabled={purchaseLoading || ticketsAvailable <= 0}
                        onClick={handlePurchaseTicket}
                      >
                        {purchaseLoading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : ticketsAvailable > 0 ? (
                          `Get ${purchaseQuantity} Ticket${purchaseQuantity > 1 ? 's' : ''} ${event.is_paid ? `• ₦${(event.price * purchaseQuantity).toFixed(2)}` : ''}`
                        ) : 'Sold Out'}
                      </button>
                    )}
                    
                    {/* Additional Information */}
                    <div className="mt-4 text-xs text-slate-500">
                      <p>• Secure checkout</p>
                      <p>• Instant confirmation</p>
                      {event.is_paid && <p>• Refund available until 24 hours before event</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} Eventips. All rights reserved.</p>
            <p className="mt-1">This is a private event page. Please respect the privacy of the event.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 