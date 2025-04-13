'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../lib/supabase';
import Image from 'next/image';

function ReviewEventContent() {
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
  const [albumImages, setAlbumImages] = useState([]);
  const [isPromotionEnabled, setIsPromotionEnabled] = useState(false);
  const [ticketTiers, setTicketTiers] = useState([]);
  const [standardTicket, setStandardTicket] = useState(null);
  const [premiumTiers, setPremiumTiers] = useState([]);

  // Fetch event data on component mount
  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        // Get event ID from session storage
        const eventId = sessionStorage.getItem('currentEventId');
        // Get promotion status from session storage
        const promotionStatus = sessionStorage.getItem('isPromotionEnabled');
        setIsPromotionEnabled(promotionStatus === 'true');
        
        if (!eventId) {
          throw new Error('No event found to review');
        }
        
        // Fetch event data from Supabase
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            event_images (*),
            ticket_tiers (*)
          `)
          .eq('id', eventId)
          .single();
          
        if (eventError) throw eventError;
        
        if (!eventData) {
          throw new Error('Event not found');
        }
        
        // Process the event data
        setEvent(eventData);
        
        // Process images
        if (eventData.event_images && eventData.event_images.length > 0) {
          // Find cover image
          const coverImage = eventData.event_images.find(img => img.is_cover === true);
          if (coverImage) {
            setEvent(prev => ({
              ...prev,
              cover_image_url: coverImage.image_url
            }));
          }
          
          // Set album images (non-cover images)
          const albumImgs = eventData.event_images.filter(img => !img.is_cover);
          if (albumImgs.length > 0) {
            setAlbumImages(albumImgs);
          }
        }

        // Process ticket data
        if (eventData.ticket_tiers && eventData.ticket_tiers.length > 0) {
          // Save all ticket tiers
          setTicketTiers(eventData.ticket_tiers);
          
          // Separate standard and premium tiers based on is_premium flag
          const standard = eventData.ticket_tiers.find(tier => !tier.is_premium);
          const premium = eventData.ticket_tiers.filter(tier => tier.is_premium);
          
          // Process premium tiers to use the correct fields
          const processedPremiumTiers = premium.map(tier => ({
            ...tier,
            name: tier.tier_title || tier.name || 'Premium Tier',
            description: tier.description || '',
            price: tier.price || 0,
            quantity: tier.quantity || 0
          }));
          
          setStandardTicket(standard || null);
          setPremiumTiers(processedPremiumTiers || []);
          
          // If it's a paid event, set the price and quantity from the standard tier for backward compatibility
          if (eventData.is_paid && standard) {
            setEvent(prev => ({
              ...prev,
              ticket_price: standard.price,
              ticket_quantity: standard.quantity
            }));
          } else if (!eventData.is_paid && standard) {
            // If it's a free event but has tickets
            setEvent(prev => ({
              ...prev,
              ticket_quantity: standard.quantity
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, []);
  
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      let publishData = {
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // If schedule is enabled, set scheduled publish date
      if (isScheduleEnabled && publishDate && publishTime) {
        const scheduledDate = new Date(`${publishDate}T${publishTime}`);
        publishData = {
          status: 'scheduled',
          scheduled_publish_date: scheduledDate.toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // We don't want to modify the is_promotion_enabled field here
      // since it was already set when creating the event
      
      // Update event in Supabase
      const { error } = await supabase
        .from('events')
        .update(publishData)
        .eq('id', event.id);
        
      if (error) throw error;
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error publishing event:', error.message);
      setError('Failed to publish event. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Function to navigate to create-event page with specific section
  const navigateToCreateEvent = (section) => {
    // Store the section in session storage to be used when the create-event page loads
    sessionStorage.setItem('activeSection', section);
    router.push('/create-event');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="mt-4 text-slate-600 font-medium text-center">Loading event details...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-slate-200">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Error loading event</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link href="/create-event" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md">
              Back to Create Event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/create-event" className="text-slate-500 hover:text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Review Event</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-64 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-500">Last update</div>
              <div className="font-medium text-slate-800">
                {new Date(event?.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })} | {new Date(event?.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-500">Status</div>
              <div className="font-medium text-slate-800">Draft</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-semibold uppercase text-sm text-slate-500 mb-4">EVENT INFORMATION</h3>
              <ul className="space-y-2">
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => navigateToCreateEvent('upload-cover')}
                >
                  Upload cover
                </li>
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => navigateToCreateEvent('general-information')}
                >
                  General information
                </li>
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => navigateToCreateEvent('location-and-time')}
                >
                  Location and time
                </li>
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => navigateToCreateEvent('ticket')}
                >
                  Ticket
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-semibold uppercase text-sm text-slate-500 mb-4">PUBLISH EVENT</h3>
              <ul className="space-y-2">
                <li className="text-indigo-600 font-medium">Review and Publish</li>
              </ul>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* Event Preview */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-medium text-slate-800">Preview</h2>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Event Preview Card */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="relative h-48 bg-slate-200 rounded-lg mb-4 overflow-hidden">
                      {event?.cover_image_url ? (
                        <Image 
                          src={event.cover_image_url} 
                          alt={event.name} 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                          No cover image
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs shadow-sm">
                          New event
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-indigo-600 font-medium">₦{event?.ticket_price || 0}</span>
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Standard Ticket</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{event?.name}</h3>
                    
                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Date not set'} | {event?.start_time || 'Time not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {event?.city ? `${event.city}, ${event.state}` : 'Location not set'}
                      </span>
                    </div>
                    
                    {/* Album Images */}
                    {albumImages.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Event Gallery</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {albumImages.map((image, index) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-sm">
                              <Image 
                                src={image.image_url} 
                                alt={`Event image ${index + 1}`} 
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Event Details Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-medium text-slate-800">Event Details</h2>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-700">Description</h3>
                    <p className="text-sm text-slate-600 mt-1">{event?.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Category</h3>
                      <p className="text-sm text-slate-600 mt-1 capitalize">{event?.category || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Visibility</h3>
                      <p className="text-sm text-slate-600 mt-1">{event?.is_public ? 'Public' : 'Private'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Event Type</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {event?.is_online ? (
                          <span className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Online Event
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Physical Event
                          </span>
                        )}
                      </p>
                    </div>

                    {event?.is_online && event?.event_link && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-700">Event Link</h3>
                        <a 
                          href={event.event_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center"
                        >
                          {event.event_link}
                          <svg className="h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Promotion</h3>
                      <p className={`text-sm mt-1 ${event?.is_promotion_enabled ? 'text-green-600 font-medium' : 'text-slate-600'}`}>
                        {event?.is_promotion_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-slate-700">Location</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {event?.address ? `${event.address}, ` : ''}
                      {event?.city ? `${event.city}, ` : ''}
                      {event?.state ? `${event.state}, ` : ''}
                      {event?.country || 'Location not specified'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Date</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Date not set'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Start Time</h3>
                      <p className="text-sm text-slate-600 mt-1">{event?.start_time || 'Not set'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">End Time</h3>
                      <p className="text-sm text-slate-600 mt-1">{event?.end_time || 'Not set'}</p>
                    </div>
                  </div>
                  
                  {/* Standard ticket display */}
                  {event?.is_paid && standardTicket && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700">Standard Ticket Price</h3>
                        <p className="text-sm flex items-center mt-1">
                          <span className="font-semibold text-lg text-slate-800">₦{standardTicket?.price || '0'}</span>
                          <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Standard</span>
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-700">Standard Ticket Quantity</h3>
                        <p className="text-sm flex items-center mt-1">
                          <span className="font-semibold text-lg text-slate-800">{standardTicket?.quantity || '0'}</span>
                          <span className="ml-2 text-xs text-slate-500">tickets</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Premium Ticket tiers display */}
                  {event?.is_paid && premiumTiers.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-slate-700 mb-3">Premium Ticket Tiers</h3>
                      <div className="space-y-4">
                        {premiumTiers.map((tier, index) => (
                          <div key={index} className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <div className="flex items-center">
                                  <h4 className="text-sm font-semibold text-amber-800">{tier.name}</h4>
                                  <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-700 rounded-full text-xs font-medium">Premium</span>
                                </div>
                                <p className="text-xs text-amber-700 mt-1">
                                  {tier.description || 'No description provided'}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-amber-700">₦{tier.price}</div>
                                <div className="text-xs text-amber-600">per ticket</div>
                              </div>
                            </div>
                            
                            <div className="mt-3 border-t border-amber-200 pt-3 flex justify-between items-center">
                              <span className="text-xs font-medium text-amber-600">Available tickets:</span>
                              <div className="flex items-center">
                                <span className="font-bold text-amber-800 text-lg">{tier.quantity}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Free tickets display */}
                  {!event?.is_paid && standardTicket && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Free Tickets Available</h3>
                      <p className="text-sm flex items-center mt-1">
                        <span className="font-semibold text-lg text-slate-800">{standardTicket?.quantity || '0'}</span>
                        <span className="ml-2 text-xs text-slate-500">tickets</span>
                        <span className="ml-2 px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Free</span>
                      </p>
                    </div>
                  )}

                  {/* Discount Information */}
                  {event?.is_paid && (
                    <div className="mt-6 border-t border-slate-200 pt-6">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Discounts</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Early Bird Discount */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h4 className="text-sm font-medium text-slate-700">Early Bird Discount</h4>
                          </div>
                          
                          {event?.has_early_bird ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Status:</span>
                                <span className="text-xs font-medium text-green-600">Enabled</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Discount:</span>
                                <span className="text-xs font-medium text-slate-700">{event.early_bird_discount}% off</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Valid from:</span>
                                <span className="text-xs font-medium text-slate-700">
                                  {event.early_bird_start_date ? new Date(event.early_bird_start_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : 'Not set'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Valid until:</span>
                                <span className="text-xs font-medium text-slate-700">
                                  {event.early_bird_end_date ? new Date(event.early_bird_end_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : 'Not set'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">This discount is not enabled for this event.</p>
                          )}
                        </div>
                        
                        {/* Multiple Buys Discount */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            <h4 className="text-sm font-medium text-slate-700">Multiple Tickets Discount</h4>
                          </div>
                          
                          {event?.has_multiple_buys ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Status:</span>
                                <span className="text-xs font-medium text-green-600">Enabled</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Discount:</span>
                                <span className="text-xs font-medium text-slate-700">{event.multiple_buys_discount}% off</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Minimum tickets:</span>
                                <span className="text-xs font-medium text-slate-700">{event.multiple_buys_min_tickets || 2} tickets</span>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mt-2">
                                  Buyers will receive a {event.multiple_buys_discount}% discount when purchasing {event.multiple_buys_min_tickets || 2} or more tickets.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">This discount is not enabled for this event.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Publish Schedule */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-slate-800">Publish schedule</h2>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      id="schedule" 
                      checked={isScheduleEnabled}
                      onChange={() => setIsScheduleEnabled(!isScheduleEnabled)}
                      className="sr-only"
                    />
                    <label 
                      htmlFor="schedule"
                      className={`block h-6 w-12 rounded-full cursor-pointer ${isScheduleEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    ></label>
                    <span 
                      className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out bg-white ${isScheduleEnabled ? 'right-1' : 'left-1'}`}
                    ></span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mb-4">
                  Set the publishing time to ensure that your event appears on the website at the designated time
                </p>
                
                {isScheduleEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="publishDate" className="block text-sm font-medium text-slate-700 mb-1">
                        Publish Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="publishDate"
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          required={isScheduleEnabled}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="publishTime" className="block text-sm font-medium text-slate-700 mb-1">
                        Publish Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          id="publishTime"
                          value={publishTime}
                          onChange={(e) => setPublishTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          required={isScheduleEnabled}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/create-event')}
                  className="w-full sm:w-auto px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors duration-300"
                >
                  Save draft
                </button>
                
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || (isScheduleEnabled && (!publishDate || !publishTime))}
                  className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publishing...
                    </>
                  ) : (
                    'Publish'
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewEvent() {
  return <ReviewEventContent />;
} 