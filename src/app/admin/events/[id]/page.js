'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import supabase from '../../../lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPromotionToggling, setIsPromotionToggling] = useState(false);

  useEffect(() => {
    const fetchEventDetail = async () => {
      setIsLoading(true);
      try {
        // Fetch event details without the user join that's causing issues
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            event_images (*)
          `)
          .eq('id', params.id)
          .single();

        if (eventError) throw eventError;
        
        // If event has a user_id, fetch user data separately
        if (eventData && eventData.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('id', eventData.user_id)
            .single();
            
          if (!userError && userData) {
            // Attach user data to the event object
            eventData.user = userData;
          }
        }
        
        setEvent(eventData);
      } catch (error) {
        console.error('Error fetching event details:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchEventDetail();
    }
  }, [params.id]);

  const handlePromotionToggle = async () => {
    setIsPromotionToggling(true);
    try {
      const newPromotionStatus = !event.is_promotion_enabled;
      
      const { error } = await supabase
        .from('events')
        .update({ is_promotion_enabled: newPromotionStatus })
        .eq('id', event.id);
        
      if (error) throw error;
      
      // Update local state
      setEvent({
        ...event,
        is_promotion_enabled: newPromotionStatus
      });
      
    } catch (error) {
      console.error('Error toggling promotion status:', error.message);
      alert(`Failed to update promotion status: ${error.message}`);
    } finally {
      setIsPromotionToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">Error Loading Event</h2>
          <p className="text-gray-600 text-center mb-4">
            {error}
          </p>
          <div className="mt-6 text-center">
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">Event Not Found</h2>
          <p className="text-gray-600 text-center mb-4">
            We couldn't find the requested event.
          </p>
          <div className="mt-6 text-center">
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find cover image
  const coverImage = event.event_images?.find(img => img.is_cover)?.image_url;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
          <div className="space-x-3">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
            <Link
              href="/admin/promotion-events"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              All Promotions
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{event.name}</h2>
              <p className="mt-1 text-sm text-gray-500">Event ID: {event.id}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                event.is_promotion_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {event.is_promotion_enabled ? 'Promoted' : 'Not Promoted'}
              </span>
              <button
                onClick={handlePromotionToggle}
                disabled={isPromotionToggling}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                  event.is_promotion_enabled
                    ? 'text-red-700 bg-red-100 hover:bg-red-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                }`}
              >
                {isPromotionToggling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : event.is_promotion_enabled ? (
                  'Remove Promotion'
                ) : (
                  'Add Promotion'
                )}
              </button>
            </div>
          </div>
          
          {/* Cover Image */}
          {coverImage && (
            <div className="relative h-64 sm:h-96 w-full overflow-hidden">
              <Image
                src={coverImage}
                fill
                alt={event.name}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              {/* Event Creator */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Event By</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {event.user ? (
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-medium">
                        {event.user.first_name ? event.user.first_name.charAt(0) : ''}
                        {event.user.last_name ? event.user.last_name.charAt(0) : ''}
                      </div>
                      <div className="ml-3">
                        <span className="font-medium">
                          {event.user.first_name || ''} {event.user.last_name || ''}
                        </span>
                        {event.user.email && (
                          <div className="text-xs text-gray-500">{event.user.email}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Unknown user (ID: {event.user_id || 'not set'})</span>
                  )}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{event.description || 'No description provided'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{event.category || 'Not specified'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Visibility</dt>
                <dd className="mt-1 text-sm text-gray-900">{event.is_public ? 'Public' : 'Private'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Pricing</dt>
                <dd className="mt-1 text-sm text-gray-900">{event.is_paid ? 'Paid' : 'Free'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.status === 'published' ? 'bg-green-100 text-green-800' : 
                    event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.status?.charAt(0).toUpperCase() + event.status?.slice(1) || 'Unknown'}
                  </span>
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {event.address ? `${event.address}, ` : ''}
                  {event.city ? `${event.city}, ` : ''}
                  {event.state ? `${event.state}, ` : ''}
                  {event.country || 'Location not specified'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {event.event_date ? (
                    <>
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {event.start_time && ` at ${event.start_time}`}
                      {event.end_time && ` - ${event.end_time}`}
                    </>
                  ) : (
                    'Date not set'
                  )}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(event.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
} 