'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';
import TicketModal from '../../components/TicketModal';

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedExactCategory, setSelectedExactCategory] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(9);
  
  // Event Preview modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Initial featured categories state definition with online images
  const [featuredCategories, setFeaturedCategories] = useState([
    {
      id: 1,
      name: "Music",
      slug: "music",
      icon: "🎵",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
      eventCount: "0",
      exactCategory: "music"
    },
    {
      id: 2,
      name: "Sports",
      slug: "sports",
      icon: "🏆",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop",
      eventCount: "0",
      exactCategory: "sports"
    },
    {
      id: 3,
      name: "Food",
      slug: "food",
      icon: "🍽️",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop",
      eventCount: "0",
      exactCategory: "food"
    },
    {
      id: 4,
      name: "Technology",
      slug: "technology",
      icon: "💻",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop",
      eventCount: "0",
      exactCategory: "technology"
    },
    {
      id: 5,
      name: "Training",
      slug: "training",
      icon: "📚",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
      eventCount: "0",
      exactCategory: "training"
    }
  ]);

  // Move fetchEvents function definition above its usage in useEffect
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        setError('Database connection error. Please try again later.');
        return;
      }

      // Fetch all events from the database
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
        `);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        setError('Failed to load events');
        return;
      }

      if (!eventsData || eventsData.length === 0) {
        console.log('No events found in the database');
        setEvents([]);
        setFilteredEvents([]);
        return;
      }

      console.log(`Successfully fetched ${eventsData.length} events`);
      
      // Process events
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
        
        if (ticketTiers.length > 0) {
          const prices = ticketTiers
            .filter(tier => tier?.is_active)
            .map(tier => tier?.price || 0)
            .filter(price => price > 0);
          
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

        // Calculate attendees (random for now)
        const attendees = Math.floor(Math.random() * 300) + 50;
        
        // Format date
        const formattedDate = event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : 'Date TBA';
        
        // Determine category for better organization
        const categoryType = getCategoryType(event.category);
        
        // Check if discounts are available
        const hasDiscounts = event.has_early_bird || event.has_multiple_buys;
        const discountAmount = Math.max(event.early_bird_discount || 0, event.multiple_buys_discount || 0);
        
        return {
          id: event.id,
          title: event.name || 'Untitled Event',
          description: event.description || 'No description available',
          date: formattedDate,
          time: event.start_time || 'Time TBA',
          location: `${event.city || ''}${event.state ? `, ${event.state}` : ''}` || 'Location TBA',
          category: event.category || 'General',
          categoryType: categoryType,
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

      // Update event count for each category
      const updatedCategories = [...featuredCategories];
      updatedCategories.forEach(category => {
        const count = processedEvents.filter(event => 
          event.category && event.category.toLowerCase() === category.exactCategory.toLowerCase()
        ).length;
        category.eventCount = count.toString();
      });
      
      setFeaturedCategories(updatedCategories);
      setEvents(processedEvents);
      setFilteredEvents(processedEvents);
      
    } catch (error) {
      console.error('Error fetching events:', error);
      // Provide more detailed error information
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setError('Network connection error. Please check your internet connection.');
      } else {
        setError(`Error: ${error.message || 'Unknown error occurred'}`);
      }
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    console.log('Categories component mounted, fetching events...');
    fetchEvents();
  }, []); // Remove fetchEvents from dependency array

  // Move filterEvents above the useEffect that depends on it
  const filterEvents = useCallback(() => {
    if (!events || !Array.isArray(events) || events.length === 0) {
      setFilteredEvents([]);
      return;
    }
    
    let filtered = [...events];
    
    // Filter by exact category if specified
    if (selectedExactCategory) {
      console.log(`Filtering by exact category: ${selectedExactCategory}`);
      filtered = filtered.filter(event => 
        event.category && event.category.toLowerCase() === selectedExactCategory.toLowerCase()
      );
    }
    // Otherwise filter by category type
    else if (activeCategory !== 'all') {
      if (activeCategory === 'sports') {
        // Direct category match for sports
        filtered = filtered.filter(event => 
          event.category && event.category.toLowerCase() === 'sports' || 
          event.category && event.category.toLowerCase() === 'dfgdfg'
        );
      } else if (activeCategory === 'entertainment') {
        // Music and related categories
        filtered = filtered.filter(event => 
          event.category && ['music', 'srmrgrew', 'svds'].includes(event.category.toLowerCase())
        );
      } else {
        // Use the categoryType function for other categories
        filtered = filtered.filter(event => 
          event.categoryType === activeCategory
        );
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      // Direct search by category value
      filtered = filtered.filter(event => 
        (event.title && event.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.category && event.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      console.log(`Search for "${searchQuery}" returned ${filtered.length} results`);
    }
    
    console.log(`Filtered to ${filtered.length} events`);
    setFilteredEvents(filtered);
  }, [events, activeCategory, selectedExactCategory, searchQuery]);

  // Filter events when activeCategory, selectedExactCategory or searchQuery changes
  useEffect(() => {
    if (events && events.length > 0) {
      console.log('Filtering events based on new criteria');
      filterEvents();
    }
  }, [events, activeCategory, selectedExactCategory, searchQuery, filterEvents]);

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

  // If loading takes more than 10 seconds, show a timeout message
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Determine whether to show the fallback UI
  const showFallback = (!loading && filteredEvents.length === 0 && !error);

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
    
    // Store event in localStorage for the ticket generation
    if (typeof window !== 'undefined') {
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
    setShowModal(false); // Close the preview modal if it's open
    setShowTicketModal(true);
  };

  // Function to close the ticket modal
  const closeTicketModal = () => {
    setShowTicketModal(false);
  };

  // Function to handle page change
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to event listings when paginating
    document.getElementById('event-listings').scrollIntoView({ behavior: 'smooth' });
  };

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      document.getElementById('event-listings').scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Go to next page
  const goToNextPage = () => {
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      document.getElementById('event-listings').scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculate current events to display based on pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedExactCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <Navbar />
      
      {/* Hero Section - Updated with amber/orange theme */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Event Categories"
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
            Event Categories
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-2xl text-base sm:text-lg drop-shadow"
          >
            Explore events by category and find experiences that match your interests
          </motion.p>
        </div>
      </div>
      
      {/* Main Content - Enhanced with amber/orange accents */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Search Bar - Redesigned */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search categories or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 pl-12 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-800 shadow-sm"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-amber-500 absolute left-4 top-1/2 transform -translate-y-1/2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500 mb-6"></div>
            {loadingTimeout && (
              <div className="text-center">
                <p className="text-gray-600 mb-3">Taking longer than expected...</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-amber-600 font-medium hover:underline transition-all"
                >
                  Refresh the page
                </button>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="bg-red-50 rounded-full p-4 inline-flex mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">{error}</h3>
            <button 
              onClick={fetchEvents}
              className="mt-4 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : showFallback ? (
          <>
            {/* Featured Categories with No Events Message - Enhanced Design */}
        <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-gray-800 flex items-center justify-center">
                <span className="inline-block w-8 h-1 bg-amber-500 mr-3 rounded-full"></span>
                Featured Categories
                <span className="inline-block w-8 h-1 bg-amber-500 ml-3 rounded-full"></span>
              </h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {featuredCategories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                    <FeaturedCategoryCard 
                      category={category}
                      onClick={() => {
                        setActiveCategory('all');
                        setSelectedExactCategory(category.exactCategory);
                        document.getElementById('event-listings').scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
              </motion.div>
            ))}
          </motion.div>
        </div>
        
            {/* Category Tabs - Enhanced Design */}
            <div className="mb-8" id="event-listings">
              <div className="flex flex-wrap justify-center gap-3 mb-10 overflow-x-auto py-2">
            <CategoryTab 
                  active={activeCategory === 'all' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('all');
                    setSelectedExactCategory(null);
                  }}
            >
              All Categories
            </CategoryTab>
            <CategoryTab 
                  active={activeCategory === 'entertainment' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('entertainment');
                    setSelectedExactCategory(null);
                  }}
            >
              Entertainment
            </CategoryTab>
            <CategoryTab 
                  active={activeCategory === 'business' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('business');
                    setSelectedExactCategory(null);
                  }}
            >
              Business
            </CategoryTab>
            <CategoryTab 
                  active={activeCategory === 'lifestyle' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('lifestyle');
                    setSelectedExactCategory(null);
                  }}
            >
              Lifestyle
            </CategoryTab>
            <CategoryTab 
                  active={activeCategory === 'education' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('education');
                    setSelectedExactCategory(null);
                  }}
            >
              Education
            </CategoryTab>
            <CategoryTab 
              active={activeCategory === 'training' && !selectedExactCategory} 
              onClick={() => {
                setActiveCategory('training');
                setSelectedExactCategory(null);
              }}
            >
              Training
            </CategoryTab>
          </div>
          
              {/* No Events Message - Enhanced Design */}
              <div className="text-center py-16 px-4 bg-white rounded-xl shadow-md">
                <div className="bg-gray-50 rounded-full p-6 inline-flex mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-3">Oops! No events under this category</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">Check back later for exciting events in this category.</p>
                <button 
                  onClick={fetchEvents} 
                  className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Featured Categories with Real Events - Enhanced Design */}
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-gray-800 flex items-center justify-center">
                <span className="inline-block w-8 h-1 bg-amber-500 mr-3 rounded-full"></span>
                Featured Categories
                <span className="inline-block w-8 h-1 bg-amber-500 ml-3 rounded-full"></span>
              </h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
                {featuredCategories.map((category) => (
                  <motion.div key={category.id} variants={itemVariants}>
                    <FeaturedCategoryCard 
                      category={category}
                      onClick={() => {
                        setActiveCategory('all');
                        setSelectedExactCategory(category.exactCategory);
                        document.getElementById('event-listings').scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            {/* Category Tabs - Enhanced Design */}
            <div className="mb-8" id="event-listings">
              <div className="flex flex-wrap justify-center gap-3 mb-10 overflow-x-auto py-2">
                <CategoryTab 
                  active={activeCategory === 'all' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('all');
                    setSelectedExactCategory(null);
                  }}
                >
                  All Categories
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'entertainment' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('entertainment');
                    setSelectedExactCategory(null);
                  }}
                >
                  Entertainment
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'business' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('business');
                    setSelectedExactCategory(null);
                  }}
                >
                  Business
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'lifestyle' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('lifestyle');
                    setSelectedExactCategory(null);
                  }}
                >
                  Lifestyle
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'education' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('education');
                    setSelectedExactCategory(null);
                  }}
                >
                  Education
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'training' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('training');
                    setSelectedExactCategory(null);
                  }}
                >
                  training
                </CategoryTab>
              </div>
              
              {/* Results Info - New Addition */}
              {filteredEvents.length > 0 && (
                <div className="text-center mb-8">
                  <p className="text-gray-600">
                    Showing <span className="font-bold text-amber-600">{indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, filteredEvents.length)}</span> of <span className="font-bold text-amber-600">{filteredEvents.length}</span> events 
                    {selectedExactCategory && ` in ${selectedExactCategory}`}
                    {activeCategory !== 'all' && !selectedExactCategory && ` in ${activeCategory}`}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                </div>
              )}
              
              {/* Events Grid - Enhanced Design */}
              {filteredEvents.length > 0 ? (
                <>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {currentEvents.map((event) => (
                      <motion.div key={event.id} variants={itemVariants}>
                        <EventCard 
                          event={event} 
                          onClick={handleEventClick} 
                          onGetTickets={handleGetTickets}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  {/* Pagination Controls */}
                  {filteredEvents.length > eventsPerPage && (
                    <div className="mt-10 flex justify-center">
                      <div className="flex items-center gap-2">
                        {/* Previous Page Button */}
                        <button 
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`flex items-center justify-center w-10 h-10 rounded-md ${
                            currentPage === 1 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
                          }`}
                          aria-label="Previous page"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: Math.ceil(filteredEvents.length / eventsPerPage) }).map((_, index) => {
                          // Calculate the page number
                          const pageNumber = index + 1;
                          const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
                          
                          // Logic for displaying pages
                          // Always show first page, current page, last page
                          // and one page before and after current page
                          if (
                            pageNumber === 1 || 
                            pageNumber === totalPages || 
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <button 
                                key={pageNumber}
                                onClick={() => paginate(pageNumber)}
                                className={`flex items-center justify-center w-10 h-10 rounded-md ${
                                  currentPage === pageNumber 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
                                }`}
                                aria-current={currentPage === pageNumber ? 'page' : undefined}
                                aria-label={`Page ${pageNumber}`}
                              >
                                {pageNumber}
                              </button>
                            );
                          } else if (
                            (pageNumber === 2 && currentPage > 3) || 
                            (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                          ) {
                            // Show ellipsis
                            return (
                              <span 
                                key={pageNumber} 
                                className="flex items-center justify-center w-10 h-10 text-gray-500"
                              >
                                &hellip;
                              </span>
                            );
                          }
                          
                          return null;
                        })}
                        
                        {/* Next Page Button */}
                        <button 
                          onClick={goToNextPage}
                          disabled={currentPage === Math.ceil(filteredEvents.length / eventsPerPage)}
                          className={`flex items-center justify-center w-10 h-10 rounded-md ${
                            currentPage === Math.ceil(filteredEvents.length / eventsPerPage) 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
                          }`}
                          aria-label="Next page"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 px-4 bg-white rounded-xl shadow-md">
                  <div className="bg-gray-50 rounded-full p-6 inline-flex mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-3">No events found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">Try adjusting your search or category selection.</p>
            </div>
          )}
        </div>
        
            {/* Suggest Category Section - Enhanced Design */}
            <div className="mt-20 bg-white rounded-2xl overflow-hidden shadow-xl border border-amber-100">
              <div className="grid md:grid-cols-2">
                <div className="p-6 sm:p-8 md:p-12">
                  <div className="inline-block bg-amber-100 text-amber-600 px-3 py-1 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                    Suggest a New Category
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">Can't Find Your Category?</h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                  Suggest a new category and help us improve our platform for everyone.
                </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="Your category suggestion" 
                      className="flex-grow px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                    />
                    <button className="bg-gradient-to-r from-amber-500 to-orange-400 text-white font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-amber-600 hover:to-orange-500 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base whitespace-nowrap">
                      Submit
                    </button>
                  </div>
                </div>
                <div className="relative hidden md:block h-64 md:h-auto">
                  <Image
                    src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                    alt="Suggest a category"
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
              </div>
              </div>
            </div>
          </>
        )}
      </main>
      
      <Footer />
      
      {/* Event Preview Modal */}
      {showModal && selectedEvent && (
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

// Featured Category Card Component - Enhanced Design with amber/orange theme
function FeaturedCategoryCard({ category, onClick }) {
  // Ensure the image is valid
  const imageUrl = category.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop';
  
  return (
    <div onClick={onClick} className="block group cursor-pointer">
      <div className="relative h-44 sm:h-48 rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300">
        <Image
          src={imageUrl}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized={true} // Set to true for all remote images
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-800/80 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2 bg-white/20 backdrop-blur-sm p-1.5 rounded-full">{category.icon}</span>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-100 transition-colors">{category.name}</h3>
          </div>
          <p className="text-sm text-white/90 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
            </svg>
            {category.eventCount} Events
          </p>
        </div>
      </div>
    </div>
  );
}

// Event Card Component - Enhanced Design with amber/orange theme
function EventCard({ event, onClick, onGetTickets }) {
  const isSoldOut = event.ticketCount === 'No available ticket for this event';
  const hasDiscounts = event?.hasDiscounts;
  const discountAmount = event?.discountAmount || 0;
  
  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col border border-gray-100 cursor-pointer"
      onClick={() => onClick(event)}
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized={typeof event.image === 'string' && (event.image.startsWith('http') || event.image.startsWith('https'))}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-40 group-hover:opacity-60 transition-opacity"></div>
        <div className="absolute top-4 left-4 bg-amber-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium">
          {event.category || 'General'}
        </div>
        
        {/* Discount Badge - Show only if there are discounts */}
        {hasDiscounts && (
          <div className="absolute top-4 right-4">
            <span className="inline-block px-2 py-1 text-xs font-semibold bg-black text-white rounded-full shadow-sm">
              {discountAmount}% off
            </span>
          </div>
        )}
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600 text-xs sm:text-sm">{event.date}</span>
        </div>
        <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 group-hover:text-amber-600 transition-colors line-clamp-2 text-black">{event.title}</h3>
        <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm flex-grow line-clamp-2 sm:line-clamp-3">{event.description}</p>
        
        {/* Display discount information */}
        {hasDiscounts && (
          <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-700">
                  {event?.has_early_bird ? 'Early Bird Discount' : 'Volume Discount'}
                </p>
                <p className="text-xs text-gray-600">Save {discountAmount}% on tickets</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-500 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">{event.location}</span>
        </div>
      </div>
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex justify-between items-center mt-auto mb-3">
          <div>
            <span className={`font-bold ${isSoldOut ? 'text-red-500' : 'text-amber-600'} text-sm sm:text-base`}>{event.price}</span>
            {event.price !== 'Free' && event.price !== 'Sold Out' && (
              <div className="text-xs text-gray-500">{event.ticketCount} available</div>
            )}
            {event.price === 'Free' && !isSoldOut && (
              <div className="text-xs text-gray-500">{event.ticketCount} free tickets</div>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!isSoldOut) {
              onGetTickets(event, e);
            }
          }}
          disabled={isSoldOut}
          className={`block w-full py-1.5 sm:py-2 text-center rounded-lg text-sm sm:text-base transition-colors ${
            isSoldOut 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500'
          }`}
        >
          {isSoldOut ? 'Sold Out' : 'Get Tickets'}
        </button>
      </div>
    </div>
  );
}

// Category Tab Component - Enhanced Design with amber theme
function CategoryTab({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
        active 
          ? 'bg-amber-500 text-white' 
          : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

// Helper function to determine category type
function getCategoryType(category) {
  if (!category) return 'all';
  
  category = category.toLowerCase().trim();
  
  // Exact categories from database
  switch (category) {
    case 'music':
      return 'entertainment';
    case 'sports':
      return 'entertainment';
    case 'srmrgrew':
      return 'entertainment';
    case 'svds':
      return 'entertainment';
    case 'dfgdfg':
      return 'sports';
    default:
      // For any unknown categories
      return 'all';
  }
} 