'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import { useRouter } from 'next/navigation';
import TicketModal from '../components/TicketModal';

function DashboardContent() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('Sales');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add state for dashboard data
  const [salesData, setSalesData] = useState([]);
  const [premiumTiersData, setPremiumTiersData] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventStats, setEventStats] = useState({
    revenue: 0,
    rawRevenue: 0,
    adjustedRevenue: false,
    ticketsSold: 0,
    freeTickets: 0,
    paidTickets: 0,
    totalTickets: 0,
    shares: 0,
    privateEventsCount: 0,
    premiumTiersCount: 0
  });
  
  // Add ticket modal state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [premiumTiersPage, setPremiumTiersPage] = useState(1);
  const itemsPerPage = 5;
  
  // Get user data from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, []);

  // Fetch dashboard data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          throw new Error('User not found. Please sign in again.');
        }
        
        const user = JSON.parse(storedUser);
        console.log('Fetching data for user:', user.id);
        
        // Fetch user's events with ticket tiers
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            start_time,
            city,
            state,
            status,
            created_at,
            ticket_tiers (
              id, 
              price,
              quantity,
              quantity_sold,
              paid_quantity_sold,
              name,
              description,
              is_premium,
              tier_title,
              tier_description,
              tier_price,
              tier_quantity,
              tier_available_tickets
            ),
            event_images (
              id,
              image_url,
              is_cover
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (eventsError) throw eventsError;
        
        // Store the raw events data for use with the ticket modal
        setEvents(events);
        
        // Get the event IDs for fetching paid tickets
        const eventIds = events.map(event => event.id);
        
        // Fetch paid_tickets data for these events to get actual price_paid values
        const { data: paidTicketsData, error: paidTicketsError } = await supabase
          .from('paid_tickets')
          .select('*')
          .in('event_id', eventIds);
        
        if (paidTicketsError) {
          console.error('Error fetching paid tickets:', paidTicketsError);
          // Continue with the rest of the code even if there's an error
        }
        
        console.log(`Fetched ${paidTicketsData?.length || 0} paid tickets for revenue calculation`);
        
        // ADDITION: Also fetch private events for the user
        const { data: privateEvents, error: privateEventsError } = await supabase
          .from('private_events')
          .select('id, event_name, event_start_date, price, quantity, quantity_sold, is_paid, cover_image_url')
          .eq('user_id', user.id);
          
        if (privateEventsError) {
          console.error('Error fetching private events:', privateEventsError);
        } else {
          console.log(`Fetched ${privateEvents?.length || 0} private events`);
        }
        
        // ADDITION: Fetch private event tickets to calculate actual revenue
        let privateEventIds = [];
        if (privateEvents && privateEvents.length > 0) {
          privateEventIds = privateEvents.map(event => event.id);
        }
        
        let privateEventTickets = [];
        if (privateEventIds.length > 0) {
          const { data: privateTickets, error: privateTicketsError } = await supabase
            .from('private_event_tickets')
            .select('*')
            .in('event_id', privateEventIds);
            
          if (privateTicketsError) {
            console.error('Error fetching private event tickets:', privateTicketsError);
          } else {
            privateEventTickets = privateTickets || [];
            console.log(`Fetched ${privateEventTickets.length} private event tickets`);
          }
        }
        
        // Fetch payment requests to adjust revenue
        const { data: paymentRequestsData, error: paymentRequestsError } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('user_id', user.id);
          
        if (paymentRequestsError) {
          console.error('Error fetching payment requests:', paymentRequestsError);
        }
        
        // Log ticket tiers data for debugging
        console.log('Ticket tiers data:', events.map(event => {
          const tiers = event.ticket_tiers || [];
          return {
            event_id: event.id,
            event_name: event.name,
            tiers: tiers.map(tier => ({
              id: tier.id,
              price: tier.price,
              quantity: tier.quantity,
              quantity_sold: tier.quantity_sold,
              paid_quantity_sold: tier.paid_quantity_sold,
              is_free: parseFloat(tier.price) === 0
            }))
          };
        }));
        
        // Add summary logging for ticket calculations
        console.log('Ticket calculation summary:', events.map(event => {
          const freeTickets = event.ticket_tiers ? 
            event.ticket_tiers
              .filter(tier => parseFloat(tier.price) === 0)
              .reduce((sum, tier) => sum + (Number(tier.quantity_sold) || 0), 0) : 0;
              
          const paidTickets = event.ticket_tiers ? 
            event.ticket_tiers
              .filter(tier => parseFloat(tier.price) > 0)
              .reduce((sum, tier) => sum + (Number(tier.paid_quantity_sold) || 0), 0) : 0;
              
          return {
            event_id: event.id,
            event_name: event.name,
            free_tickets_sold: freeTickets,
            paid_tickets_sold: paidTickets,
            total_tickets_sold: freeTickets + paidTickets
          };
        }));
        
        // Process events for sales data display with REAL ticket data
        const processedSales = events.map(event => {
          // Find cover image
          const coverImage = event.event_images?.find(img => img.is_cover)?.image_url || '/placeholder.png';
          
          // Calculate tickets sold for this event
          let freeTicketsSold = 0;
          let paidTicketsSold = 0;
          let totalTicketsSold = 0;
          
          if (event.ticket_tiers && event.ticket_tiers.length > 0) {
            // Process each tier - use quantity_sold for free tickets and paid_quantity_sold for paid tickets
            event.ticket_tiers.forEach(tier => {
              const price = parseFloat(tier.price) || 0;
              
              if (price === 0) {
                // Free ticket - use quantity_sold
                freeTicketsSold += Number(tier.quantity_sold) || 0;
              } else {
                // Paid ticket - use paid_quantity_sold when available
                if (tier.paid_quantity_sold !== undefined && tier.paid_quantity_sold !== null) {
                  paidTicketsSold += Number(tier.paid_quantity_sold) || 0;
                } else {
                  // Fallback for paid tickets without paid_quantity_sold
                  const tierTickets = paidTicketsData?.filter(ticket => 
                    ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                  ) || [];
                  paidTicketsSold += tierTickets.length;
                }
              }
            });
            
            totalTicketsSold = freeTicketsSold + paidTicketsSold;
          }
          
          // Calculate total available tickets
          let totalTickets = 0;
          if (event.ticket_tiers && event.ticket_tiers.length > 0) {
            totalTickets = event.ticket_tiers.reduce((sum, tier) => sum + (tier.quantity || 0), 0);
          }
          
          // Calculate revenue from paid tickets only
          let eventRevenue = 0;
          if (event.ticket_tiers && event.ticket_tiers.length > 0) {
            // Only calculate revenue from paid tickets
            event.ticket_tiers.forEach(tier => {
              const price = parseFloat(tier.price) || 0;
              
              // Skip free tickets for revenue calculation
              if (price > 0) {
                if (tier.paid_quantity_sold !== undefined && tier.paid_quantity_sold !== null) {
                  // Calculate revenue using the actual price_paid values from paid_tickets table
                  const soldCount = Number(tier.paid_quantity_sold) || 0;
                  
                  // Get all paid_tickets for this tier to calculate actual revenue
                  const tierPaidTickets = paidTicketsData?.filter(ticket => 
                    ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                  ) || [];
                  
                  // Sum up the price_paid values from actual tickets
                  const tierRevenue = tierPaidTickets.reduce((sum, ticket) => 
                    sum + (parseFloat(ticket.price_paid) || 0), 0
                  );
                  
                  // If we have actual paid tickets data, use that revenue, otherwise fallback to calculation
                  eventRevenue += tierPaidTickets.length > 0 ? tierRevenue : (price * soldCount);
                } else {
                  // Fallback: calculate from ticketSalesData for this tier
                  const tierTickets = paidTicketsData?.filter(ticket => 
                    ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                  ) || [];
                  eventRevenue += tierTickets.reduce((sum, ticket) => 
                    sum + (parseFloat(ticket.price_paid) || 0), 0
                  );
                }
              }
            });
          }
          
          // Determine status based on event date
          const eventDate = new Date(event.event_date);
          const today = new Date();
          const diffTime = eventDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let status = '';
          let statusColor = '';
          
          if (diffDays < 0) {
            status = 'Past event';
            statusColor = 'text-gray-500 bg-gray-50';
          } else if (diffDays === 0) {
            status = 'Today';
            statusColor = 'text-orange-500 bg-orange-50';
          } else if (diffDays <= 7) {
            status = `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
            statusColor = 'text-pink-500 bg-pink-50';
          } else if (diffDays <= 14) {
            status = 'Next 2 weeks';
            statusColor = 'text-green-500 bg-green-50';
          } else if (diffDays <= 30) {
            status = 'Next month';
            statusColor = 'text-green-500 bg-green-50';
          } else {
            status = `in ${Math.floor(diffDays/30)} months`;
            statusColor = 'text-blue-500 bg-blue-50';
          }
          
          // Format date
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          });
          
          return {
            id: event.id,
            image: coverImage,
            event: event.name,
            date: formattedDate,
            status,
            statusColor,
            freeTickets: freeTicketsSold,
            paidTickets: paidTicketsSold,
            ticketsSold: `${totalTicketsSold}/${totalTickets}`,
            ticketDetails: `${paidTicketsSold} paid, ${freeTicketsSold} free`,
            revenue: `₦ ${eventRevenue.toLocaleString()}`
          };
        });
        
        setSalesData(processedSales);
        
        // Calculate total stats from REAL data
        let totalRevenue = 0;
        let totalTicketsSold = 0;
        let totalFreeTickets = 0;
        let totalPaidTickets = 0;
        let totalTickets = 0;
        
        // ADDITION: Calculate private events revenue first
        let privateEventsRevenue = 0;
        if (privateEvents && privateEvents.length > 0) {
          privateEvents.forEach(privateEvent => {
            // If the event is paid, calculate revenue
            if (privateEvent.is_paid) {
              // Get tickets for this event
              const eventTickets = privateEventTickets.filter(ticket => 
                ticket.event_id === privateEvent.id && ticket.is_paid
              );
              
              // Sum up the price_paid values
              eventTickets.forEach(ticket => {
                const ticketPrice = parseFloat(ticket.price_paid) || 0;
                const quantity = parseInt(ticket.quantity) || 1;
                privateEventsRevenue += ticketPrice * quantity;
              });
              
              // Add to total ticket counts
              const soldCount = parseInt(privateEvent.quantity_sold) || 0;
              totalPaidTickets += soldCount;
              totalTicketsSold += soldCount;
            } else {
              // For free private events, just add to ticket counts
              const soldCount = parseInt(privateEvent.quantity_sold) || 0;
              totalFreeTickets += soldCount;
              totalTicketsSold += soldCount;
            }
            
            // Add to total available tickets
            totalTickets += parseInt(privateEvent.quantity) || 0;
          });
        }
        
        console.log(`Private events revenue: ${privateEventsRevenue}`);
        
        // Now process regular events
        events.forEach(event => {
          // Calculate total tickets from ticket tiers
          const eventTotalTickets = event.ticket_tiers ? 
            event.ticket_tiers.reduce((sum, tier) => sum + (tier.quantity || 0), 0) : 0;
          
          // Calculate free and paid tickets sold
          let eventFreeTicketsSold = 0;
          let eventPaidTicketsSold = 0;
          
          if (event.ticket_tiers && event.ticket_tiers.length > 0) {
            // Process each tier - use quantity_sold for free tickets and paid_quantity_sold for paid tickets
            event.ticket_tiers.forEach(tier => {
              const price = parseFloat(tier.price) || 0;
              
              if (price === 0) {
                // Free ticket - use quantity_sold
                eventFreeTicketsSold += Number(tier.quantity_sold) || 0;
              } else {
                // Paid ticket - use paid_quantity_sold when available
                if (tier.paid_quantity_sold !== undefined && tier.paid_quantity_sold !== null) {
                  eventPaidTicketsSold += Number(tier.paid_quantity_sold) || 0;
                } else {
                  // Fallback for paid tickets without paid_quantity_sold
                  const tierTickets = paidTicketsData?.filter(ticket => 
                    ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                  ) || [];
                  eventPaidTicketsSold += tierTickets.length;
                }
              }
            });
          }
          
          const eventTotalTicketsSold = eventFreeTicketsSold + eventPaidTicketsSold;
          
          // Calculate revenue from paid tickets only
          let eventRevenue = 0;
          if (event.ticket_tiers && event.ticket_tiers.length > 0) {
            // Only calculate revenue from paid tickets
            event.ticket_tiers.forEach(tier => {
              const price = parseFloat(tier.price) || 0;
              
              // Skip free tickets for revenue calculation
              if (price > 0) {
                if (tier.paid_quantity_sold !== undefined && tier.paid_quantity_sold !== null) {
                  // Calculate revenue using the actual price_paid values from paid_tickets table
                  const soldCount = Number(tier.paid_quantity_sold) || 0;
                  
                  // Get all paid_tickets for this tier to calculate actual revenue
                  const tierPaidTickets = paidTicketsData?.filter(ticket => 
                    ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                  ) || [];
                  
                  // Sum up the price_paid values from actual tickets
                  const tierRevenue = tierPaidTickets.reduce((sum, ticket) => 
                    sum + (parseFloat(ticket.price_paid) || 0), 0
                  );
                  
                  // If we have actual paid tickets data, use that revenue, otherwise fallback to calculation
                  eventRevenue += tierPaidTickets.length > 0 ? tierRevenue : (price * soldCount);
                } else {
                  // Fallback: calculate from ticketSalesData for this tier
                  const tierTickets = paidTicketsData?.filter(ticket => 
                    ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                  ) || [];
                  eventRevenue += tierTickets.reduce((sum, ticket) => 
                    sum + (parseFloat(ticket.price_paid) || 0), 0
                  );
                }
              }
            });
          }
          
          totalTickets += eventTotalTickets;
          totalFreeTickets += eventFreeTicketsSold;
          totalPaidTickets += eventPaidTicketsSold;
          totalTicketsSold += eventTotalTicketsSold;
          totalRevenue += eventRevenue;
        });
        
        // ADDITION: Add private events revenue to the total revenue
        totalRevenue += privateEventsRevenue;
        
        // Adjust revenue based on payment requests
        let adjustedRevenue = totalRevenue;
        let paymentRequestStatus = "no requests";
        
        if (paymentRequestsData && paymentRequestsData.length > 0) {
          // Filter for active or paid payment requests
          const activeOrPaidRequests = paymentRequestsData.filter(
            req => req.status === 'active' || req.status === 'paid'
          );
          
          if (activeOrPaidRequests.length > 0) {
            // Calculate total amount to subtract
            const paymentRequestAdjustment = activeOrPaidRequests.reduce(
              (sum, req) => sum + parseFloat(req.amount || 0), 0
            );
            adjustedRevenue = totalRevenue - paymentRequestAdjustment;
            paymentRequestStatus = "adjusted";
          }
        }
        
        // Get real share data if available
        let shareCount = 0;
        try {
          // Define eventIds from the events array before using it
          const eventIds = events.map(event => event.id);
          
          const { data: sharesData, error: sharesError } = await supabase
            .from('event_shares')
            .select('count')
            .in('event_id', eventIds);
            
          if (!sharesError && sharesData) {
            shareCount = sharesData.length;
          }
        } catch (err) {
          console.error('Error fetching share data:', err);
        }
        
        setEventStats({
          revenue: paymentRequestStatus === "adjusted" ? adjustedRevenue : totalRevenue,
          rawRevenue: totalRevenue,
          adjustedRevenue: paymentRequestStatus === "adjusted",
          ticketsSold: totalTicketsSold,
          freeTickets: totalFreeTickets,
          paidTickets: totalPaidTickets,
          totalTickets,
          shares: shareCount,
          privateEventsCount: privateEvents?.length || 0
        });

        // Process premium ticket tiers separately
        let allPremiumTiers = [];
        events.forEach(event => {
          if (event.ticket_tiers && event.ticket_tiers.length > 0) {
            // Filter for premium tiers - either is_premium flag is true or has a tier_title (indicating premium tier)
            // AND is not named "Standard Ticket" or "Free Ticket"
            const premiumTiers = event.ticket_tiers.filter(tier => {
              const tierName = tier.name || tier.tier_title || '';
              return (tier.is_premium === true || tier.tier_title) && 
                     tierName !== 'Standard Ticket' && 
                     tierName !== 'Free Ticket';
            });
            
            if (premiumTiers.length > 0) {
              premiumTiers.forEach(tier => {
                // Find cover image for the event
                const coverImage = event.event_images?.find(img => img.is_cover)?.image_url || '/placeholder.png';
                
                // Determine tier price - use tier_price for premium tiers if available
                const price = tier.tier_price || tier.price || 0;
                
                // Calculate available tickets
                const totalQuantity = tier.tier_quantity || tier.quantity || 0;
                const soldQuantity = tier.paid_quantity_sold || 0;
                const availableQuantity = Math.max(0, totalQuantity - soldQuantity);
                
                // Calculate revenue from this tier using actual price_paid values when available
                let tierRevenue = 0;
                
                // Get all paid_tickets for this tier to calculate actual revenue
                const tierPaidTickets = paidTicketsData?.filter(ticket => 
                  ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                ) || [];
                
                // If we have actual paid tickets data, use that revenue
                if (tierPaidTickets.length > 0) {
                  // Sum up the price_paid values from actual tickets
                  tierRevenue = tierPaidTickets.reduce((sum, ticket) => 
                    sum + (parseFloat(ticket.price_paid) || 0), 0
                  );
                } else {
                  // Otherwise estimate revenue from tier price and sales
                  tierRevenue = price * soldQuantity;
                }
                
                // Format event date
                const eventDate = new Date(event.event_date);
                const formattedDate = eventDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                });
                
                // Calculate status based on event date
                const today = new Date();
                const diffTime = eventDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
                
                let status;
                let statusColor;
                
                if (diffDays < 0) {
                  status = 'Past';
                  statusColor = 'text-slate-500 bg-slate-100';
                } else if (diffDays === 0) {
                  status = 'Today';
                  statusColor = 'text-purple-500 bg-purple-50';
                } else if (diffDays === 1) {
                  status = 'Tomorrow';
                  statusColor = 'text-purple-500 bg-purple-50';
                } else if (diffDays <= 7) {
                  status = 'This week';
                  statusColor = 'text-green-500 bg-green-50';
                } else if (diffDays <= 14) {
                  status = 'Next week';
                  statusColor = 'text-green-500 bg-green-50';
                } else if (diffDays <= 30) {
                  status = 'Next month';
                  statusColor = 'text-green-500 bg-green-50';
                } else {
                  status = `in ${Math.floor(diffDays/30)} months`;
                  statusColor = 'text-blue-500 bg-blue-50';
                }
                
                // Add to premium tiers data
                allPremiumTiers.push({
                  id: tier.id,
                  tierId: tier.id,  // Store for ticket modal
                  eventId: event.id,  // Store for ticket modal
                  tierName: tier.tier_title || tier.name || 'Premium Ticket',
                  tierDescription: tier.tier_description || tier.description || '',
                  eventName: event.name,
                  price: `₦ ${price.toLocaleString()}`,
                  rawPrice: price,
                  totalQuantity: totalQuantity,
                  soldQuantity: soldQuantity,
                  availableQuantity: availableQuantity,
                  eventDate: formattedDate,
                  status,
                  statusColor,
                  revenue: `₦ ${tierRevenue.toLocaleString()}`
                });
              });
            }
          }
        });
        
        setPremiumTiersData(allPremiumTiers);
        
        // Update event stats with premium tiers count
        setEventStats(prevStats => ({
          ...prevStats,
          premiumTiersCount: allPremiumTiers.length
        }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Extract user information
  const firstName = userData?.first_name || 'User';
  const lastName = userData?.last_name || '';
  const email = userData?.email || '';
  const fullName = `${firstName} ${lastName}`.trim();

  // Display error message if there is an error
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
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Error loading dashboard data</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button 
              onClick={fetchDashboardData} 
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="mt-4 text-slate-600 font-medium text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Handle opening the ticket modal for a specific premium tier
  const handleOpenTicketModal = (tier) => {
    // Find the related event based on the tier's eventId
    const event = events?.find(e => e.id === tier.eventId);
    if (event) {
      setSelectedEvent({
        ...event,
        title: event.name,
        // Make sure the ticket_tiers include this specific premium tier at the top of the list
        ticket_tiers: event.ticket_tiers ? 
          [
            // Put the selected premium tier first
            ...event.ticket_tiers.filter(t => t.id === tier.tierId),
            // Then add all other tiers
            ...event.ticket_tiers.filter(t => t.id !== tier.tierId)
          ] : []
      });
      setIsTicketModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Dashboard Content */}
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Menu Button - Moved to right */}
          

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content - Updated for better responsiveness */}
      <div className="flex-1 w-full md:ml-0">
        {/* Top Header - Improved responsive layout */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-8 py-4 space-y-4 md:space-y-0">
            <div className="w-full md:w-auto">
              <div className="text-sm text-slate-500 mb-1">Account / Dashboard</div>
              <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
              <Link href="/create-event" className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md text-center">
                + Create event
              </Link>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-medium shadow-md">
                    {firstName.charAt(0)}{lastName.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-slate-800">{fullName}</div>
                    <div className="text-xs text-slate-500">{email}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content - Updated grid layouts for better responsiveness */}
        <div className="p-4 md:p-8">
          {/* Stats Grid - Improved responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Revenue Card */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-500/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-indigo-500 bg-indigo-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800">₦ {eventStats.revenue.toLocaleString()}</div>
                <div className="text-sm text-slate-500 mt-1">Total Revenue</div>
                {eventStats.adjustedRevenue && (
                  <div className="text-xs text-slate-500 mt-1">
                    Adjusted for payment withdrawals
                  </div>
                )}
              </div>
            </div>

            {/* Tickets Sold Card */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-500/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-blue-500 bg-blue-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800">{eventStats.ticketsSold}<span className="text-slate-400 text-xl">/{eventStats.totalTickets}</span></div>
                <div className="text-sm text-slate-500 mt-1">Tickets Sold</div>
                <div className="text-xs text-slate-600 mt-1">
                  <span className="text-indigo-500">{eventStats.paidTickets} paid</span> · 
                  <span className="text-green-500 ml-1">{eventStats.freeTickets} free</span>
                </div>
              </div>
            </div>

                {/* Private Events Card */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-500/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-purple-500 bg-purple-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                    <div className="text-3xl font-bold text-slate-800">{eventStats.privateEventsCount}</div>
                    <div className="text-sm text-slate-500 mt-1">Private Events</div>
              </div>
            </div>
          </div>

          {/* Sales by Event Section - Improved mobile layout */}
          <div className="bg-white rounded-xl p-4 md:p-6 mb-8 shadow-md border border-slate-200">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="text-blue-500 bg-blue-100 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-slate-800">Sales by event</h2>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <span className="text-sm text-slate-500 bg-slate-100 py-1 px-2 rounded-md">Updated: 10 minutes ago</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-slate-200 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option>Sort by: Sales</option>
                  <option>Sort by: Date</option>
                  <option>Sort by: Revenue</option>
                </select>
              </div>
            </div>

            {/* Sales Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                    <th className="pb-4 pl-2">Event</th>
                    <th className="pb-4">Date of the event</th>
                    <th className="pb-4">Ticket sold</th>
                    <th className="pb-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.length > 0 ? (
                        salesData
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((sale) => (
                      <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-slate-100 relative overflow-hidden shadow-sm">
                              <Image
                                src={sale.image}
                                alt={sale.event}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="font-medium text-slate-800">{sale.event}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <div className="text-slate-800">{sale.date}</div>
                            <div className={`inline-block px-2 py-1 rounded-full text-xs ${sale.statusColor} shadow-sm`}>
                              {sale.status}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-slate-800">
                          {sale.ticketsSold}
                          <div className="text-xs text-slate-500">{sale.ticketDetails}</div>
                        </td>
                        <td className="py-4 text-slate-800 font-medium">{sale.revenue}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-slate-100">
                      <td colSpan="4" className="py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>No events found. Create your first event to see sales data.</p>
                          <Link href="/create-event" className="mt-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg text-sm hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md">
                            Create Event
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

                {/* Pagination Controls */}
                {salesData.length > itemsPerPage && (
                  <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                          currentPage === 1
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(Math.ceil(salesData.length / itemsPerPage), currentPage + 1))}
                        disabled={currentPage >= Math.ceil(salesData.length / itemsPerPage)}
                        className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                          currentPage >= Math.ceil(salesData.length / itemsPerPage)
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Next
                      </button>
          </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-700">
                          Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, salesData.length)}
                          </span>{' '}
                          of <span className="font-medium">{salesData.length}</span> events
                        </p>
        </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                              currentPage === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: Math.min(5, Math.ceil(salesData.length / itemsPerPage)) }, (_, i) => {
                            // Calculate page numbers to show (show 5 pages max)
                            const totalPages = Math.ceil(salesData.length / itemsPerPage);
                            let pageNum;
                            
                            if (totalPages <= 5) {
                              // If 5 or fewer pages, show all pages
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              // If near the start, show first 5 pages
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              // If near the end, show last 5 pages
                              pageNum = totalPages - 4 + i;
                            } else {
                              // Otherwise show current page and 2 before/after
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-indigo-50 border border-indigo-500 text-indigo-600'
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(Math.ceil(salesData.length / itemsPerPage), currentPage + 1))}
                            disabled={currentPage >= Math.ceil(salesData.length / itemsPerPage)}
                            className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                              currentPage >= Math.ceil(salesData.length / itemsPerPage)
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Premium Ticket Tiers Section */}
              <div className="bg-white rounded-xl p-4 md:p-6 mb-8 shadow-md border border-slate-200">
                <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row justify-between items-start md:items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="text-amber-500 bg-amber-100 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-medium text-slate-800">Premium Ticket Tiers</h2>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 bg-slate-100 py-1 px-2 rounded-md">Total: {premiumTiersData.length} premium tiers</span>
                  </div>
                </div>

                {/* Premium Tiers Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                        <th className="pb-4 pl-2">Tier Name</th>
                        <th className="pb-4">Event</th>
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Price</th>
                        <th className="pb-4">Availability</th>
                        <th className="pb-4">Revenue</th>
                        <th className="pb-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {premiumTiersData.length > 0 ? (
                        premiumTiersData
                          .slice((premiumTiersPage - 1) * itemsPerPage, premiumTiersPage * itemsPerPage)
                          .map((tier) => (
                          <tr key={tier.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-800">{tier.tierName}</span>
                                  {tier.tierDescription && (
                                    <div className="text-xs text-slate-500 truncate max-w-xs">{tier.tierDescription}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-slate-800">{tier.eventName}</td>
                            <td className="py-4">
                              <div>
                                <div className="text-slate-800">{tier.eventDate}</div>
                                <div className={`inline-block px-2 py-1 rounded-full text-xs ${tier.statusColor} shadow-sm`}>
                                  {tier.status}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-slate-800">{tier.price}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      tier.availableQuantity === 0 
                                        ? 'bg-red-500' 
                                        : tier.availableQuantity < (tier.totalQuantity * 0.2) 
                                          ? 'bg-orange-500' 
                                          : 'bg-green-500'
                                    }`} 
                                    style={{ width: `${Math.max(0, 100 - ((tier.soldQuantity / tier.totalQuantity) * 100))}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm">
                                  {tier.availableQuantity === 0 
                                    ? <span className="text-red-500 font-medium">Sold Out</span> 
                                    : <span>
                                        <span className="font-medium">{tier.availableQuantity}</span> of {tier.totalQuantity} tickets remaining
                                      </span>
                                  }
                                </span>
                              </div>
                            </td>
                            <td className="py-4 text-slate-800 font-medium">{tier.revenue}</td>
                            <td className="py-4">
                              {tier.availableQuantity > 0 && new Date(tier.eventDate) > new Date() && (
                                <button
                                  onClick={() => handleOpenTicketModal(tier)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-lg text-xs hover:from-amber-600 hover:to-orange-500 transition-all duration-300 shadow-sm flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                  </svg>
                                  Buy Ticket
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-slate-100">
                          <td colSpan="6" className="py-8 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              <p>No premium ticket tiers found. Create an event with premium tiers to see them here.</p>
                              <Link href="/create-event" className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-lg text-sm hover:from-amber-600 hover:to-orange-500 transition-all duration-300 shadow-md">
                                Create Event with Premium Tiers
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Premium Tiers */}
                {premiumTiersData.length > itemsPerPage && (
                  <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setPremiumTiersPage(Math.max(1, premiumTiersPage - 1))}
                        disabled={premiumTiersPage === 1}
                        className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                          premiumTiersPage === 1
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPremiumTiersPage(Math.min(Math.ceil(premiumTiersData.length / itemsPerPage), premiumTiersPage + 1))}
                        disabled={premiumTiersPage >= Math.ceil(premiumTiersData.length / itemsPerPage)}
                        className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                          premiumTiersPage >= Math.ceil(premiumTiersData.length / itemsPerPage)
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-700">
                          Showing <span className="font-medium">{((premiumTiersPage - 1) * itemsPerPage) + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(premiumTiersPage * itemsPerPage, premiumTiersData.length)}
                          </span>{' '}
                          of <span className="font-medium">{premiumTiersData.length}</span> premium tiers
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={() => setPremiumTiersPage(Math.max(1, premiumTiersPage - 1))}
                            disabled={premiumTiersPage === 1}
                            className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                              premiumTiersPage === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: Math.min(5, Math.ceil(premiumTiersData.length / itemsPerPage)) }, (_, i) => {
                            // Calculate page numbers to show (show 5 pages max)
                            const totalPages = Math.ceil(premiumTiersData.length / itemsPerPage);
                            let pageNum;
                            
                            if (totalPages <= 5) {
                              // If 5 or fewer pages, show all pages
                              pageNum = i + 1;
                            } else if (premiumTiersPage <= 3) {
                              // If near the start, show first 5 pages
                              pageNum = i + 1;
                            } else if (premiumTiersPage >= totalPages - 2) {
                              // If near the end, show last 5 pages
                              pageNum = totalPages - 4 + i;
                            } else {
                              // Otherwise show current page and 2 before/after
                              pageNum = premiumTiersPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPremiumTiersPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                                  premiumTiersPage === pageNum
                                    ? 'z-10 bg-amber-50 border border-amber-500 text-amber-600'
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => setPremiumTiersPage(Math.min(Math.ceil(premiumTiersData.length / itemsPerPage), premiumTiersPage + 1))}
                            disabled={premiumTiersPage >= Math.ceil(premiumTiersData.length / itemsPerPage)}
                            className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                              premiumTiersPage >= Math.ceil(premiumTiersData.length / itemsPerPage)
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Ticket Modal for Premium Tickets */}
    <TicketModal
      event={selectedEvent}
      isOpen={isTicketModalOpen}
      onClose={() => setIsTicketModalOpen(false)}
    />
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}