'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import supabase from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';

function PrivateEventsContent() {
  const [privateEvents, setPrivateEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  
  // Pagination state for events
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 9;

  // Pagination state for tickets
  const [currentTicketPage, setCurrentTicketPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const ticketsPerPage = 10;

  useEffect(() => {
    // Get user from localStorage
    const getUserFromStorage = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          return user;
        }
        return null;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
      }
    };

    const fetchPrivateEvents = async () => {
      try {
        setLoading(true);
        
        // Get user from localStorage
        const user = getUserFromStorage();
        
        if (!user || !user.id) {
          // If user is not logged in, redirect to login
          router.push('/signin');
          return;
        }
        
        // Fetch private events for the current user
        const { data, error } = await supabase
          .from('private_events')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setPrivateEvents(data || []);
      } catch (error) {
        console.error('Error fetching private events:', error);
        setError('Failed to load your private events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrivateEvents();
  }, [router]);
  
  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Function to handle creating a new private event
  const handleCreateNewPrivateEvent = () => {
    router.push('/private-event');
  };
  
  // Function to handle deletion of a private event
  const handleDeletePrivateEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this private event? All ticket buyers will be refunded automatically. This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Get all tickets for this event
      const { data: tickets, error: ticketsError } = await supabase
        .from('private_event_tickets')
        .select('*')
        .eq('event_id', eventId);
        
      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        throw ticketsError;
      }
      
      // 2. Process refunds for paid tickets
      const paidTickets = tickets?.filter(ticket => 
        ticket.is_paid && 
        parseFloat(ticket.price_paid) > 0 &&
        ticket.status !== 'refunded'
      ) || [];
      
      let refundedCount = 0;
      let refundErrors = [];
      let manualRefundsNeeded = 0;
      
      if (paidTickets.length > 0) {
        // Process refunds one by one to avoid overwhelming Paystack API
        for (const ticket of paidTickets) {
          try {
            // Skip API call if no payment reference
            if (!ticket.payment_reference) {
              console.warn(`Ticket ${ticket.id} has no payment reference. Marking for manual refund.`);
              manualRefundsNeeded++;
              
              // Create a manual refund record in the database
              const { error: manualRefundError } = await supabase
                .from('refunds')
                .insert({
                  ticket_id: ticket.id,
                  event_id: eventId,
                  amount: ticket.price_paid,
                  payment_reference: 'manual-refund',
                  reason: 'Event deleted by organizer',
                  status: 'manual_required',
                  buyer_email: ticket.buyer_email,
                  buyer_name: ticket.buyer_name,
                  notes: 'No payment reference found. Manual refund required.'
                });
                
              if (manualRefundError) {
                console.error(`Error creating manual refund record for ticket ${ticket.id}:`, manualRefundError);
              }
              
              // Update ticket status to indicate manual refund needed
              const { error: updateError } = await supabase
                .from('private_event_tickets')
                .update({ status: 'manual_refund_required' })
                .eq('id', ticket.id);
                
              if (updateError) {
                console.error(`Error updating ticket ${ticket.id} status:`, updateError);
              }
                
              continue;
            }
            
            // Call our refund API endpoint
            const response = await fetch('/api/refunds', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ticketId: ticket.id,
                reason: 'Event deleted by organizer'
              }),
            });
            
            const result = await response.json();
            
            if (result.success) {
              refundedCount++;
              
              // Consider manual refunds as "refunded" for the count
              if (result.manual) {
                manualRefundsNeeded++;
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
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Before proceeding to delete the event, we need to handle all related records
      
      // Check for refund records and delete them if necessary
      console.log('Checking for refund records to delete...');
      const { data: refundRecords, error: refundQueryError } = await supabase
        .from('refunds')
        .select('id')
        .eq('event_id', eventId);
        
      if (refundQueryError) {
        console.error('Error checking refund records:', refundQueryError);
      } else if (refundRecords && refundRecords.length > 0) {
        console.log(`Found ${refundRecords.length} refund records to delete`);
        const { error: refundDeleteError } = await supabase
          .from('refunds')
          .delete()
          .eq('event_id', eventId);
          
        if (refundDeleteError) {
          console.error('Error deleting refund records:', refundDeleteError);
          throw new Error(`Cannot delete event: failed to remove refund records: ${refundDeleteError.message}`);
        }
        console.log('Successfully deleted refund records');
      }
      
      // Check for ticket records and delete them if necessary
      console.log('Checking for ticket records to delete...');
      if (tickets && tickets.length > 0) {
        console.log(`Found ${tickets.length} ticket records to delete`);
        const { error: ticketDeleteError } = await supabase
          .from('private_event_tickets')
          .delete()
          .eq('event_id', eventId);
          
        if (ticketDeleteError) {
          console.error('Error deleting ticket records:', ticketDeleteError);
          throw new Error(`Cannot delete event: failed to remove ticket records: ${ticketDeleteError.message}`);
        }
        console.log('Successfully deleted ticket records');
      }
      
      // Check for payment fee records and delete them if necessary
      console.log('Checking for payment fee records to delete...');
      const { data: feeRecords, error: feeQueryError } = await supabase
        .from('private_event_fees')
        .select('id')
        .eq('event_id', eventId);
        
      if (feeQueryError) {
        console.error('Error checking payment fee records:', feeQueryError);
      } else if (feeRecords && feeRecords.length > 0) {
        console.log(`Found ${feeRecords.length} payment fee records to delete`);
        const { error: feeDeleteError } = await supabase
          .from('private_event_fees')
          .delete()
          .eq('event_id', eventId);
          
        if (feeDeleteError) {
          console.error('Error deleting payment fee records:', feeDeleteError);
          throw new Error(`Cannot delete event: failed to remove payment fee records: ${feeDeleteError.message}`);
        }
        console.log('Successfully deleted payment fee records');
      }
      
      // 3. Delete the event - first check if the event exists
      const { data: eventCheck, error: eventCheckError } = await supabase
        .from('private_events')
        .select('*')
        .eq('id', eventId)
        .single();
        
      if (eventCheckError) {
        console.error('Error checking if event exists:', eventCheckError);
        throw new Error(`Event check failed: ${eventCheckError.message}`);
      }
      
      if (!eventCheck) {
        throw new Error('Event not found or already deleted');
      }
      
      // Now attempt to delete
      const { error: deleteError } = await supabase
        .from('private_events')
        .delete()
        .eq('id', eventId);
        
      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        throw new Error(`Delete failed: ${deleteError.message}`);
      }
      
      // 4. Update the UI by removing the deleted event
      setPrivateEvents(privateEvents.filter(event => event.id !== eventId));
      
      // 5. Show summary of refund process
      if (paidTickets.length > 0) {
        if (manualRefundsNeeded > 0) {
          const automaticRefunds = refundedCount - manualRefundsNeeded;
          alert(`Event deleted. ${automaticRefunds} tickets automatically refunded through Paystack. ${manualRefundsNeeded} tickets need manual refund processing (no payment reference found).`);
        } else if (refundErrors.length > 0) {
          alert(`Event deleted. ${refundedCount} of ${paidTickets.length} tickets were refunded successfully. Some refunds may require manual processing.`);
        } else {
          alert(`Event deleted successfully. All ${refundedCount} paid tickets have been refunded to the buyers.`);
        }
      } else {
        alert('Event deleted successfully. No paid tickets needed to be refunded.');
      }
      
    } catch (error) {
      console.error('Error deleting private event:', error);
      alert(`Failed to delete the private event. Please try again. ${error.message || ''}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has profile info
  const renderUserGreeting = () => {
    if (currentUser && currentUser.first_name) {
      return `${currentUser.first_name}'s Private Events`;
    }
    return 'My Private Events';
  };

  // Extract user information for the header
  const firstName = currentUser?.first_name || 'User';
  const lastName = currentUser?.last_name || '';
  const email = currentUser?.email || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  // Calculate pagination values
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = privateEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(privateEvents.length / eventsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Add fetchTickets function
  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) return;

      // Calculate pagination range
      const from = (currentTicketPage - 1) * ticketsPerPage;
      const to = from + ticketsPerPage - 1;

      // Get total count first by joining with private_events
      const { count } = await supabase
        .from('private_event_tickets')
        .select('*, private_events!inner(*)', { count: 'exact', head: true })
        .eq('private_events.user_id', user.id);

      setTotalTickets(count || 0);

      // Fetch tickets with pagination
      const { data, error } = await supabase
        .from('private_event_tickets')
        .select(`
          *,
          private_events!inner (
            event_name,
            event_start_date,
            user_id
          )
        `)
        .eq('private_events.user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load tickets. Please try again later.');
    } finally {
      setTicketsLoading(false);
    }
  };

  // Add useEffect for tickets
  useEffect(() => {
    fetchTickets();
  }, [currentTicketPage]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Loading State */}
        {loading ? (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="mt-4 text-slate-600 font-medium text-center">Loading private events...</div>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 max-w-7xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Header - Similar to dashboard and calendar */}
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-8 py-4 space-y-4 sm:space-y-0">
                <div className="w-full sm:w-auto">
                  <div className="text-sm text-slate-500 mb-1">Private Events</div>
                  <h1 className="text-2xl font-semibold text-slate-800">{renderUserGreeting()}</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <button 
                    onClick={handleCreateNewPrivateEvent}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Create New Private Event</span>
                  </button>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-medium shadow-md">
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

            {/* Main Content */}
            <div className="p-4 sm:p-6 md:p-8">
              {/* Header message */}
              <div className="mb-6 text-sm text-gray-500">
                <p>Manage and share your private events with specific guests via secure links</p>
              </div>

              {/* Events Grid */}
              {privateEvents.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No private events yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first private event
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleCreateNewPrivateEvent}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      Create New Private Event
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentEvents.map(event => (
                      <div key={event.id} className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 flex flex-col">
                        {/* Event Image */}
                        <div className="h-48 relative">
                          {event.cover_image_url ? (
                            <Image
                              src={event.cover_image_url}
                              alt={event.event_name}
                              layout="fill"
                              objectFit="cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Event type badge */}
                          <div className="absolute top-4 right-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              event.is_paid ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {event.is_paid ? 'Paid Event' : 'Free Event'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Event Details */}
                        <div className="p-4 flex-grow">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{event.event_name}</h3>
                          
                          <div className="mt-2 flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-500">{formatDate(event.event_start_date)}</p>
                              {event.event_end_date && event.event_end_date !== event.event_start_date && (
                                <p className="text-sm text-gray-500">to {formatDate(event.event_end_date)}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm text-gray-500 truncate">
                              {[event.address, event.city, event.state].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          
                          {event.is_paid && (
                            <div className="mt-2 flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="text-sm text-gray-500">₦{event.price} per ticket</p>
                                <p className="text-sm text-gray-500">
                                  {event.quantity_sold || 0} / {event.quantity} tickets sold
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Share link input */}
                          {event.share_link && (
                            <div className="mt-3">
                              <label htmlFor={`share-link-${event.id}`} className="sr-only">Share Link</label>
                              <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                  type="text"
                                  id={`share-link-${event.id}`}
                                  className="focus:ring-indigo-500 focus:border-indigo-500 flex-grow block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                                  value={`${window.location.origin}/private-event/${event.share_link}`}
                                  readOnly
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/private-event/${event.share_link}`);
                                    alert('Link copied to clipboard!');
                                  }}
                                  className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                    <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200 flex justify-end">
                          <div className="flex space-x-2">
                            <Link 
                              href={`/private-event-review?id=${event.id}`}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              Edit
                            </Link>
                            
                            <button
                              onClick={() => handleDeletePrivateEvent(event.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <nav className="flex items-center border border-gray-300 rounded-md divide-x">
                        <button 
                          onClick={goToPreviousPage} 
                          disabled={currentPage === 1}
                          className={`px-3 py-2 ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'} flex items-center`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Previous
                        </button>
                        
                        <div className="px-4 py-2 text-sm bg-gray-50 text-gray-700">
                          Page {currentPage} of {totalPages}
                        </div>
                        
                        <button 
                          onClick={goToNextPage} 
                          disabled={currentPage === totalPages}
                          className={`px-3 py-2 ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'} flex items-center`}
                        >
                          Next
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Add Tickets Table Section */}
            <div className="px-6 py-8">
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Tickets</h2>
                </div>
                
                <div className="overflow-x-auto">
                  {ticketsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No tickets found
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Buyer Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ticket Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{ticket.private_events?.event_name || 'Unknown Event'}</div>
                              <div className="text-sm text-gray-500">
                                {ticket.private_events?.event_start_date ? 
                                  new Date(ticket.private_events.event_start_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                  : 'Date not set'
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{ticket.buyer_name}</div>
                              <div className="text-sm text-gray-500">{ticket.buyer_email}</div>
                              <div className="text-sm text-gray-500">{ticket.buyer_phone || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">Code: {ticket.ticket_code}</div>
                              <div className="text-sm text-gray-500">Qty: {ticket.quantity}</div>
                              <div className="text-sm text-gray-500">Ref: {ticket.reference}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatCurrency(ticket.price_paid)}</div>
                              <div className="text-sm text-gray-500">Total: {formatCurrency(ticket.total_price)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                ticket.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : ticket.status === 'refunded'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Tickets Pagination */}
                {!ticketsLoading && tickets.length > 0 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentTicketPage(page => Math.max(page - 1, 1))}
                        disabled={currentTicketPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentTicketPage(page => Math.min(page + 1, Math.ceil(totalTickets / ticketsPerPage)))}
                        disabled={currentTicketPage === Math.ceil(totalTickets / ticketsPerPage)}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {Math.min((currentTicketPage - 1) * ticketsPerPage + 1, totalTickets)}
                          </span>
                          {' '}to{' '}
                          <span className="font-medium">
                            {Math.min(currentTicketPage * ticketsPerPage, totalTickets)}
                          </span>
                          {' '}of{' '}
                          <span className="font-medium">{totalTickets}</span>
                          {' '}results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          {Array.from({ length: Math.ceil(totalTickets / ticketsPerPage) }).map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setCurrentTicketPage(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentTicketPage === i + 1
                                  ? 'z-10 bg-black text-white border-black'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PrivateEvents() {
  return (
    <ProtectedRoute>
      <PrivateEventsContent />
    </ProtectedRoute>
  );
} 