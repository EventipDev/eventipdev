'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TicketModal from '../../components/TicketModal';
import { supabase } from '../../lib/supabaseClient';

export default function NewEvents() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchEvents();
  }, [currentPage]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting events:', countError);
      } else {
        setTotalEvents(count || 0);
      }
      
      // Calculate pagination range
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
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
          is_paid,
          status,
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
            is_active,
            is_premium,
            description
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events');
        return;
      }

      // Process events data
      const processedEvents = eventsData.map(event => {
        // Check if event_images is null or not an array
        const eventImages = Array.isArray(event.event_images) ? event.event_images : [];
        // Check if ticket_tiers is null or not an array
        const ticketTiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers : [];
        
        // Default to placeholder if no cover image found
        const coverImage = eventImages.find(img => img?.is_cover)?.image_url || '/placeholder-event.jpg';
        
        let lowestPrice = 0;
        let totalTickets = 0;
        let isSoldOut = false;
        
        // Process standard ticket pricing (non-premium tiers)
        const standardTiers = ticketTiers.filter(tier => 
          !tier.is_premium && tier.name !== 'Premium Tier'
        );
        
        if (standardTiers.length > 0) {
          const prices = standardTiers
            .filter(tier => tier?.is_active)
            .map(tier => tier?.price || 0)
            .filter(price => price > 0);
          
          lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
          
          if (lowestPrice > 0) {
            // For paid tickets
            totalTickets = standardTiers
              .filter(tier => tier?.price > 0)
              .reduce((sum, tier) => sum + (tier?.quantity - (tier?.paid_quantity_sold || 0)), 0);
            
            // Check if all paid tickets are sold out
            isSoldOut = standardTiers
              .filter(tier => tier?.price > 0)
              .every(tier => tier?.quantity <= (tier?.paid_quantity_sold || 0));
          } else {
            // For free tickets
            totalTickets = standardTiers
              .filter(tier => tier?.price === 0)
              .reduce((sum, tier) => sum + (tier?.quantity - (tier?.quantity_sold || 0)), 0);
            
            // Check if all free tickets are sold out
            isSoldOut = standardTiers
              .filter(tier => tier?.price === 0)
              .every(tier => tier?.quantity <= (tier?.quantity_sold || 0));
          }
        }

        // Calculate attendees (random for now)
        const attendees = Math.floor(Math.random() * 300) + 50;
        
        // Format date
        const formattedDate = event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : 'Date TBA';
        
        // Check if discounts are available
        const hasDiscounts = event.has_early_bird || event.has_multiple_buys;
        const discountAmount = Math.max(event.early_bird_discount || 0, event.multiple_buys_discount || 0);
        
        return {
          id: event.id,
          title: event.name || 'Untitled Event',
          description: event.description || 'No description available',
          date: formattedDate,
          location: event.address ? 
            `${event.address}, ${event.city || ''}${event.state ? `, ${event.state}` : ''}` : 
            `${event.city || ''}${event.state ? `, ${event.state}` : ''}`,
          address: event.address || '',
          category: event.category || 'General',
          price: isSoldOut ? 'Sold Out' : lowestPrice === 0 ? 'Free' : `₦${lowestPrice.toLocaleString()}`,
          numericPrice: lowestPrice,
          attendees: attendees,
          image: coverImage,
          isNew: true, // All events on this page are considered "new"
          ticketCount: isSoldOut ? 'No available ticket for this event' : totalTickets,
          ticket_tiers: event.ticket_tiers, // Include the ticket tiers for the ticket modal
          // Add discount information
          has_early_bird: event.has_early_bird || false,
          early_bird_discount: event.early_bird_discount || 0,
          early_bird_start_date: event.early_bird_start_date,
          early_bird_end_date: event.early_bird_end_date,
          has_multiple_buys: event.has_multiple_buys || false,
          multiple_buys_discount: event.multiple_buys_discount || 0,
          multiple_buys_min_tickets: event.multiple_buys_min_tickets || 2,
          // Display indicators
          hasDiscounts: hasDiscounts,
          discountAmount: discountAmount,
          isSoldOut: isSoldOut
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

  // Handle opening the modal with the selected event
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  // Handle closing the modal
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  // Handle opening the ticket modal
  const handleGetTickets = (event, e) => {
    if (e) {
      e.preventDefault(); // Prevent default link behavior
      e.stopPropagation(); // Stop event bubbling
    }
    
    // Format the event data specifically for the TicketModal component
    const formattedEvent = {
      ...event,
      // Ensure these fields are properly formatted for the TicketModal
      early_bird_start_date: event.early_bird_start_date ? new Date(event.early_bird_start_date).toISOString() : null,
      early_bird_end_date: event.early_bird_end_date ? new Date(event.early_bird_end_date).toISOString() : null,
      // Make sure ticket_tiers are properly formatted
      ticket_tiers: Array.isArray(event.ticket_tiers) ? event.ticket_tiers.map(tier => ({
        ...tier,
        // Ensure numeric values are properly parsed
        price: typeof tier.price === 'string' ? parseFloat(tier.price.replace(/[^\d.]/g, '')) : parseFloat(tier.price) || 0,
        quantity: parseInt(tier.quantity) || 0,
        paid_quantity_sold: parseInt(tier.paid_quantity_sold) || 0,
        quantity_sold: parseInt(tier.quantity_sold) || 0,
        // Ensure ID is present and valid
        id: tier.id || 'default',
        // Set availableQuantity for the TicketModal
        availableQuantity: tier.quantity - (tier.paid_quantity_sold || 0),
        // Set premium flag (optional for styling)
        isPremium: tier.is_premium || false,
        // Set soldOut flag
        soldOut: (tier.quantity - (tier.paid_quantity_sold || 0)) <= 0
      })) : []
    };
    
    // Store event in localStorage only once, right when the ticket modal is opened
    if (typeof window !== 'undefined' && event) {
      try {
        // First clear any existing event details to prevent duplication
        localStorage.removeItem('currentEventDetails');
        
        // Format the event date if needed
        const eventDate = event.date 
          ? (typeof event.date === 'object' ? event.date.toISOString() : event.date) 
          : new Date().toISOString();

        const eventDetails = {
          title: event.title || 'Event',
          date: eventDate,
          time: event.time || 'Time not available',
          location: event.location || 'Location not available',
          address: event.address || '',
          id: event.id,
          price: event.price,
          has_early_bird: event.has_early_bird || false,
          early_bird_discount: event.early_bird_discount || 0,
          early_bird_start_date: event.early_bird_start_date || null,
          early_bird_end_date: event.early_bird_end_date || null,
          has_multiple_buys: event.has_multiple_buys || false,
          multiple_buys_discount: event.multiple_buys_discount || 0,
          multiple_buys_min_tickets: event.multiple_buys_min_tickets || 2
        };
        
        localStorage.setItem('currentEventDetails', JSON.stringify(eventDetails));
      } catch (err) {
        console.error('Error storing event details:', err);
      }
    }
    
    setSelectedEvent(formattedEvent);
    setIsModalOpen(false);
    setShowTicketModal(true);
  };

  // Handle closing the ticket modal
  const closeTicketModal = () => {
    setShowTicketModal(false);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  // Sort events based on selected option
  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'popular') {
      return b.attendees - a.attendees;
    } else if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    return 0;
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[250px] sm:h-[300px] md:h-[350px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="New Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-600/70"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-2 sm:mb-4"
          >
            Just Added
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4"
          >
            Discover New Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-xl sm:max-w-2xl text-sm sm:text-base md:text-lg"
          >
            Be the first to experience the latest and most exciting events added to our platform
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-black">Latest Events</h2>
            <p className="text-gray-600 text-sm sm:text-base">Explore our newest additions</p>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
            <div className="relative w-full sm:w-auto max-w-xs">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setSelectedView('grid')}
                className={`p-2 ${selectedView === 'grid' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-amber-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setSelectedView('list')}
                className={`p-2 ${selectedView === 'list' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-amber-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-2">{error}</h3>
            <button 
              onClick={fetchEvents}
              className="mt-4 px-5 py-2 sm:px-6 sm:py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {selectedView === 'grid' && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              >
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((event) => (
                    <motion.div key={event.id} variants={itemVariants}>
                      <EventCard 
                        id={event.id}
                        title={event.title}
                        image={event.image}
                        date={event.date}
                        location={event.location}
                        price={event.price}
                        ticketCount={event.ticketCount}
                        onClick={() => handleEventClick(event)}
                        onGetTickets={(e) => handleGetTickets(event, e)}
                        event={event}
                        hasDiscounts={event.hasDiscounts}
                        discountAmount={event.discountAmount}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 sm:py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">No new events found</h3>
                    <p className="text-gray-500 text-sm sm:text-base">Check back soon for new events!</p>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* List View */}
            {selectedView === 'list' && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4 sm:space-y-6"
              >
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((event) => (
                    <motion.div key={event.id} variants={itemVariants}>
                      <EventListItem 
                        event={event}
                        onClick={() => handleEventClick(event)}
                        onGetTickets={(e) => handleGetTickets(event, e)}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 sm:py-20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">No new events found</h3>
                    <p className="text-gray-500 text-sm sm:text-base">Check back soon for new events!</p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
        
        {/* Pagination Controls */}
        {!isLoading && !error && events.length > 0 && (
          <div className="flex justify-center items-center mt-8 sm:mt-12">
            <nav className="flex items-center space-x-2" aria-label="Pagination">
              {/* Previous Page Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-amber-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.ceil(totalEvents / itemsPerPage) }).map((_, index) => {
                const pageNumber = index + 1;
                // Only show 5 page numbers at a time with current page in the middle if possible
                if (
                  pageNumber === 1 ||
                  pageNumber === Math.ceil(totalEvents / itemsPerPage) ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === pageNumber
                          ? 'bg-amber-500 text-white'
                          : 'text-gray-700 hover:bg-amber-100'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                }
                // Show ellipsis for skipped pages
                if (
                  (pageNumber === 2 && currentPage > 3) ||
                  (pageNumber === Math.ceil(totalEvents / itemsPerPage) - 1 && 
                   currentPage < Math.ceil(totalEvents / itemsPerPage) - 2)
                ) {
                  return <span key={pageNumber} className="px-3 py-1">...</span>;
                }
                return null;
              })}
              
              {/* Next Page Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalEvents / itemsPerPage)))}
                disabled={currentPage === Math.ceil(totalEvents / itemsPerPage)}
                className={`p-2 rounded-md ${
                  currentPage === Math.ceil(totalEvents / itemsPerPage)
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-amber-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
        
        {/* Notification Section */}
        <div className="mt-12 sm:mt-16 md:mt-20 bg-white rounded-2xl overflow-hidden shadow-xl border border-amber-100">
          <div className="grid md:grid-cols-2">
            <div className="p-6 sm:p-8 md:p-12">
              <div className="inline-block bg-amber-100 text-amber-600 px-3 py-1 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                Stay Updated
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">Never Miss a New Event</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                Get notified when new events are added that match your interests. Be the first to know and never miss out!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-grow px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                />
                <button className="bg-gradient-to-r from-amber-500 to-orange-400 text-white font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-amber-600 hover:to-orange-500 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base whitespace-nowrap">
                  Notify Me
                </button>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-2 sm:mt-3">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
            <div className="relative hidden md:block h-64 md:h-auto">
              <Image
                src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                alt="Stay updated"
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Event Preview Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModal}>
          <div 
            className="bg-white rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Close Button */}
            <div className="relative">
              <div className="h-60 sm:h-72 md:h-80 w-full relative">
                <Image
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <button 
                  onClick={closeModal}
                  className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/40 p-2 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-medium">
                  {selectedEvent.category}
                </span>
                {selectedEvent.isNew && (
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    New
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-black mb-2">{selectedEvent.title}</h2>
              
              <div className="mb-4 flex gap-4 text-gray-600 text-sm flex-wrap">
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{selectedEvent.date}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selectedEvent.location}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{selectedEvent.attendees} attending</span>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black mb-2">About this event</h3>
                <p className="text-gray-600">{selectedEvent.description}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-gray-200 pt-6">
                <div className="font-bold text-2xl text-amber-600">
                  {selectedEvent.price === 'Sold Out' ? "Sold Out" : selectedEvent.price === 'Free' ? "Free" : `₦${selectedEvent.numericPrice.toLocaleString()}`}
                  {selectedEvent.price !== 'Free' && selectedEvent.price !== 'Sold Out' && selectedEvent.ticketCount !== 'No available ticket for this event' && (
                    <div className="text-xs font-normal text-gray-500">{selectedEvent.ticketCount} tickets available</div>
                  )}
                  {selectedEvent.price === 'Free' && selectedEvent.ticketCount !== 'No available ticket for this event' && (
                    <div className="text-xs font-normal text-gray-500">{selectedEvent.ticketCount} free tickets available</div>
                  )}
                </div>
                <button 
                  onClick={(e) => handleGetTickets(selectedEvent, e)}
                  disabled={selectedEvent.ticketCount === 'No available ticket for this event'}
                  className={`px-6 py-3 text-white rounded-lg transition-colors text-center w-full sm:w-auto ${
                    selectedEvent.ticketCount === 'No available ticket for this event' 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-[#0077B6] hover:bg-[#005f92]'
                  }`}
                >
                  {selectedEvent.ticketCount === 'No available ticket for this event' ? 'Sold Out' : 'Get Tickets'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && selectedEvent && (
        <TicketModal
          event={selectedEvent}
          isOpen={showTicketModal}
          onClose={closeTicketModal}
        />
      )}
    </div>
  );
}

// Event Card Component
function EventCard({ id, title, image, date, location, price, ticketCount, onClick, onGetTickets, event, hasDiscounts, discountAmount }) {
  const isSoldOut = ticketCount === 'No available ticket for this event';
  
  // Find premium tiers
  const premiumTiers = event.ticket_tiers ? event.ticket_tiers.filter(tier => 
    tier.is_premium === true || (tier.name !== 'Standard Ticket' && tier.name !== 'Free Ticket')
  ) : [];
  
  return (
    <div className="group bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative h-48 cursor-pointer" onClick={onClick}>
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Discount badge */}
        {hasDiscounts && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {discountAmount}% OFF
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer" onClick={onClick}>{title}</h3>
        <div className="space-y-1.5 mb-3 cursor-pointer" onClick={onClick}>
          <div className="flex items-center text-gray-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {date}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </div>
        </div>
        
        {/* Discount info */}
        {hasDiscounts && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-100 rounded-md">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-2">
                <p className="text-xs font-medium text-orange-800">
                  {event.has_early_bird ? 'Early Bird Discount' : 'Volume Discount'}
                </p>
                <p className="text-xs text-orange-700">Save {discountAmount}% on tickets</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Standard Ticket */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500">Standard ticket</span>
            <p className="text-gray-900 font-medium">{price}</p>
            {price !== 'Free' && price !== 'Sold Out' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} available</span>
            )}
            {price === 'Free' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} free tickets available</span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the card's onClick
              onGetTickets(e);
            }}
            disabled={isSoldOut}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              isSoldOut 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isSoldOut ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Premium Tiers */}
        {premiumTiers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <h4 className="text-sm font-medium text-amber-700 mb-2">Premium Tickets</h4>
            {premiumTiers.map((tier, index) => {
              const tierAvailable = (tier.quantity || 0) - (tier.paid_quantity_sold || 0);
              return (
                <div key={tier.id || index} className="mb-2 pb-2 last:mb-0 last:pb-0 border-b last:border-b-0 border-dashed border-amber-100">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-amber-800">{tier.name}</span>
                    <span className="text-sm font-bold text-amber-800">₦{parseFloat(tier.price).toLocaleString()}</span>
                  </div>
                  {tier.description && (
                    <p className="text-xs text-amber-600 mt-0.5 mb-1">{tier.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-amber-600">{tierAvailable > 0 ? `${tierAvailable} available` : 'Sold out'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGetTickets(e);
                      }}
                      disabled={tierAvailable <= 0}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        tierAvailable <= 0
                          ? 'bg-amber-100 text-amber-300 cursor-not-allowed'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      Get Tickets
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Event List Item Component
function EventListItem({ event, onClick, onGetTickets }) {
  // Find premium tiers
  const premiumTiers = event.ticket_tiers ? event.ticket_tiers.filter(tier => 
    tier.is_premium === true || (tier.name !== 'Standard Ticket' && tier.name !== 'Free Ticket')
  ) : [];

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-48 md:w-64 h-40 sm:h-full cursor-pointer" onClick={() => onClick(event)}>
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {event.isNew && (
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-amber-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium">
              New
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6 flex-grow">
          <div className="flex flex-wrap items-center gap-2 mb-2 cursor-pointer" onClick={() => onClick(event)}>
            <div className="bg-amber-100 text-amber-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium">
              {event.category}
            </div>
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600 text-xs sm:text-sm">{event.date}</span>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 group-hover:text-amber-600 transition-colors text-black cursor-pointer" onClick={() => onClick(event)}>{event.title}</h3>
          <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-base line-clamp-2 cursor-pointer" onClick={() => onClick(event)}>{event.description}</p>
          
          {/* Standard Ticket */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 cursor-pointer" onClick={() => onClick(event)}>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-500 text-xs sm:text-sm">{event.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-gray-500 text-xs sm:text-sm">{event.attendees} attending</span>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 mt-2 sm:mt-0">
              <span className="font-bold text-amber-600 text-base sm:text-lg">{event.price === 'Sold Out' ? "Sold Out" : event.price === 'Free' ? "Free" : `₦${event.numericPrice.toLocaleString()}`}</span>
              <button 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm ${
                  event.ticketCount === 'No available ticket for this event'
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500'
                } transition-colors`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (event.ticketCount !== 'No available ticket for this event') {
                    onGetTickets(e);
                  }
                }}
                disabled={event.ticketCount === 'No available ticket for this event'}
              >
                {event.ticketCount === 'No available ticket for this event' ? 'Sold Out' : 'Get Tickets'}
              </button>
            </div>
          </div>
          
          {/* Premium Tiers */}
          {premiumTiers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-200">
              <h4 className="text-sm font-medium text-amber-700 mb-2">Premium Tickets</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {premiumTiers.map((tier, index) => {
                  const tierAvailable = (tier.quantity || 0) - (tier.paid_quantity_sold || 0);
                  return (
                    <div key={tier.id || index} className="border border-amber-100 rounded-md p-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-amber-800">{tier.name}</span>
                        <span className="text-sm font-bold text-amber-800">₦{parseFloat(tier.price).toLocaleString()}</span>
                      </div>
                      {tier.description && (
                        <p className="text-xs text-amber-600 mb-1.5 line-clamp-1">{tier.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-amber-600">{tierAvailable > 0 ? `${tierAvailable} available` : 'Sold out'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGetTickets(e);
                          }}
                          disabled={tierAvailable <= 0}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            tierAvailable <= 0
                              ? 'bg-amber-100 text-amber-300 cursor-not-allowed'
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                        >
                          Get Tickets
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Trending Event Card Component
function TrendingEventCard({ id, title, image, date, location, price, category = "Trending", rating = 4.5, reviews = 27, ticketCount, onClick, onGetTickets }) {
  const isSoldOut = ticketCount === 'No available ticket for this event';
  
  return (
    <div onClick={onClick} className="group flex flex-col md:flex-row bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
      <div className="relative md:w-2/5 h-64 md:h-auto">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-4 left-4">
          <div className="bg-white px-3 py-1 text-xs font-medium text-gray-700">
          {category}
          </div>
        </div>
      </div>
      <div className="p-6 md:w-3/5 flex flex-col justify-between">
        <div>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <div className="flex text-gray-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-gray-900' : 'text-gray-300'}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600">{rating} ({reviews} reviews)</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 line-clamp-2">{title}</h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
              {date}
          </div>
            <div className="flex items-center text-gray-600 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
              {location}
          </div>
        </div>
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500">Starting from</span>
            <p className="text-gray-900 font-medium">{price}</p>
            {price !== 'Free' && price !== 'Sold Out' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} tickets available</span>
            )}
            {price === 'Free' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} free tickets available</span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the card's onClick
              onGetTickets(e);
            }}
            disabled={isSoldOut}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              isSoldOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isSoldOut ? 'Sold Out' : 'Get Tickets'}
            {!isSoldOut && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}