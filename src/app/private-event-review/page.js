'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import supabase from '../lib/supabase';

export default function PrivateEventReviewPage() {
  const router = useRouter();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishInProgress, setPublishInProgress] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    // Retrieve the event data from sessionStorage
    const getEventData = () => {
      if (typeof window !== 'undefined') {
        const storedData = sessionStorage.getItem('privateEventData');
        if (storedData) {
          setEventData(JSON.parse(storedData));
        } else {
          // If no data found, redirect back to the private event page
          router.push('/private-event');
        }
        setLoading(false);
      }
    };

    getEventData();
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // It's a date in format YYYY-MM-DD
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return dateString;
    } catch (e) {
      return dateString || 'Not specified';
    }
  };

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
      return timeString || 'Not specified';
    }
  };

  const handleEditEvent = () => {
    // Keep the event data in sessionStorage for editing
    // Just navigate back to the create page which will use the same data
    router.push('/private-event');
  };

  const handlePublish = async () => {
    // Check if it's a free event - if yes, show payment modal
    if (!eventData.isPaid) {
      setShowPaymentModal(true);
      return;
    }
    
    // For paid events, proceed with publishing
    await publishEvent();
  };
  
  const publishEvent = async () => {
    try {
      setPublishInProgress(true);

      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not authenticated. Please sign in to publish events.');
      }
      
      const user = JSON.parse(userStr);
      
      // Format the data for database insertion
      const privateEventData = {
        user_id: user.id,
        event_name: eventData.eventName,
        description: eventData.description,
        event_start_date: eventData.eventStartDate,
        event_end_date: eventData.eventEndDate || eventData.eventStartDate, // Use start date as fallback
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        address: eventData.address,
        city: eventData.city,
        state: eventData.state,
        country: eventData.country,
        is_paid: eventData.isPaid,
        price: eventData.isPaid ? parseFloat(eventData.price) : 0,
        quantity: parseInt(eventData.quantity) || 0,
        cover_image_url: eventData.coverImageUrl
      };
      
      // Insert the event into the private_events table
      const { data, error } = await supabase
        .from('private_events')
        .insert([privateEventData])
        .select();
      
      if (error) {
        throw new Error(`Error publishing event: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned after inserting event');
      }
      
      const publishedEvent = data[0];
      
      // If this was a free event, update the payment record with the event ID
      if (!eventData.isPaid) {
        // Get the most recent payment reference from localStorage
        const paymentRef = localStorage.getItem('freeEventPaymentRef');
        if (paymentRef) {
          // Update the payment record with the event ID
          await fetch(`/api/private-event-fee?reference=${paymentRef}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event_id: publishedEvent.id
            }),
          }).catch(err => console.error('Error updating payment record:', err));
          
          // Clear the payment reference
          localStorage.removeItem('freeEventPaymentRef');
        }
      }
      
      // Get the share_link and construct the full URL
      const shareUrl = `${window.location.origin}/private-event/${publishedEvent.share_link}`;
      
      setShareLink(shareUrl);
      setShowShareModal(true);
      
      // Clear the sessionStorage data as it's now saved in the database
      sessionStorage.removeItem('privateEventData');
      
    } catch (error) {
      console.error('Error publishing event:', error);
      alert(`Failed to publish event: ${error.message}`);
    } finally {
      setPublishInProgress(false);
    }
  };
  
  const handlePaymentForFreeEvent = async () => {
    try {
      setPaymentLoading(true);
      
      // Get user email from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert('User not authenticated. Please sign in to publish events.');
        setPaymentLoading(false);
        return;
      }
      
      const user = JSON.parse(userStr);
      const userEmail = user.email;
      
      if (!userEmail) {
        alert('User email not found. Please sign in again.');
        setPaymentLoading(false);
        return;
      }
      
      // Generate a unique reference
      const reference = `FREE-EVENT-${Date.now()}`;
      
      // Save the reference for later use
      localStorage.setItem('freeEventPaymentRef', reference);
      
      // Check if Paystack script is already loaded
      if (window.PaystackPop) {
        initializePaystackPayment(reference, userEmail);
        return;
      }
      
      // Load Paystack script dynamically
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      
      script.onload = () => {
        initializePaystackPayment(reference, userEmail);
      };
      
      script.onerror = () => {
        console.error('Failed to load Paystack script');
        alert('Failed to load payment system. Please try again.');
        setPaymentLoading(false);
      };
      
      document.body.appendChild(script);
      
    } catch (error) {
      console.error('Error initializing payment:', error);
      alert('Error initializing payment. Please try again.');
      setPaymentLoading(false);
    }
  };
  
  // Function to initialize Paystack payment
  const initializePaystackPayment = (reference, email) => {
    try {
      // First try to get the key from environment variables
      let paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      
      // If not available (common in development), use a hardcoded test key
      if (!paystackKey) {
        // Use a known working test key
        paystackKey = 'pk_test_73595fe06e45407c278c54010a0ce1f72f30aea9';
        console.warn('Using hardcoded Paystack test key. In production, use environment variables.');
      }
      
      console.log('Initializing Paystack with key:', paystackKey);
      
      // Create callback function outside the setup
      const handlePaystackCallback = function(response) {
        if (response.status === 'success') {
          // Process successful payment
          (async () => {
            try {
              // Verify payment through our API
              const userStr = localStorage.getItem('user');
              const user = JSON.parse(userStr);
              
              // Make API call to verify and record payment
              const verifyResult = await fetch('/api/private-event-fee', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  reference: response.reference,
                  user_id: user.id,
                }),
              });
              
              const verifyData = await verifyResult.json();
              
              if (!verifyData.success) {
                throw new Error(verifyData.error || 'Payment verification failed');
              }
              
              // Close the payment modal
              setShowPaymentModal(false);
              // Proceed with event publishing
              publishEvent();
            } catch (error) {
              console.error('Error verifying payment:', error);
              alert(`Payment verification failed: ${error.message}`);
              setPaymentLoading(false);
            }
          })();
        } else {
          alert('Payment was not successful. Please try again.');
          setPaymentLoading(false);
        }
      };
      
      // Create on close function outside the setup
      const handlePaystackClose = function() {
        console.log('Payment modal closed');
        setPaymentLoading(false);
      };
      
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: email,
        amount: 10000 * 100, // 10,000 Naira in kobo
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Event Name",
              variable_name: "event_name",
              value: eventData.eventName
            },
            {
              display_name: "Payment Type",
              variable_name: "payment_type",
              value: "Free Private Event Fee"
            }
          ]
        },
        callback: handlePaystackCallback,
        onClose: handlePaystackClose
      });
      
      // Open the payment modal
      handler.openIframe();
      
    } catch (error) {
      console.error('Error in Paystack setup:', error);
      alert('Failed to initialize payment system. Please try again.');
      setPaymentLoading(false);
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

  if (!eventData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">No event data found. Please create your event first.</p>
          <Link href="/private-event" className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-block">
            Create Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/private-event" className="text-slate-500 hover:text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Private Event Review</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Review Your Event Details</h2>
          
          <div className="space-y-8">
            {/* Event Name and Cover */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-medium text-slate-700 mb-4">Event Information</h3>
              
              <div className="flex flex-col md:flex-row gap-6">
                {eventData.coverImageUrl ? (
                  <div className="w-full md:w-1/3">
                    <div className="aspect-video relative rounded-lg overflow-hidden">
                      <Image 
                        src={eventData.coverImageUrl} 
                        fill
                        alt="Event cover" 
                        className="object-cover" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full md:w-1/3">
                    <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                      <p className="text-slate-400">No cover image</p>
                    </div>
                  </div>
                )}
                
                <div className="w-full md:w-2/3">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Event Title</p>
                      <p className="font-medium text-slate-800">{eventData.eventName || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-slate-500">Description</p>
                    <p className="text-slate-800 whitespace-pre-line">{eventData.description || 'No description provided.'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Date, Time, and Location */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-medium text-slate-700 mb-4">Date, Time & Location</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-slate-500">Start Date</p>
                    <p className="font-medium text-slate-800">{formatDate(eventData.eventStartDate)}</p>
                  </div>
                  
                  {eventData.eventEndDate && eventData.eventEndDate !== eventData.eventStartDate && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-500">End Date</p>
                      <p className="font-medium text-slate-800">{formatDate(eventData.eventEndDate)}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Start Time</p>
                      <p className="font-medium text-slate-800">{formatTime(eventData.startTime)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500">End Time</p>
                      <p className="font-medium text-slate-800">{formatTime(eventData.endTime)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="font-medium text-slate-800">{eventData.address || 'Not specified'}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">City</p>
                      <p className="font-medium text-slate-800">{eventData.city || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">State</p>
                      <p className="font-medium text-slate-800">{eventData.state || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Country</p>
                      <p className="font-medium text-slate-800">{eventData.country || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ticket Information */}
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Ticket Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Ticket Type</p>
                  <p className="font-medium text-slate-800">{eventData.isPaid ? 'Paid' : 'Free'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Quantity</p>
                  <p className="font-medium text-slate-800">{eventData.quantity || '0'}</p>
                </div>
                
                {eventData.isPaid && (
                  <div>
                    <p className="text-sm text-slate-500">Price</p>
                    <p className="font-medium text-slate-800">₦ {eventData.price || '0'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Modal for Free Events */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Free Private Event Fee</h3>
              
              <div className="mb-6">
                <p className="text-slate-600 mb-4">
                  For free private events, there is a one-time fee of <span className="font-bold">₦10,000</span> to publish the event.
                  This fee is charged only once per event.
                </p>
                <p className="text-slate-600 mb-4">
                  This fee helps us maintain our platform and provide you with features like:
                </p>
                <ul className="list-disc pl-5 text-slate-600 space-y-2">
                  <li>Custom event link</li>
                  <li>Unlimited free ticket distribution</li>
                  <li>Access to attendee information</li>
                  <li>Email notifications to attendees</li>
                  <li>QR code ticket scanning</li>
                </ul>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentForFreeEvent}
                  disabled={paymentLoading}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Proceed with Payment (₦10,000)'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Event Published Successfully!</h3>
              <p className="text-slate-600 mb-6">Share this link with people you want to invite:</p>
              
              <div className="flex items-center mb-6">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 p-2 border border-slate-300 rounded-l-md focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    alert('Link copied to clipboard!');
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
                >
                  Copy
                </button>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleEditEvent}
            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors duration-300"
          >
            Edit Event
          </button>
          <button
            onClick={handlePublish}
            disabled={publishInProgress}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center disabled:opacity-50"
          >
            {publishInProgress ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publishing...
              </>
            ) : 'Publish Event'}
          </button>
        </div>
      </div>
    </div>
  );
} 