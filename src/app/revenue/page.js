'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';

function RevenueContent() {
  const [timeframe, setTimeframe] = useState('monthly');
  const { user } = useAuth();
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: '₦0',
    monthlyGrowth: '0%',
    paymentAdjustment: 'No payment requests',
    averageTicketPrice: '₦0',
    totalEvents: '0',
    paidEvents: '0',
    freeEvents: '0',
    totalTicketsSold: '0',
    paidTickets: '0',
    freeTickets: '0'
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Debug mobile menu state
  useEffect(() => {
    console.log('Mobile menu state:', isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside or on refresh
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.mobile-menu-button') && !e.target.closest('.sidebar-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMobileMenuOpen]);

  // Ensure mobile menu is closed on initial load
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);
  
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
  
  // Get user details from metadata
  const firstName = userData?.first_name || user?.user_metadata?.first_name || '';
  const lastName = userData?.last_name || user?.user_metadata?.last_name || '';
  const email = userData?.email || user?.email || '';
  const fullName = `${firstName} ${lastName}`.trim() || email || 'User';
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
    : (email?.charAt(0) || 'U');
  
  // Fetch revenue data
  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoading(true);
      try {
        // Get the user ID from either Auth context or localStorage
        const userId = user?.id || userData?.id;
        
        if (!userId) {
          console.log('No user ID found, cannot fetch revenue data');
          return;
        }
        
        console.log('Fetching revenue data for user ID:', userId);
        
        // Fetch events created by the current user
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            is_paid,
            status,
            ticket_tiers (
              id,
              price,
              quantity,
              quantity_sold,
              paid_quantity_sold
            )
          `)
          .eq('user_id', userId);
          
        if (eventsError) throw eventsError;
        
        // ADDITION: Also fetch private events for the user
        const { data: privateEvents, error: privateEventsError } = await supabase
          .from('private_events')
          .select('id, event_name, event_start_date, price, quantity, quantity_sold, is_paid, cover_image_url')
          .eq('user_id', userId);
          
        if (privateEventsError) {
          console.error('Error fetching private events:', privateEventsError);
        } else {
          console.log(`Fetched ${privateEvents?.length || 0} private events for revenue`);
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
            console.log(`Fetched ${privateEventTickets.length} private event tickets for revenue`);
          }
        }
        
        // Fetch tickets data for more accurate revenue calculations
        const { data: paidTicketsData, error: paidTicketsError } = await supabase
          .from('paid_tickets')
          .select('*')
          .in('event_id', eventsData.map(event => event.id));
          
        if (paidTicketsError) {
          console.error('Error fetching paid tickets data:', paidTicketsError);
        }
        
        // Enhanced logging for debugging
        console.log('Events with ticket tiers:', eventsData.map(event => ({
          event_id: event.id,
          event_name: event.name,
          tiers: (event.ticket_tiers || []).map(tier => ({
            id: tier.id,
            price: tier.price,
            quantity_sold: tier.quantity_sold,
            paid_quantity_sold: tier.paid_quantity_sold,
            is_free: parseFloat(tier.price) === 0
          }))
        })));
        
        // Fetch payment requests to adjust revenue
        const { data: paymentRequestsData, error: paymentRequestsError } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('user_id', userId);
          
        if (paymentRequestsError) {
          console.error('Error fetching payment requests:', paymentRequestsError);
        }
        
        // Fetch tickets data for revenue calculation (as fallback)
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select(`
            id,
            event_id,
            ticket_tier_id,
            status,
            created_at,
            price
          `)
          .in('event_id', eventsData.map(event => event.id))
          .eq('status', 'sold');
          
        if (ticketsError && !ticketsError.message.includes('does not exist')) {
          throw ticketsError;
        }
        
        // Calculate revenue stats with enhanced calculation
        let totalRevenue = 0;
        let totalTicketsSold = 0;
        let totalFreeTickets = 0;
        let totalPaidTickets = 0;
        const recentTransactions = [];
        
        // ADDITION: First calculate revenue from private events
        let privateEventsRevenue = 0;
        if (privateEvents && privateEvents.length > 0) {
          privateEvents.forEach(privateEvent => {
            // If the event is paid, calculate revenue
            if (privateEvent.is_paid) {
              // Get tickets for this event
              const eventTickets = privateEventTickets.filter(ticket => 
                ticket.event_id === privateEvent.id && ticket.is_paid
              );
              
              // Calculate revenue and tickets from private event
              let eventPaidRevenue = 0;
              let eventPaidTickets = 0;
              let eventDate = new Date(privateEvent.event_start_date);
              
              // Sum up the price_paid values
              eventTickets.forEach(ticket => {
                const ticketPrice = parseFloat(ticket.price_paid) || 0;
                const quantity = parseInt(ticket.quantity) || 1;
                eventPaidRevenue += ticketPrice * quantity;
                eventPaidTickets += quantity;
              });
              
              // Add to totals
              totalPaidTickets += eventPaidTickets;
              privateEventsRevenue += eventPaidRevenue;
              
              // Create transaction record for private event
              if (eventPaidTickets > 0) {
                recentTransactions.push({
                  event: privateEvent.event_name,
                  date: eventDate.toISOString().split('T')[0],
                  amount: `₦${eventPaidRevenue.toLocaleString()}`,
                  ticketCount: eventPaidTickets,
                  paidTickets: eventPaidTickets,
                  freeTickets: 0,
                  status: 'Completed',
                  eventDate: eventDate,
                  isPrivate: true
                });
              }
            } else {
              // For free private events, just add to ticket counts
              const soldCount = parseInt(privateEvent.quantity_sold) || 0;
              totalFreeTickets += soldCount;
              
              // Create transaction record for free private event if it has tickets
              if (soldCount > 0) {
                const eventDate = new Date(privateEvent.event_start_date);
                recentTransactions.push({
                  event: privateEvent.event_name,
                  date: eventDate.toISOString().split('T')[0],
                  amount: `₦0`,
                  ticketCount: soldCount,
                  paidTickets: 0,
                  freeTickets: soldCount,
                  status: 'Completed',
                  eventDate: eventDate,
                  isPrivate: true
                });
              }
            }
          });
        }
        
        console.log(`Private events revenue: ${privateEventsRevenue}`);
        
        // Process each regular event
        eventsData.forEach(event => {
          let eventPaidRevenue = 0;
          let eventFreeTickets = 0;
          let eventPaidTickets = 0;
          
          // Calculate from ticket tiers directly
          if (event.ticket_tiers && event.ticket_tiers.length > 0) {
            event.ticket_tiers.forEach(tier => {
              const price = parseFloat(tier.price) || 0;
              
              if (price === 0) {
                // Free tickets - use quantity_sold
                const freeTicketCount = Number(tier.quantity_sold) || 0;
                eventFreeTickets += freeTicketCount;
              } else {
                // Paid tickets - use paid_quantity_sold
                if (tier.paid_quantity_sold !== undefined && tier.paid_quantity_sold !== null) {
                  const paidTicketCount = Number(tier.paid_quantity_sold) || 0;
                  eventPaidTickets += paidTicketCount;
                  
                  // Get all paid_tickets for this tier to calculate actual revenue
                  const tierPaidTickets = paidTicketsData?.filter(ticket => 
                    ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                  ) || [];
                  
                  // Sum up the price_paid values from actual tickets
                  const tierRevenue = tierPaidTickets.reduce((sum, ticket) => 
                    sum + (parseFloat(ticket.price_paid) || 0), 0
                  );
                  
                  // If we have actual paid tickets data, use that revenue, otherwise fallback to calculation
                  eventPaidRevenue += tierPaidTickets.length > 0 ? tierRevenue : (price * paidTicketCount);
                } else {
                  // Fallback for older data without paid_quantity_sold
                  const tierTickets = ticketsData ? 
                    ticketsData.filter(ticket => 
                      ticket.event_id === event.id && 
                      ticket.ticket_tier_id === tier.id
                    ) : [];
                  
                  eventPaidTickets += tierTickets.length;
                  eventPaidRevenue += tierTickets.reduce((sum, ticket) => 
                    sum + (parseFloat(ticket.price_paid || ticket.price) || 0), 0
                  );
                }
              }
            });
            
            // Add to totals
            totalFreeTickets += eventFreeTickets;
            totalPaidTickets += eventPaidTickets;
            totalRevenue += eventPaidRevenue;
            
            // Create transaction record with proper ticket breakdown
            const totalTickets = eventFreeTickets + eventPaidTickets;
            
            if (totalTickets > 0) {
              const date = new Date(event.event_date).toISOString().split('T')[0];
              
              recentTransactions.push({
                event: event.name,
                date: date,
                amount: `₦${eventPaidRevenue.toLocaleString()}`,
                ticketCount: totalTickets,
                paidTickets: eventPaidTickets,
                freeTickets: eventFreeTickets,
                status: 'Completed',
                eventDate: new Date(event.event_date) // Store actual date object for filtering
              });
            }
          }
        });
        
        // Add private events revenue to the total revenue
        totalRevenue += privateEventsRevenue;
        
        // Sort transactions by date (most recent first)
        recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Apply timeframe filter to transactions
        const now = new Date();
        const filteredTransactions = recentTransactions.filter(transaction => {
          const transactionDate = transaction.eventDate || new Date(transaction.date);
          const diffTime = now - transactionDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          switch(timeframe) {
            case 'daily':
              return diffDays <= 1; // Today
            case 'weekly':
              return diffDays <= 7; // Last 7 days
            case 'monthly':
              return diffDays <= 30; // Last 30 days
            case 'yearly':
              return diffDays <= 365; // Last 365 days
            default:
              return true; // Show all by default
          }
        });
        
        // Calculate filtered stats
        let filteredRevenue = 0;
        let filteredFreeTickets = 0;
        let filteredPaidTickets = 0;
        
        filteredTransactions.forEach(transaction => {
          // Extract numbers from formatted strings
          const amount = parseFloat(transaction.amount.replace('₦', '').replace(/,/g, '')) || 0;
          filteredRevenue += amount;
          filteredFreeTickets += transaction.freeTickets || 0;
          filteredPaidTickets += transaction.paidTickets || 0;
        });
        
        const filteredTotalTickets = filteredFreeTickets + filteredPaidTickets;
        const filteredAveragePrice = filteredPaidTickets > 0 
          ? filteredRevenue / filteredPaidTickets 
          : 0;
        
        // Adjust revenue based on payment requests
        let adjustedRevenue = filteredRevenue;
        let paymentRequestAdjustment = 0;
        let paymentRequestStatus = "no requests";
        
        if (paymentRequestsData && paymentRequestsData.length > 0) {
          // Filter for active or paid payment requests
          const activeOrPaidRequests = paymentRequestsData.filter(
            req => req.status === 'active' || req.status === 'paid'
          );
          
          if (activeOrPaidRequests.length > 0) {
            // Calculate total amount to subtract
            paymentRequestAdjustment = activeOrPaidRequests.reduce(
              (sum, req) => sum + parseFloat(req.amount || 0), 0
            );
            adjustedRevenue = filteredRevenue - paymentRequestAdjustment;
            paymentRequestStatus = "adjusted";
          } else {
            // Check if there are any rejected or pending requests
            const otherRequests = paymentRequestsData.filter(
              req => req.status === 'rejected' || req.status === 'pending'
            );
            
            if (otherRequests.length > 0) {
              paymentRequestStatus = "pending or rejected";
            }
          }
        }
        
        // If no filtered transactions, create demo transaction data
        if (filteredTransactions.length === 0) {
          // Use events to create sample transactions if available
          if (eventsData.length > 0) {
            eventsData.slice(0, 3).forEach((event, index) => {
              const daysAgo = index + 1;
              const date = new Date();
              date.setDate(date.getDate() - daysAgo);
              
              filteredTransactions.push({
                event: event.name,
                date: date.toISOString().split('T')[0],
                amount: '₦0',
                ticketCount: 0,
                paidTickets: 0,
                freeTickets: 0,
                status: 'No Sales'
              });
            });
          }
        }
        
        // Count event types (not filtered by timeframe)
        const totalEvents = eventsData.length;
        const paidEvents = eventsData.filter(event => event.is_paid).length;
        const freeEvents = totalEvents - paidEvents;
        
        // Get appropriate growth text based on timeframe
        let growthText = '+0%';
        switch(timeframe) {
          case 'daily':
            growthText = 'Today';
            break;
          case 'weekly':
            growthText = 'Past 7 days';
            break;
          case 'monthly':
            growthText = 'Past 30 days';
            break;
          case 'yearly':
            growthText = 'Past 365 days';
            break;
        }
        
        // Update revenue stats with filtered data
        setRevenueStats({
          totalRevenue: paymentRequestStatus === "adjusted" 
            ? `₦${adjustedRevenue.toLocaleString()}` 
            : `₦${filteredRevenue.toLocaleString()}`,
          paymentAdjustment: paymentRequestStatus === "adjusted" 
            ? `₦${paymentRequestAdjustment.toLocaleString()} withdrawn` 
            : (paymentRequestStatus === "pending or rejected" 
               ? "Payment requests pending/rejected" 
               : "No payment requests"),
          monthlyGrowth: growthText,
          averageTicketPrice: `₦${filteredAveragePrice.toLocaleString()}`,
          totalTicketsSold: filteredTotalTickets.toString(),
          paidTickets: filteredPaidTickets.toString(),
          freeTickets: filteredFreeTickets.toString(),
          totalEvents: totalEvents.toString(),
          paidEvents: paidEvents.toString(),
          freeEvents: freeEvents.toString()
        });
        
        setTransactions(filteredTransactions);
      } catch (error) {
        console.error('Error fetching revenue data:', error.message);
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRevenueData();
  }, [user, userData, timeframe]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Mobile sidebar */}
      <div 
        className={`md:hidden fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} z-30 transition duration-300 ease-in-out w-64 sidebar-container`}
      >
        <Sidebar isOpen={isMobileMenuOpen} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center px-4 sm:px-8 py-4">
            <div className="flex items-center">
              {/* Hamburger menu for mobile */}
              <button 
                className="mobile-menu-button md:hidden mr-4 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-100 relative z-40"
                onClick={() => {
                  console.log('Button clicked, current state:', isMobileMenuOpen);
                  setIsMobileMenuOpen(prev => !prev);
                }}
                aria-label="Toggle mobile menu"
                style={{ touchAction: 'manipulation' }}
              >
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <div>
                <div className="text-sm text-slate-500 mb-1">Revenue</div>
                <h1 className="text-2xl font-semibold text-slate-800">Revenue Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-medium shadow-md">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-slate-800">{fullName}</div>
                  <div className="text-xs text-slate-500">{email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-8">
          {/* Timeframe selector */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-lg font-medium text-slate-900 mb-1">Revenue Summary</h3>
              <p className="text-sm text-slate-500">
                {timeframe === 'daily' && 'Today\'s revenue'}
                {timeframe === 'weekly' && 'Revenue in the past 7 days'}
                {timeframe === 'monthly' && 'Revenue in the past 30 days'}
                {timeframe === 'yearly' && 'Revenue in the past 365 days'}
              </p>
            </div>
            
            <div className="inline-flex flex-wrap rounded-lg border border-slate-200 p-1 bg-white shadow-sm">
              {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    timeframe === period
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-slate-500 text-sm font-medium">Total Revenue</h3>
              <div className="mt-2 flex items-baseline flex-wrap">
                <p className="text-2xl sm:text-3xl font-semibold text-slate-900">{revenueStats.totalRevenue}</p>
                <span className="ml-2 text-sm font-medium text-green-600">{revenueStats.monthlyGrowth}</span>
              </div>
              {revenueStats.paymentAdjustment !== 'No payment requests' && (
                <div className="mt-2 text-xs text-slate-500">
                  {revenueStats.paymentAdjustment}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-slate-500 text-sm font-medium">Tickets Sold</h3>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">{revenueStats.totalTicketsSold}</p>
              <div className="mt-2 text-sm">
                <span className="text-indigo-500">{revenueStats.paidTickets} paid</span>
                <span className="mx-2">•</span>
                <span className="text-green-500">{revenueStats.freeTickets} free</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-slate-500 text-sm font-medium">Average Ticket Price</h3>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">{revenueStats.averageTicketPrice}</p>
              <div className="mt-2 text-sm text-slate-500">
                Based on paid tickets only
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-slate-500 text-sm font-medium">Total Events</h3>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">{revenueStats.totalEvents}</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Paid: {revenueStats.paidEvents}</span>
                <span className="mx-2">•</span>
                <span className="text-slate-500">Free: {revenueStats.freeEvents}</span>
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-slate-900 text-lg font-medium">Recent Transactions</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">View All</button>
              </div>
            </div>
            {transactions.length === 0 ? (
              <div className="p-4 sm:p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500 mb-4">No transactions found. Create events and sell tickets to see revenue data.</p>
                <Link href="/create-event" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 inline-flex items-center gap-2 transition-all duration-300 shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tickets</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {transactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">
                          {transaction.event}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500">
                          {transaction.ticketCount}
                          {transaction.status !== 'No Sales' && (
                            <div className="text-xs mt-1">
                              <span className="text-indigo-500">{transaction.paidTickets} paid</span>
                              <span className="mx-1">•</span>
                              <span className="text-green-500">{transaction.freeTickets} free</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 font-medium">
                          {transaction.amount}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RevenuePage() {
  return (
    <ProtectedRoute>
      <RevenueContent />
    </ProtectedRoute>
  );
} 