'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';

// Helper functions
const isValidImageUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http') || url.startsWith('/');
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date not set';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return 'Invalid date';
  }
};

// Add new helper function for formatting currency as Naira
const formatNaira = (amount) => {
  if (!amount) return '₦0';
  return `₦${parseFloat(amount).toLocaleString()}`;
};

// Keep mockEvents as fallback
const mockEvents = [
  {
    id: 1,
    title: 'Rock Revolt',
    date: '2024-03-15',
    time: '7:00 PM',
    location: 'Downtown Arena',
    ticketsSold: 350,
    totalTickets: 500,
    revenue: '$17,500',
    status: 'Active',
    image: '/events/rock-revolt.jpg'
  },
  {
    id: 2,
    title: 'Tech Conference 2024',
    date: '2024-04-20',
    time: '9:00 AM',
    location: 'Convention Center',
    ticketsSold: 280,
    totalTickets: 400,
    revenue: '$28,000',
    status: 'Upcoming',
    image: '/events/tech-conf.jpg'
  },
  {
    id: 3,
    title: 'Summer Music Festival',
    date: '2024-06-10',
    time: '2:00 PM',
    location: 'Riverside Park',
    ticketsSold: 0,
    totalTickets: 1000,
    revenue: '$0',
    status: 'Draft',
    image: '/events/summer-fest.jpg'
  },
  {
    id: 4,
    title: 'Art Exhibition',
    date: '2024-03-01',
    time: '10:00 AM',
    location: 'City Gallery',
    ticketsSold: 150,
    totalTickets: 150,
    revenue: '$4,500',
    status: 'Completed',
    image: '/events/art-expo.jpg'
  }
];

function MyEventsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Check for success parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('published') === 'true') {
        setShowSuccessMessage(true);
        
        // Remove the query parameter from URL
        router.replace('/my-events', undefined, { shallow: true });
        
        // Hide success message after 5 seconds
        const timer = setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [router]);

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Get the user ID from either Auth context or localStorage
        const userId = user?.id || userData?.id;
        
        if (!userId) {
          console.log('No user ID found, cannot fetch events');
          setEvents(mockEvents);
          return;
        }
        
        console.log('Fetching events for user ID:', userId);
        
        // Fetch events created by the current user
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            event_images(*),
            ticket_tiers(*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (eventsError) throw eventsError;
        
        console.log('Fetched events:', eventsData);
        
        // Get ticket stats for each event
        const processedEvents = await Promise.all(eventsData.map(async (event) => {
          // Find cover image
          let coverImage = event.event_images?.find(img => img.is_cover === true)?.image_url || '/placeholder-event.jpg';
          
          // Ensure the image URL is valid
          if (!isValidImageUrl(coverImage)) {
            coverImage = '/placeholder-event.jpg';
          }
          
          // Calculate ticket stats from ticket_tiers
          let totalTickets = 0;
          let totalRevenue = 0;
          let freeTicketsSold = 0;
          let paidTicketsSold = 0;
          
          // Sum up from ticket tiers
          if (event.ticket_tiers && event.ticket_tiers.length > 0) {
            event.ticket_tiers.forEach(tier => {
              const tierPrice = parseFloat(tier.price) || 0;
              totalTickets += (tier.quantity || 0);
              
              if (tierPrice === 0) {
                // Free tickets - use quantity_sold
                freeTicketsSold += (tier.quantity_sold || 0);
              } else {
                // Paid tickets - use paid_quantity_sold
                paidTicketsSold += (tier.paid_quantity_sold || 0);
                // Revenue calculation using the paid_quantity_sold
                totalRevenue += (tierPrice * (tier.paid_quantity_sold || 0));
              }
            });
          }
          
          // Total tickets sold is sum of free and paid
          const ticketsSold = freeTicketsSold + paidTicketsSold;
          
          // Format location
          const location = event.location || 
            (event.city && event.state ? `${event.city}, ${event.state}` : 
            (event.city || event.state || 'Location not specified'));
          
          return {
            id: event.id,
            title: event.name,
            date: event.event_date,
            time: event.start_time,
            location,
            ticketsSold,
            paidTicketsSold,
            freeTicketsSold,
            totalTickets,
            revenue: formatNaira(totalRevenue),
            status: event.status || 'draft',
            image: coverImage,
            isPaid: event.is_paid
          };
        }));
        
        setEvents(processedEvents);
      } catch (error) {
        console.error('Error fetching events:', error.message);
        // Use mock data as fallback
        setEvents(mockEvents);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user, userData]);

  const filteredEvents = events.filter(event => {
    const matchesStatus = filterStatus === 'all' || event.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Add delete event handler
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? All ticket buyers will be refunded automatically. This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 1. Get all tickets for this event
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId);
        
      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        throw ticketsError;
      }

      // Also get paid tickets
      const { data: paidTickets, error: paidTicketsError } = await supabase
        .from('paid_tickets')
        .select('*')
        .eq('event_id', eventId);
        
      if (paidTicketsError) {
        console.error('Error fetching paid tickets:', paidTicketsError);
        throw paidTicketsError;
      }
      
      // Also get free tickets - this is the new addition
      const { data: freeTickets, error: freeTicketsError } = await supabase
        .from('free_tickets')
        .select('*')
        .eq('event_id', eventId);
        
      if (freeTicketsError) {
        console.error('Error fetching free tickets:', freeTicketsError);
        throw freeTicketsError;
      }
      
      console.log(`Fetched ${freeTickets?.length || 0} free tickets for event ${eventId}`);
      
      // 2. Process refunds for paid tickets BEFORE deleting anything
      const ticketsToRefund = [...(tickets || []), ...(paidTickets || [])].filter(ticket => 
        ticket.status !== 'refunded' && 
        parseFloat(ticket.price_paid) > 0
      );
      
      console.log(`Found ${ticketsToRefund.length} tickets to refund`);
      
      // Save all ticket information for refunds before deletion
      const ticketInfoForRefunds = ticketsToRefund.map(ticket => ({
        id: ticket.id,
        price_paid: ticket.price_paid,
        refund_amount: parseFloat(ticket.price_paid) * 0.97, // Refund 97%, keep 3% fee
        transaction_id: ticket.transaction_id || ticket.reference,
        quantity: ticket.quantity || 1,
        event_id: eventId
      }));
      
      let refundedCount = 0;
      let refundErrors = [];
      let manualRefundsNeeded = 0;
      
      if (ticketsToRefund.length > 0) {
        // Process refunds one by one to avoid overwhelming Paystack API
        for (const ticket of ticketInfoForRefunds) {
          try {
            // Skip API call if no payment reference
            const paymentRef = ticket.transaction_id;
            if (!paymentRef) {
              console.warn(`Ticket ${ticket.id} has no payment reference. Marking for manual refund.`);
              manualRefundsNeeded++;
              continue;
            }
              
            // Call our refund API endpoint directly with transaction_id
            const response = await fetch('/api/refunds', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                transaction_id: paymentRef,
                amount: ticket.refund_amount, // Use the calculated refund amount (97%)
                reason: `Event deleted by organizer (refunding ${ticket.quantity} ticket(s) minus 3% fee)`,
                event_id: eventId
              }),
            });
            
            const result = await response.json();
            
            // Check if it's a success or if the transaction was already reversed
            if (result.success || (result.error && result.error.includes("fully reversed"))) {
              refundedCount++;
              if (result.error && result.error.includes("fully reversed")) {
                console.log(`Ticket ${ticket.id} was already refunded: ${result.error}`);
              }
            } else {
              refundErrors.push(`Failed to refund ticket ${ticket.id}: ${result.error}`);
              console.error(`Refund error for ticket ${ticket.id}:`, result.error);
            }
            
          } catch (ticketError) {
            refundErrors.push(`Error processing refund for ticket ${ticket.id}`);
            console.error(`Error processing refund for ticket ${ticket.id}:`, ticketError);
          }
          
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // 3. Update ticket tiers to zero out quantities
      try {
        const { data: tiers, error: tiersError } = await supabase
          .from('ticket_tiers')
          .select('id')
          .eq('event_id', eventId);
          
        if (!tiersError && tiers && tiers.length > 0) {
          console.log(`Updating ${tiers.length} ticket tiers to zero quantities`);
          
          for (const tier of tiers) {
            await supabase
              .from('ticket_tiers')
              .update({ 
                quantity_sold: 0,
                paid_quantity_sold: 0
              })
              .eq('id', tier.id);
          }
        }
      } catch (e) {
        console.error('Error updating ticket tiers:', e);
      }
      
      // 4. Delete related records in the correct order
      try {
      await supabase
        .from('event_images')
        .delete()
        .eq('event_id', eventId);
      } catch (e) {
        console.error('Error deleting event images:', e);
      }

      try {
      await supabase
        .from('ticket_tiers')
        .delete()
        .eq('event_id', eventId);
      } catch (e) {
        console.error('Error deleting ticket tiers:', e);
      }
        
      // Delete free tickets first - this is the new addition
      if (freeTickets && freeTickets.length > 0) {
        try {
          console.log(`Deleting ${freeTickets.length} free tickets for event ${eventId}`);
          const { error: freeTicketDeleteError } = await supabase
            .from('free_tickets')
            .delete()
            .eq('event_id', eventId);
            
          if (freeTicketDeleteError) {
            console.error('Error deleting free tickets:', freeTicketDeleteError);
            throw new Error(`Cannot delete event: failed to remove free ticket records: ${freeTicketDeleteError.message}`);
          }
        } catch (e) {
          console.error('Error in free tickets deletion block:', e);
          throw e;
        }
      }
        
      // Try to delete paid_tickets if they exist
      try {
        await supabase
          .from('paid_tickets')
          .delete()
          .eq('event_id', eventId);
      } catch (e) {
        console.error('Error deleting paid tickets:', e);
      }
        
      // Try to delete regular tickets if they exist
      try {
        await supabase
          .from('tickets')
          .delete()
          .eq('event_id', eventId);
      } catch (e) {
        console.error('Error deleting tickets:', e);
      }

      // Then delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Update local state
      setEvents(events.filter(event => event.id !== eventId));
      
      // Show summary of refund process
      if (ticketsToRefund.length > 0) {
        if (manualRefundsNeeded > 0) {
          const automaticRefunds = refundedCount - manualRefundsNeeded;
          setSuccessMessage(`Event deleted. ${automaticRefunds} tickets automatically refunded. ${manualRefundsNeeded} tickets need manual refund processing.`);
        } else if (refundErrors.length > 0) {
          setSuccessMessage(`Event deleted. ${refundedCount} of ${ticketsToRefund.length} tickets were refunded successfully. Some refunds may require manual processing.`);
        } else {
          setSuccessMessage(`Event deleted successfully. All ${refundedCount} paid tickets have been refunded to the buyers.`);
        }
      } else {
        setSuccessMessage('Event deleted successfully. No paid tickets needed to be refunded.');
      }
      
      setShowSuccessMessage(true);
      setShowDeleteModal(false);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Error deleting event: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add edit event handler
  const handleEditEvent = (eventId) => {
    router.push(`/edit-event/${eventId}`);
  };

  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center px-4 sm:px-8 py-4">
            <div>
              <div className="text-sm text-slate-500 mb-1">My Events</div>
              <h1 className="text-2xl font-semibold text-slate-800">My Events</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/create-event"
                className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Create New Event</span>
              </Link>
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

        <div className="p-4 sm:p-8">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative shadow-sm" role="alert">
              <strong className="font-bold">Success! </strong>
              <span className="block sm:inline">{successMessage}</span>
              <button 
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setShowSuccessMessage(false)}
              >
                <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <title>Close</title>
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
              </button>
            </div>
          )}
          
          {/* Filters and Search */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-auto border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <button className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sort
              </button>
              <button className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Filter
              </button>
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center border border-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No events found</h3>
              <p className="text-slate-500 mb-4">You haven&apos;t created any events yet or none match your current filters.</p>
              <Link
                href="/create-event"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 inline-flex items-center gap-2 transition-all duration-300 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-slate-200 relative">
                    {event.image ? (
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized={!event.image.startsWith('/')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${event.isPaid ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {event.isPaid ? 'Paid Event' : 'Free Event'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-slate-900">{event.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        <div className="relative">
                          <button
                            className="text-slate-400 hover:text-slate-600 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              const menu = e.currentTarget.nextElementSibling;
                              menu.classList.toggle('hidden');
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setEventToDelete(event);
                                  setShowDeleteModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100 flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Event
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(event.date)} {event.time ? `at ${event.time}` : ''}
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span title={`${event.paidTicketsSold || 0} paid, ${(event.ticketsSold || 0) - (event.paidTicketsSold || 0)} free`}>
                        {event.ticketsSold} / {event.totalTickets} tickets sold
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Delete Event</h3>
            <p className="text-slate-500 mb-4">
              Are you sure you want to delete &quot;{eventToDelete?.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(eventToDelete.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyEvents() {
  return (
    <ProtectedRoute>
      <MyEventsContent />
    </ProtectedRoute>
  );
} 