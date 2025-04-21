'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';
import TicketModal from '../../components/TicketModal';
import EventPreviewModal from '../../components/EventPreviewModal';
import { useRouter } from 'next/navigation';

export default function UpcomingEvents() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const router = useRouter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Reset to first page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          description,
          event_date,
          start_time,
          city,
          state,
          address,
          category,
          created_at,
          has_early_bird,
          early_bird_discount,
          early_bird_start_date,
          early_bird_end_date,
          has_multiple_buys,
          multiple_buys_discount,
          multiple_buys_min_tickets,
          event_images (
            image_url,
            is_cover
          ),
          ticket_tiers (
            id,
            name,
            price,
            quantity,
            quantity_sold,
            paid_quantity_sold,
            is_active
          )
        `);

      if (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events');
        return;
      }

      // Process events data
      const processedEvents = eventsData.map(event => {
        // Get cover image or use placeholder
        const coverImage = event.event_images?.find(img => img?.is_cover)?.image_url || '/placeholder-event.jpg';
        
        // Calculate ticket information
        let lowestPrice = 0;
        let totalAvailableTickets = 0;
        let ticketCount = 'No available ticket for this event';
        let isSoldOut = true;
        
        if (event.ticket_tiers && event.ticket_tiers.length > 0) {
          // Filter active ticket tiers
          const activeTickets = event.ticket_tiers.filter(tier => tier.is_active !== false);
          
          if (activeTickets.length > 0) {
            // Calculate available tickets
            activeTickets.forEach(tier => {
              const availableTickets = tier.quantity - (tier.price > 0 ? (tier.paid_quantity_sold || 0) : (tier.quantity_sold || 0));
              if (availableTickets > 0) {
                totalAvailableTickets += availableTickets;
                isSoldOut = false;
              }
            });
            
            // Get lowest price from active tiers
            const prices = activeTickets.map(tier => tier.price || 0).filter(price => price > 0);
            lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
            
            // Format ticket count text
            if (totalAvailableTickets > 0) {
              ticketCount = totalAvailableTickets.toString();
            }
          }
        }
        
        // Determine time frame (for filtering purposes only)
        const eventDate = new Date(event.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        let timeFrame = 'all';
        if (eventDate.toDateString() === today.toDateString()) {
          timeFrame = 'today';
        } else if (eventDate.toDateString() === tomorrow.toDateString()) {
          timeFrame = 'tomorrow';
        } else if (eventDate > today && eventDate <= nextWeek) {
          timeFrame = 'thisWeek';
        } else if (eventDate > nextWeek && eventDate <= nextMonth) {
          timeFrame = 'thisMonth';
        }
        
        // Just for UI purposes - not for limiting display
        const isFeatured = event.created_at && new Date(event.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        
        // Final price display
        const finalPrice = isSoldOut ? 'Sold Out' : (lowestPrice === 0 ? "Free" : `From ₦${lowestPrice.toLocaleString()}`);
        
        return {
          id: event.id,
          title: event.name || 'Untitled Event',
          description: event.description,
          date: event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : 'Date TBA',
          eventDate: event.event_date ? new Date(event.event_date) : null,
          time: event.start_time || 'Time TBA',
          location: event.address ? 
            `${event.address}, ${event.city || ''}${event.state ? `, ${event.state}` : ''}` : 
            `${event.city || ''}${event.state ? `, ${event.state}` : ''}`,
          address: event.address || '',
          price: finalPrice,
          numericPrice: lowestPrice,
          category: event.category || 'General',
          image: coverImage,
          timeFrame: timeFrame,
          featured: isFeatured,
          ticketCount: ticketCount,
          isSoldOut: isSoldOut,
          ticket_tiers: event.ticket_tiers,
          has_early_bird: event.has_early_bird || false,
          early_bird_discount: event.early_bird_discount || 0,
          early_bird_start_date: event.early_bird_start_date,
          early_bird_end_date: event.early_bird_end_date,
          has_multiple_buys: event.has_multiple_buys || false,
          multiple_buys_discount: event.multiple_buys_discount || 0,
          multiple_buys_min_tickets: event.multiple_buys_min_tickets || 2
        };
      });

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events based on selected filter and search query, but if filter is 'all', show everything
  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.timeFrame === filter;
    const matchesSearch = searchQuery === '' || 
                          event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Get current page events
  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  
  // Handle page navigation
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Handle event click to show preview modal
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Close the preview modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Handle "Get Tickets" button click
  const handleGetTickets = (event) => {
    // Check if user is logged in by looking for user data in localStorage
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('user');
    
    if (!isLoggedIn) {
      // Show login prompt if user is not logged in
      setSelectedEvent(event);
      setShowLoginPrompt(true);
      return;
    }
    
    // Set the selected event and show the ticket modal
    setSelectedEvent(event);
    closeModal(); // Close the preview modal if it's open
    setShowTicketModal(true);
  };

  // Function to direct users to login page
  const handleLoginRedirect = () => {
    // Store the current URL in localStorage to redirect back after login
    localStorage.setItem('loginRedirectURL', window.location.href);
    router.push('/signin');
  };

  // Function to close the login prompt
  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  // Close the ticket modal
  const closeTicketModal = () => {
    setShowTicketModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      {/* Inline style for shine animation */}
      <style jsx global>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shine {
          animation: shine 3s infinite linear;
        }
      `}</style>
    
      <Navbar />
      
      {/* Hero Section - Updated with amber/orange theme */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Upcoming Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-600/70"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md"
          >
            Upcoming Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-2xl text-base sm:text-lg drop-shadow"
          >
            Discover and plan for the most anticipated events coming your way
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search and Filters Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search events or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-800"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-amber-500 absolute left-3 top-1/2 transform -translate-y-1/2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Time Period Filters */}
          <div className="flex overflow-x-auto pb-2 -mx-2 px-2 w-full md:w-auto">
            <div className="flex space-x-2 md:space-x-4">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Events</FilterButton>
              <FilterButton active={filter === 'today'} onClick={() => setFilter('today')}>Today</FilterButton>
              <FilterButton active={filter === 'tomorrow'} onClick={() => setFilter('tomorrow')}>Tomorrow</FilterButton>
              <FilterButton active={filter === 'thisWeek'} onClick={() => setFilter('thisWeek')}>This Week</FilterButton>
              <FilterButton active={filter === 'thisMonth'} onClick={() => setFilter('thisMonth')}>This Month</FilterButton>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-red-50 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-3">{error}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't load the events. Please try again or check back later.
            </p>
            <button 
              onClick={fetchEvents}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Results Count and Info */}
            <div className="mb-8 text-center">
              <p className="text-gray-600">
                Showing <span className="font-bold text-amber-600">{filteredEvents.length}</span> {filteredEvents.length === 1 ? 'event' : 'events'}
                {filter !== 'all' && ` for ${getTimeFrameLabel(filter).toLowerCase()}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
              
              {/* Page Size Selector */}
              {filteredEvents.length > 8 && (
                <div className="mt-2 flex justify-center items-center space-x-2">
                  <span className="text-sm text-gray-600">Events per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when changing page size
                    }}
                    className="text-sm border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={16}>16</option>
                    <option value={24}>24</option>
                  </select>
                </div>
              )}
            </div>
            
            {/* Events Grid */}
            {filteredEvents.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
              >
                {currentEvents.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <EventCard 
                      event={event} 
                      onClick={() => handleEventClick(event)}
                      onGetTickets={handleGetTickets}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-10 text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No events found</h3>
                <p className="text-gray-500 mb-6">
                  We couldn't find any events matching your criteria. Try adjusting your search or filter.
                </p>
                <button 
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow"
                >
                  Show All Events
                </button>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <nav className="flex items-center space-x-1 md:space-x-2">
                  {/* First Page Button - Only show if not on first page and many pages exist */}
                  {totalPages > 5 && currentPage > 3 && (
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-2 rounded-md text-gray-700 hover:bg-amber-100"
                      aria-label="First Page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                
                  {/* Previous Page Button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-amber-100'
                    }`}
                    aria-label="Previous Page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                      // Calculate which page numbers to show
                      let pageNumber;
                      if (totalPages <= 5) {
                        // If we have 5 or fewer pages, show all of them
                        pageNumber = idx + 1;
                      } else if (currentPage <= 3) {
                        // If we're near the start, show pages 1-5
                        pageNumber = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // If we're near the end, show the last 5 pages
                        pageNumber = totalPages - 4 + idx;
                      } else {
                        // Otherwise show 2 pages before and after current page
                        pageNumber = currentPage - 2 + idx;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          aria-label={`Page ${pageNumber}`}
                          aria-current={currentPage === pageNumber ? 'page' : undefined}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${
                            currentPage === pageNumber
                              ? 'bg-amber-500 text-white font-medium'
                              : 'text-gray-700 hover:bg-amber-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next Page Button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-md ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-amber-100'
                    }`}
                    aria-label="Next Page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Last Page Button - Only show if not on last page and many pages exist */}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-2 rounded-md text-gray-700 hover:bg-amber-100"
                      aria-label="Last Page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm-8 0a1 1 0 010-1.414L6.586 10 2.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </nav>
              </div>
            )}
            
            {/* Results Summary */}
            {filteredEvents.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, filteredEvents.length)} of {filteredEvents.length} events
              </div>
            )}
          </>
        )}
        
        {/* Newsletter Section - Updated with black theme and shine effect */}
        <div className="mt-20 bg-black rounded-2xl overflow-hidden shadow-xl relative">
          {/* Animated shine effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[10px] opacity-30 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-45deg] animate-shine"></div>
          </div>
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Never Miss a New Event</h3>
                <p className="text-white/80 max-w-md">
                  Stay updated with the most exclusive events in your area. Get notified about upcoming events that match your interests.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <div className="relative h-48 w-full md:w-64 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                    alt="Events notification"
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Event Preview Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Close button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col md:flex-row h-full">
              {/* Event Image */}
              <div className="relative md:w-1/2 h-64 md:h-auto">
                <Image
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
                
                {/* Category tag */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold text-amber-900 shadow-sm">
                  {selectedEvent.category || "Event"}
                </div>
              </div>
              
              {/* Event Details */}
              <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto max-h-[70vh] md:max-h-[90vh]">
                <h2 className="text-2xl md:text-3xl font-bold text-amber-900 mb-4">{selectedEvent.title}</h2>
                
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="bg-amber-50 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Date</p>
                      <p className="text-gray-600">{selectedEvent.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className="bg-amber-50 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Time</p>
                      <p className="text-gray-600">{selectedEvent.time || "TBA"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className="bg-amber-50 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Location</p>
                      <p className="text-gray-600">{selectedEvent.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-amber-50 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Price</p>
                      <p className="text-amber-600 font-bold">{selectedEvent.price}</p>
                      {selectedEvent.price !== 'Free' && selectedEvent.price !== 'Sold Out' && (
                        <p className="text-xs text-gray-500">{selectedEvent.ticketCount} tickets available</p>
                      )}
                      {selectedEvent.price === 'Free' && selectedEvent.ticketCount !== 'No available ticket for this event' && (
                        <p className="text-xs text-gray-500">{selectedEvent.ticketCount} free tickets available</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">About This Event</h3>
                  <p className="text-gray-600">
                    {selectedEvent.description || "Join us for an amazing event experience. More details will be provided soon!"}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <Link href="/my-tickets" className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors">
                    My Tickets
                  </Link>
                  <button 
                    onClick={() => handleGetTickets(selectedEvent)}
                    disabled={selectedEvent.ticketCount === 'No available ticket for this event'}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      selectedEvent.ticketCount === 'No available ticket for this event'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {selectedEvent.ticketCount === 'No available ticket for this event' ? 'Sold Out' : 'Get Tickets'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Ticket Purchase Modal */}
      {showTicketModal && selectedEvent && (
      <TicketModal
        event={selectedEvent}
        isOpen={showTicketModal}
        onClose={closeTicketModal}
      />
      )}
      
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Modal backdrop */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-800 opacity-80"></div>
            </div>
            
            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-6 py-6">
                <div className="text-center mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
                  <p className="text-gray-600 mb-6">
                    You need to be logged in to purchase tickets for this event. Would you like to login now?
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
                  <button
                    onClick={closeLoginPrompt}
                    className="w-full sm:w-auto order-2 sm:order-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLoginRedirect}
                    className="w-full sm:w-auto order-1 sm:order-2 px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
                  >
                    Login Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Filter Button Component
function FilterButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
        active 
          ? 'bg-amber-500 text-white shadow-md' 
          : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-500/30 hover:shadow-sm'
      }`}
    >
      {children}
    </button>
  );
}

// Event Card Component
function EventCard({ event, onClick, onGetTickets }) {
  // Check if discounts are available
  const hasDiscounts = event.has_early_bird || event.has_multiple_buys;
  const discountAmount = Math.max(event.early_bird_discount || 0, event.multiple_buys_discount || 0);
  // Check if user is logged in
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('user');
  
  return (
    <div className="relative flex flex-col overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-200">
      {/* Event Image */}
      <div 
        className="relative aspect-[16/9] cursor-pointer"
        onClick={onClick}
      >
        <Image 
          src={event.image} 
          alt={event.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        {/* Category Tag */}
        <div className="absolute top-3 left-3">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-full shadow-sm">
            {event.category}
          </span>
        </div>
        
        {/* Discount Badge - Show only if there are discounts */}
        {hasDiscounts && (
          <div className="absolute top-3 right-3">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-orange-500 text-white rounded-full shadow-sm animate-pulse">
              Up to {discountAmount}% off
            </span>
          </div>
        )}
      </div>
      
      {/* Event Content */}
      <div className="p-4 flex-grow cursor-pointer" onClick={onClick}>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-1">{event.title}</h3>
        
        <div className="mb-4">
          <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-slate-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-slate-600">{event.date}</span>
          </div>
          
          {event.time && (
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-slate-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-slate-600">{event.time}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-slate-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-slate-600">{event.location}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Event Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 p-4">
        <div className="flex flex-col">
          <span className={`text-sm ${event.isSoldOut ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
            {event.isSoldOut ? 'Sold Out' : `${event.ticketCount} tickets`}
          </span>
          <span className="text-lg font-semibold text-indigo-600">
            {event.price}
          </span>
        </div>
        
        {!event.isSoldOut && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onGetTickets(event);
            }}
            className={`px-4 py-2 ${isLoggedIn ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 hover:bg-gray-700'} text-white font-medium rounded-lg transition-colors`}
            title={isLoggedIn ? "Get tickets" : "Login required to get tickets"}
          >
            {isLoggedIn ? 'Get Tickets' : 'Login to Buy'}
          </button>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getTimeFrameLabel(timeFrame) {
  switch(timeFrame) {
    case 'today': return 'Today';
    case 'tomorrow': return 'Tomorrow';
    case 'thisWeek': return 'This Week';
    case 'thisMonth': return 'This Month';
    default: return 'Upcoming';
  }
}

function getTimeFrameDotColor(timeFrame) {
  switch(timeFrame) {
    case 'today': return 'bg-red-500';
    case 'tomorrow': return 'bg-orange-500';
    case 'thisWeek': return 'bg-white';
    case 'thisMonth': return 'bg-white';
    default: return 'bg-white';
  }
}

function getTimeFrameBackgroundColor(timeFrame) {
  switch(timeFrame) {
    case 'today': return 'bg-red-500 text-white';
    case 'tomorrow': return 'bg-orange-500 text-white';
    case 'thisWeek': return 'bg-amber-500 text-white';
    case 'thisMonth': return 'bg-amber-500/80 text-white';
    default: return 'bg-gray-200 text-gray-800';
  }
} 