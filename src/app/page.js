'use client';

import Image from "next/image";
import Link from "next/link";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import TicketModal from '../components/TicketModal';

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setErrorMessage('Database connection error');
        return;
      }

      // Fetch all events from the database
      const { data: events, error } = await supabase
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
            is_premium,
            description,
            tier_price,
            tier_quantity,
            tier_description
          )
        `);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        setErrorMessage('Error loading events');
        return;
      }

      if (!events || events.length === 0) {
        console.log('No events found in the database');
        setUpcomingEvents([]);
        return;
      }

      console.log(`Successfully fetched ${events.length} events`);
      
      // Process events
      const processedEvents = events.map(event => {
        // Safely handle missing related data
        const eventImages = Array.isArray(event.event_images) ? event.event_images : [];
        const ticketTiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers : [];
        
        const coverImage = eventImages.find(img => img?.is_cover)?.image_url || '/placeholder-event.jpg';
        
        let lowestPrice = 0;
        let totalTickets = 0;
        let isSoldOut = false;
        
        if (ticketTiers.length > 0) {
          const prices = ticketTiers.map(tier => tier?.price || 0).filter(price => price > 0);
          lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
          
          if (lowestPrice > 0) {
            // For paid tickets
            totalTickets = ticketTiers
              .filter(tier => tier?.price > 0)
              .reduce((sum, tier) => sum + (tier?.quantity - (tier?.paid_quantity_sold || 0)), 0);
            
            // Check if all paid tickets are sold out
            isSoldOut = ticketTiers
              .filter(tier => tier?.price > 0)
              .every(tier => tier?.quantity <= (tier?.paid_quantity_sold || 0));
          } else {
            // For free tickets
            totalTickets = ticketTiers
              .filter(tier => tier?.price === 0)
              .reduce((sum, tier) => sum + (tier?.quantity - (tier?.quantity_sold || 0)), 0);
            
            // Check if all free tickets are sold out
            isSoldOut = ticketTiers
              .filter(tier => tier?.price === 0)
              .every(tier => tier?.quantity <= (tier?.quantity_sold || 0));
          }
        }
        
        // Check if discounts are available
        const hasDiscounts = event.has_early_bird || event.has_multiple_buys;
        const discountAmount = Math.max(event.early_bird_discount || 0, event.multiple_buys_discount || 0);
        
        return {
          id: event.id,
          title: event.name || 'Untitled Event',
          image: coverImage,
          eventDate: event.event_date ? new Date(event.event_date) : null, // Store the actual Date object
          date: event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          }) : 'Date TBA',
          time: event.start_time || 'Time TBA',
          location: event.address ? 
            `${event.address}, ${event.city || ''}${event.state ? `, ${event.state}` : ''}` : 
            `${event.city || ''}${event.state ? `, ${event.state}` : ''}`,
          address: event.address || '',
          price: lowestPrice === 0 ? 'Free' : `₦${lowestPrice.toLocaleString()}`,
          ticketCount: isSoldOut ? 'No available ticket for this event' : totalTickets,
          description: event.description,
          // Discount info
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
          isSoldOut: isSoldOut,
          ticket_tiers: ticketTiers, // Include the full ticket_tiers array
        };
      });

      // Sort events by date in descending order (newest first)
      const sortedEvents = processedEvents.sort((a, b) => {
        if (!a.eventDate) return 1;  // Null dates go to the end
        if (!b.eventDate) return -1;
        return b.eventDate - a.eventDate;
      });

      // Set all events in the state variables
      setFeaturedEvents(sortedEvents.slice(0, 3));
      setTrendingEvents(sortedEvents.slice(0, 2));
      setUpcomingEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Provide more detailed error information
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setErrorMessage('Network connection error. Please check your internet connection.');
      } else {
        setErrorMessage(`Error: ${error.message || 'Unknown error occurred'}`);
      }
      setUpcomingEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle event card click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Function to handle "Get Tickets" button click
  const handleGetTickets = (event, e) => {
    if (e) {
      e.preventDefault(); // Prevent default link behavior
      e.stopPropagation(); // Stop event bubbling
    }
    
    console.log('Get Tickets clicked for event:', event.title);
    
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
    
    // Set the selected event and show the ticket modal
    setSelectedEvent(formattedEvent);
    closeModal(); // Close the preview modal if it's open
    setShowTicketModal(true);
  };

  // Function to close the ticket modal
  const closeTicketModal = () => {
    setShowTicketModal(false);
  };

  // If error or no events found, display a message
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center p-6 text-center my-12">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          <button 
            onClick={fetchEvents}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // If loading, display a loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
        <Navbar />
        <div className="flex justify-center items-center h-64 my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[600px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/70"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pt-16 md:pt-0">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-gray-300 text-3xl md:text-4xl mb-3 font-light tracking-wide mt-8 md:mt-0"
          >
            Discover & Experience
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight"
          >
            <span className="block">Find Your Perfect</span>
            <motion.span 
              initial={{ backgroundPosition: "200% 0" }}
              animate={{ backgroundPosition: "0% 0" }}
              transition={{ duration: 1.5, delay: 0.4 }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Event Experience
            </motion.span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white max-w-xl mb-10 text-lg"
          >
            Connect with thousands of events happening around you. From concerts to workshops, find what moves you.
          </motion.p>
          
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col md:flex-row w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:shadow-black/20 hover:-translate-y-1"
          >
            <div className="flex-1 flex flex-col md:flex-row bg-white">
              <div className="flex items-center px-4 py-3 md:py-0 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search for events, concerts, workshops..."
                  className="w-full p-3 text-black outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center px-4 py-3 md:py-0 flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full p-3 text-black outline-none bg-transparent"
                />
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-black text-white px-8 py-4 font-medium transition-all hover:bg-gray-800"
            >
              Discover Events
            </motion.button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center mt-8 text-white/80 text-sm"
          >
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white">10,000+ Events</span>
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white">Trusted Platform</span>
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white">Secure Payments</span>
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Featured Events Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-black">Featured Events</h2>
              <p className="text-gray-600">Discover the most popular events in your area</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-full text-sm text-black hover:bg-gray-50 transition-colors">
                This Weekend
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-full text-sm text-black hover:bg-gray-50 transition-colors">
                This Month
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-full text-sm hover:from-amber-600 hover:to-orange-500 transition-colors">
                View All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => handleEventClick(event)}
                onGetTickets={() => handleGetTickets(event)}
              />
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-black">Browse Categories</h2>
              <p className="text-gray-600 mb-2">Find events that match your interests</p>
            </div>
            <Link href="/categories" className="mt-4 md:mt-0 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-lg transition-all duration-300 flex items-center">
              View All Categories
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <CategoryCard icon="🎵" title="Music" count="1,200+ Events" bgColor="bg-gray-50" accentColor="text-gray-900" hoverColor="group-hover:bg-gray-100" />
            <CategoryCard icon="🏃" title="Sports" count="800+ Events" bgColor="bg-gray-50" accentColor="text-gray-900" hoverColor="group-hover:bg-gray-100" />
            <CategoryCard icon="🎨" title="Arts" count="650+ Events" bgColor="bg-gray-50" accentColor="text-gray-900" hoverColor="group-hover:bg-gray-100" />
            <CategoryCard icon="💼" title="Business" count="450+ Events" bgColor="bg-gray-50" accentColor="text-gray-900" hoverColor="group-hover:bg-gray-100" />
            <CategoryCard icon="📸" title="Photography" count="320+ Events" bgColor="bg-gray-50" accentColor="text-gray-900" hoverColor="group-hover:bg-gray-100" />
            <CategoryCard icon="📚" title="Training" count="280+ Events" bgColor="bg-gray-50" accentColor="text-gray-900" hoverColor="group-hover:bg-gray-100" />
          </div>
        </div>

        {/* Trending Events Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-black">Trending This Week</h2>
              <p className="text-gray-600">Don&apos;t miss out on the hottest events</p>
            </div>
            <Link href="/explore" className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-500 transition-colors flex items-center">
              Explore All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trendingEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => handleEventClick(event)}
                onGetTickets={() => handleGetTickets(event)}
              />
            ))}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-black">Upcoming Events</h2>
              <p className="text-gray-600">Plan ahead for these amazing experiences</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <FilterButton active={true} onClick={() => {}}>All Events</FilterButton>
              <FilterButton active={false} onClick={() => {}}>Today</FilterButton>
              <FilterButton active={false} onClick={() => {}}>This Week</FilterButton>
              <FilterButton active={false} onClick={() => {}}>This Month</FilterButton>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {upcomingEvents.slice(0, 8).map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => handleEventClick(event)}
                onGetTickets={() => handleGetTickets(event)}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-black"></div>
          
          {/* Animated shine effect */}
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
          
          {/* Shine overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[10px] opacity-30 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-45deg] animate-shine"></div>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-10 md:p-16">
            <div className="text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Elevate Your Events with EventTips</h2>
              <p className="text-white/80 max-w-xl">
                From venue selection to ticket management, our platform provides everything you need to create memorable experiences that your attendees will love.
              </p>
            </div>
            <div className="w-full md:w-auto">
              <div className="relative h-48 w-full md:w-64 rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                  alt="Event hosting"
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Event Preview Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Modal backdrop */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-800 opacity-80"></div>
            </div>
            
            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="relative">
                {/* Cover image */}
                <div className="relative h-48 sm:h-64 w-full">
                  <Image 
                    src={selectedEvent.image} 
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  
                  {/* Event details on image */}
                  <div className="absolute bottom-0 left-0 p-4 text-white">
                    <h2 className="text-xl sm:text-2xl font-bold mb-1">{selectedEvent.title}</h2>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {selectedEvent.date}
                      </span>
                      
                      <span className="inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {selectedEvent.location}
                      </span>
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <div className="absolute top-0 right-0 p-4 z-10">
                    <button 
                      onClick={closeModal}
                      className="bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Modal Content with smooth scroll */}
              <div className="max-h-[50vh] overflow-y-auto p-4 sm:p-6 scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                    {selectedEvent.category || "Event"}
                  </span>
                  {selectedEvent.hasDiscounts && (
                    <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                      {selectedEvent.discountAmount}% off
                    </span>
                  )}
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black mb-2">About this event</h3>
                  <p className="text-gray-600 text-sm">{selectedEvent.description}</p>
                </div>
                
                {/* Quick navigation buttons */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button 
                    onClick={() => document.getElementById('standard-ticket').scrollIntoView()}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Standard Ticket
                  </button>
                  {selectedEvent.ticket_tiers && selectedEvent.ticket_tiers.filter(tier => tier.is_premium).length > 0 && (
                    <button 
                      onClick={() => document.getElementById('premium-tickets').scrollIntoView()}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Premium Tickets
                    </button>
                  )}
                </div>
                
                {/* Standard Ticket */}
                <div id="standard-ticket" className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-base font-semibold text-black">Standard Ticket</h4>
                    <span className="font-bold text-lg text-black">
                      {selectedEvent.isSoldOut ? 'Sold Out' : selectedEvent.price}
                    </span>
                  </div>
                  {!selectedEvent.isSoldOut && selectedEvent.ticketCount && (
                    <p className="text-sm text-gray-600 mb-2">{selectedEvent.ticketCount} tickets available</p>
                  )}
                  <button 
                    onClick={(e) => handleGetTickets(selectedEvent, e)}
                    disabled={selectedEvent.isSoldOut}
                    className={`mt-2 w-full px-4 py-2 rounded-lg transition-colors ${
                      selectedEvent.isSoldOut 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-black hover:bg-gray-800 text-white font-medium'
                    }`}
                  >
                    {selectedEvent.isSoldOut ? 'Sold Out' : 'Get Tickets'}
                  </button>
                </div>
                
                {/* Premium Tiers */}
                {selectedEvent.ticket_tiers && selectedEvent.ticket_tiers.filter(tier => tier.is_premium).length > 0 && (
                  <div id="premium-tickets" className="mt-4">
                    <h3 className="text-lg font-semibold text-black mb-3">Premium Tickets</h3>
                    <div className="space-y-3">
                      {selectedEvent.ticket_tiers.filter(tier => tier.is_premium).map((tier, index) => {
                        const tierAvailable = (tier.quantity || 0) - (tier.paid_quantity_sold || 0);
                        return (
                          <div key={tier.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <div className="flex items-center">
                                  <h4 className="text-sm font-semibold text-black">{tier.name}</h4>
                                  <span className="ml-2 px-2 py-0.5 bg-black text-white rounded-full text-xs font-medium">Premium</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                  {tier.description || 'No description provided'}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-black">₦{parseFloat(tier.price).toLocaleString()}</div>
                                <div className="text-xs text-gray-600">per ticket</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-600">{tierAvailable > 0 ? `${tierAvailable} available` : 'Sold out'}</div>
                              <button
                                onClick={(e) => handleGetTickets(selectedEvent, e)}
                                disabled={tierAvailable <= 0}
                                className={`px-4 py-2 rounded text-sm transition-colors ${
                                  tierAvailable <= 0
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800'
                                }`}
                              >
                                {tierAvailable <= 0 ? 'Sold Out' : 'Get Tickets'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Get all tickets button */}
                <button 
                  onClick={(e) => handleGetTickets(selectedEvent, e)}
                  disabled={selectedEvent.isSoldOut}
                  className={`mt-4 w-full py-3 rounded-lg transition-colors text-center ${
                    selectedEvent.isSoldOut 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-black hover:bg-gray-800 text-white font-medium'
                  }`}
                >
                  {selectedEvent.isSoldOut ? 'Event Sold Out' : 'View All Ticket Options'}
                </button>
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

      <Footer />
    </div>
  );
}

// Featured Event Card Component
function FeaturedEventCard({ id, title, image, date, location, price, category = "Featured", attendees = "100+ attending", ticketCount, hasDiscounts, discountAmount, onClick, onGetTickets }) {
  const isSoldOut = ticketCount === 'No available ticket for this event';
  
  return (
    <div onClick={onClick} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div className="relative h-64">
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
        
        {/* Discount Badge - Show only if there are discounts */}
        {hasDiscounts && (
          <div className="absolute top-4 right-4">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-orange-500 text-white rounded-full shadow-sm">
              Up to {discountAmount}% off
            </span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center text-gray-500 text-sm mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {attendees}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">{title}</h3>
        <div className="space-y-2 mb-4">
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
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500">Starting from</span>
            <p className="text-gray-900 font-medium">{price}</p>
            {price !== 'Free' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} tickets available</span>
            )}
            {price === 'Free' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} free tickets available</span>
            )}
          </div>
          <button 
            onClick={onGetTickets} 
            disabled={isSoldOut}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              isSoldOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
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

// Trending Event Card Component
function TrendingEventCard({ id, title, image, date, location, price, category = "Trending", rating = 4.5, reviews = 27, ticketCount, hasDiscounts, discountAmount, onClick, onGetTickets }) {
  const isSoldOut = ticketCount === 'No available ticket for this event';
  
  return (
    <div onClick={onClick} className="group flex flex-col md:flex-row bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
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
        
        {/* Discount Badge - Show only if there are discounts */}
        {hasDiscounts && (
          <div className="absolute top-4 right-4">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-orange-500 text-white rounded-full shadow-sm">
              Up to {discountAmount}% off
            </span>
          </div>
        )}
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
            {price !== 'Free' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} tickets available</span>
            )}
            {price === 'Free' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} free tickets available</span>
            )}
          </div>
          <button 
            onClick={onGetTickets}
            disabled={isSoldOut}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              isSoldOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
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

// Event Card Component
function EventCard({ event, onClick, onGetTickets }) {
  // Check if discounts are available
  const hasDiscounts = event.has_early_bird || event.has_multiple_buys;
  const discountAmount = Math.max(event.early_bird_discount || 0, event.multiple_buys_discount || 0);
  
  // Find premium tiers
  const premiumTiers = event.ticket_tiers ? event.ticket_tiers.filter(tier => 
    tier.is_premium === true || (tier.name !== 'Standard Ticket' && tier.name !== 'Free Ticket')
  ) : [];
  
  // Find the standard tier to display the correct price
  const standardTier = event.ticket_tiers ? event.ticket_tiers.find(tier => 
    !tier.is_premium && (tier.name === 'Standard Ticket' || tier.name === 'Free Ticket')
  ) : null;
  
  // Get the standard tier price from tier_price if available
  const standardPrice = standardTier && standardTier.tier_price ? 
    `₦${parseFloat(standardTier.tier_price).toLocaleString()}` : 
    event.price;
  
  return (
    <div className="relative flex flex-col overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200 h-[420px]">
      {/* Event Image */}
      <div 
        className="relative h-40 cursor-pointer"
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
        <div className="absolute top-2 left-2">
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-black text-white rounded-full shadow-sm">
            {event.category || 'Event'}
          </span>
        </div>
        
        {/* Discount Badge - Show only if there are discounts */}
        {hasDiscounts && (
          <div className="absolute top-2 right-2">
            <span className="inline-block px-2 py-1 text-xs font-semibold bg-black text-white rounded-full shadow-sm">
              {discountAmount}% off
            </span>
          </div>
        )}
      </div>
      
      {/* Event Content */}
      <div className="p-3 flex-grow cursor-pointer overflow-hidden" onClick={onClick}>
        <h3 className="text-md font-semibold text-slate-900 mb-1 line-clamp-1">{event.title}</h3>
        
        <div className="mb-2">
          <p className="text-xs text-slate-600 line-clamp-2">{event.description}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-start space-x-2">
            <svg className="w-3 h-3 text-slate-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-slate-600">{event.date}</span>
          </div>
          
          {event.time && (
            <div className="flex items-start space-x-2">
              <svg className="w-3 h-3 text-slate-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-slate-600">{event.time}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-start space-x-2">
              <svg className="w-3 h-3 text-slate-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-slate-600">{event.location}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Standard Ticket */}
      <div className="flex items-center justify-between border-t border-slate-200 p-3 mt-auto">
        <div>
          <span className="text-xs text-gray-500">Standard ticket</span>
          <p className="text-sm font-semibold text-black">
            {event.isSoldOut ? 'Sold Out' : standardPrice}
          </p>
          {event.price !== 'Free' && event.price !== 'Sold Out' && event.ticketCount !== 'No available ticket for this event' && (
            <span className="text-xs text-gray-500">{event.ticketCount} available</span>
          )}
        </div>
        
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onGetTickets(e);
          }}
          disabled={event.isSoldOut}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            event.isSoldOut 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {event.isSoldOut ? 'Sold Out' : 'Get Tickets'}
        </button>
      </div>
      
      {/* Premium Tiers */}
      {premiumTiers && premiumTiers.length > 0 && (
        <div className="px-3 pb-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-black my-2">Premium Tickets</h4>
          <div className="space-y-2">
            {premiumTiers.slice(0, 1).map((tier, index) => {
              const tierAvailable = (tier.quantity || 0) - (tier.paid_quantity_sold || 0);
              return (
                <div key={tier.id || index} className="bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-black">
                      {tier.name}
                    </span>
                    <span className="text-xs font-bold text-black">
                      ₦{parseFloat(tier.price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-600">{tierAvailable > 0 ? `${tierAvailable} available` : 'Sold out'}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGetTickets(e);
                      }}
                      disabled={tierAvailable <= 0}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        tierAvailable <= 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {tierAvailable <= 0 ? 'Sold Out' : 'Get Tickets'}
                    </button>
                  </div>
                </div>
              );
            })}
            {premiumTiers.length > 1 && (
              <div className="text-xs text-center text-gray-500">
                +{premiumTiers.length - 1} more premium {premiumTiers.length - 1 === 1 ? 'tier' : 'tiers'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Category Card Component
function CategoryCard({ icon, title, count, bgColor = "bg-gray-50", accentColor = "text-gray-900", hoverColor = "group-hover:bg-gray-100" }) {
  return (
    <Link href={`/categories?category=${encodeURIComponent(title.toLowerCase())}`} className="group bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`${bgColor} w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${hoverColor} transition-colors`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{count}</p>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View Events
        </div>
      </div>
    </Link>
  );
}

// Filter Button Component
function FilterButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
