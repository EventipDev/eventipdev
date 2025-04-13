'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabase';
import Link from 'next/link';

export default function PromotionEvents() {
  const router = useRouter();
  const [promotedEvents, setPromotedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const eventsPerPage = 10;

  useEffect(() => {
    const fetchPromotedEvents = async () => {
      setIsLoading(true);
      try {
        // Get total count first for pagination
        const { count, error: countError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('is_promotion_enabled', true);

        if (countError) throw countError;
        setTotalEvents(count || 0);

        // Calculate offset for pagination
        const from = (currentPage - 1) * eventsPerPage;
        const to = from + eventsPerPage - 1;
        
        // Fetch events with promotion enabled with pagination
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            name,
            description,
            event_date,
            start_time,
            category,
            city,
            state,
            country,
            is_public,
            is_paid,
            is_promotion_enabled,
            status,
            created_at,
            user_id
          `)
          .eq('is_promotion_enabled', true)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        setPromotedEvents(data || []);
      } catch (error) {
        console.error('Error fetching promoted events:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotedEvents();
  }, [currentPage]);

  const handleTogglePromotion = async (eventId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_promotion_enabled: !currentStatus })
        .eq('id', eventId);
        
      if (error) throw error;
      
      // Update the local state
      setPromotedEvents(prevEvents => 
        // If we're removing the promotion, filter out the event from the list
        currentStatus ? prevEvents.filter(event => event.id !== eventId) : 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, is_promotion_enabled: !currentStatus } 
            : event
        )
      );

      // Update total count when removing a promotion
      if (currentStatus) {
        setTotalEvents(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error toggling promotion status:', error.message);
      // Show error to user
      alert(`Failed to update promotion status: ${error.message}`);
    }
  };

  const handleViewDetails = (eventId) => {
    router.push(`/admin/events/${eventId}`);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  // Handle page navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Promotion Management</h1>
          <Link href="/admin/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Back to Dashboard
          </Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Promoted Events</h2>
            <p className="mt-1 text-sm text-gray-500">Events with promotion enabled</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : promotedEvents.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500">No promoted events found</p>
              <div className="mt-4">
                <Link 
                  href="/admin/events"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  View All Events
                </Link>
                <p className="mt-4 text-sm text-gray-500">
                  Go to the Events page to view all events and enable promotions
                </p>
              </div>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {promotedEvents.map((event) => (
                  <li key={event.id}>
                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">{event.name}</p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Promoted
                          </span>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500 mr-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date set'}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {event.city ? `${event.city}, ${event.state || ''}, ${event.country || ''}` : 'Location not set'}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex">
                        <button
                          onClick={() => handleTogglePromotion(event.id, event.is_promotion_enabled)}
                          className="mr-4 font-medium text-red-600 hover:text-red-500"
                        >
                          Remove Promotion
                        </button>
                        <button 
                          onClick={() => handleViewDetails(event.id)}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * eventsPerPage) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * eventsPerPage, totalEvents)}
                        </span>{' '}
                        of <span className="font-medium">{totalEvents}</span> events
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Page numbers */}
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border ${
                              currentPage === i + 1
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            } text-sm font-medium`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-8 flex justify-end">
          <Link 
            href="/admin/events"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            View All Events
          </Link>
        </div>
      </main>
    </div>
  );
} 