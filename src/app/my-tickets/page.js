'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';

export default function MyTickets() {
  const router = useRouter();
  const [allTickets, setAllTickets] = useState([]);
  const [freeTickets, setFreeTickets] = useState([]);
  const [paidTickets, setPaidTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      
      try {
        // Check for user in localStorage
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          setUser(storedUser);
          setEmail(storedUser.email || ''); // Set the email from the user object
          setIsLoading(false);
          return;
        }
        
        // Alternatively, check directly from the database
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setUser(data[0]);
          setEmail(data[0].email || ''); // Set the email from the user object
          // Store user in localStorage for future access
          localStorage.setItem('user', JSON.stringify(data[0]));
        } else {
          // If not found, redirect to login
          router.push('/signin');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/signin');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  // Fetch tickets automatically when the component loads and user is authenticated
  useEffect(() => {
    if (user && user.email) {
      // Set the email field with the current user's email
      setEmail(user.email);
      // Fetch tickets for the user automatically
      fetchUserTickets(user.email);
    }
  }, [user]);

  // Function to fetch user tickets
  const fetchUserTickets = async (userEmail) => {
    if (!userEmail) return;
    
    try {
      setError(null);
      setAllTickets([]);
      setFreeTickets([]);
      setPaidTickets([]);
      setLoading(true);
      setSearched(true);
      
      // Fetch paid tickets from the tickets table
      console.log('Fetching paid tickets for user:', userEmail);
      try {
        const { data: paidTicketsData, error: paidError } = await supabase
          .from('tickets')
          .select(`
            id,
            event_id,
            ticket_tier_id,
            user_id,
            customer_email,
            price_paid,
            ticket_code,
            ticket_type,
            reference,
            transaction_id,
            status,
            is_used,
            checked_in_at,
            checked_in_by,
            purchase_date,
            created_at,
            updated_at,
            events (
              name,
              event_date,
              start_time,
              city,
              state,
              address
            )
          `)
          .eq('customer_email', userEmail)
          .order('purchase_date', { ascending: false });

        if (paidError) {
          console.error('Error fetching paid tickets:', paidError);
        } else {
          console.log(`Paid tickets fetched: ${paidTicketsData.length} tickets found`);
          
          // Process the paid tickets data to include event details
          const processedPaidTickets = paidTicketsData.map(ticket => ({
            ...ticket,
            event_title: ticket.events?.name || 'Unknown Event',
            event_date: ticket.events?.event_date || null,
            event_time: ticket.events?.start_time || null,
            event_location: ticket.events?.address ? 
              `${ticket.events.address}, ${ticket.events.city || ''}${ticket.events.state ? `, ${ticket.events.state}` : ''}` : 
              `${ticket.events?.city || ''}${ticket.events?.state ? `, ${ticket.events.state}` : ''}`
          }));
          
          setPaidTickets(processedPaidTickets);
          // Also add to all tickets for the combined view
          setAllTickets(prev => [...prev, ...processedPaidTickets]);
        }
      } catch (error) {
        console.error('Error in paid tickets query:', error);
      }
      
      // Fetch free tickets from the free_tickets table
      console.log('Fetching free tickets for user:', userEmail);
      try {
        const { data: freeTicketsData, error: freeError } = await supabase
          .from('free_tickets')
          .select(`
            id,
            user_id,
            event_id,
            reference,
            customer_email,
            customer_name,
            customer_phone,
            event_title,
            event_date,
            event_time,
            event_location,
            ticket_type,
            price_paid,
            status,
            is_used,
            purchase_date,
            created_at,
            updated_at
          `)
          .eq('customer_email', userEmail)
          .order('purchase_date', { ascending: false });

        if (freeError) {
          console.error('Error fetching free tickets:', freeError);
        } else {
          console.log(`Free tickets fetched: ${freeTicketsData.length} tickets found`);
          setFreeTickets(freeTicketsData);
          // Also add to all tickets for the combined view
          setAllTickets(prev => [...prev, ...freeTicketsData]);
        }
      } catch (error) {
        console.error('Error in free tickets query:', error);
      }
      
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Error fetching your tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle ticket search by email
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address to search');
      return;
    }
    
    // Use the common ticket fetching function
    fetchUserTickets(email);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50">
      <Navbar />
      
      <div className="flex-grow">
        {/* Hero Section - Simple amber header */}
        <div className="bg-gradient-to-r from-amber-900 to-orange-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-12 w-full">
            <h1 className="text-4xl font-bold mb-4 tracking-tight">My Tickets</h1>
            <p className="text-amber-100 text-lg max-w-2xl">
              Find all your event tickets in one place.
            </p>
          </div>
        </div>
        
        {/* Main content area with white background */}
        <div className="max-w-6xl mx-auto px-4 w-full py-12">
          {/* Search Section */}
          <div className="mb-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Search Your Tickets</h2>
            
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter the email used for your ticket"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </span>
                    ) : "Search Tickets"}
                  </button>
                </div>
              </div>
            </form>
            
            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
              </div>
            )}
            
            {searched && !loading && allTickets.length === 0 && paidTickets.length === 0 && freeTickets.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No tickets found</h3>
                <p className="mt-1 text-gray-500">We couldn't find any tickets associated with this email address.</p>
              </div>
            )}
          </div>
          
          {/* Your Tickets Section */}
          {user && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-black mb-4">Your Tickets</h2>
              <p className="text-gray-600 mb-6">Here are all the tickets associated with your account.</p>
            </div>
          )}
          
          {/* Search Results - General Tickets */}
          {searched && !loading && allTickets.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">All Tickets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Ticket header with status */}
                    <div className="p-4 bg-gradient-to-r from-gray-800 to-black text-white relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -inset-[10px] opacity-20 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-45deg] animate-shine"></div>
                      </div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        <h3 className="font-bold text-lg line-clamp-1">{ticket.event_title || `Event ID: ${ticket.event_id?.substring(0, 8)}...`}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.status === 'active' || ticket.status === 'completed' ? 'bg-green-500 text-white' : 
                          ticket.status === 'pending' ? 'bg-yellow-400 text-gray-800' : 
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {ticket.status || 'unknown'}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-gray-300 relative z-10">
                        {ticket.event_date ? formatDate(ticket.event_date) : formatDate(ticket.purchase_date || ticket.created_at)}
                      </p>
                    </div>
                    
                    {/* Ticket details */}
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-600">{ticket.customer_email || ticket.email || 'N/A'}</span>
                          </div>
                        
                        {ticket.event_location && (
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">{ticket.event_location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          <span className="text-sm font-medium px-3 py-1 rounded-full 
                            bg-gradient-to-r 
                            from-gray-50 to-gray-100 
                            text-gray-700 
                            border border-gray-200">
                            {ticket.ticket_type || 'Standard Ticket'}
                          </span>
                        </div>
                        
                        {parseFloat(ticket.price_paid) > 0 && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-bold text-gray-800">₦{parseFloat(ticket.price_paid || 0).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {ticket.ticket_code && (
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                          <p className="text-xs text-gray-500 mb-1">Ticket Code</p>
                          <p className="text-sm font-mono font-medium text-gray-800">{ticket.ticket_code}</p>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.purchase_date || ticket.created_at).toLocaleDateString()} at {new Date(ticket.purchase_date || ticket.created_at).toLocaleTimeString()}
                          </span>
                        <Link 
                          href={`/tickets/${ticket.reference}`} 
                          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                          View Ticket
                          </Link>
                      </div>
                    </div>
                  </div>
                    ))}
              </div>
            </div>
          )}
          
          {/* Free Tickets */}
          {searched && !loading && freeTickets.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Free Tickets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {freeTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Ticket header */}
                    <div className="p-4 bg-gradient-to-r from-gray-800 to-black text-white relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -inset-[10px] opacity-20 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-45deg] animate-shine"></div>
                      </div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        <h3 className="font-bold text-lg line-clamp-1">{ticket.event_title || `Event ID: ${ticket.event_id?.substring(0, 8)}...`}</h3>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white text-gray-800">Free</span>
                      </div>
                      <p className="text-sm mt-1 text-gray-300 relative z-10">
                        {formatDate(ticket.event_date || ticket.created_at)}
                      </p>
                    </div>
                    
                    {/* Ticket details */}
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-600">{ticket.customer_name || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">{ticket.customer_email}</span>
                          </div>
                        
                        {ticket.event_location && (
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">{ticket.event_location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          <span className="text-sm font-medium px-3 py-1 rounded-full 
                            bg-gradient-to-r 
                            from-gray-50 to-gray-100 
                            text-gray-700 
                            border border-gray-200">
                            {ticket.ticket_type || 'Free Ticket'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Event Time</p>
                            <p className="text-sm font-medium text-gray-800">{ticket.event_time || 'Time not specified'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.status === 'active' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {ticket.status || 'active'}
                          </span>
                        <Link 
                          href={`/tickets/${ticket.reference}`} 
                          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                          View Ticket
                          </Link>
                      </div>
                    </div>
                  </div>
                    ))}
              </div>
            </div>
          )}
          
          {/* Paid Tickets */}
          {searched && !loading && paidTickets.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Paid Tickets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Ticket header */}
                    <div className="p-4 bg-gradient-to-r from-gray-800 to-black text-white relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -inset-[10px] opacity-20 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-45deg] animate-shine"></div>
                      </div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        <h3 className="font-bold text-lg line-clamp-1">{ticket.event_title || `Event ID: ${ticket.event_id?.substring(0, 8)}...`}</h3>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white text-gray-800">
                          ₦{parseFloat(ticket.price_paid || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-gray-300 relative z-10">
                        {formatDate(ticket.event_date || ticket.purchase_date || ticket.created_at)}
                      </p>
                    </div>
                    
                    {/* Ticket details */}
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">{ticket.customer_email}</span>
                          </div>
                        
                        {ticket.event_location && (
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">{ticket.event_location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          <span className="text-sm font-medium px-3 py-1 rounded-full 
                            bg-gradient-to-r 
                            from-gray-50 to-gray-100 
                            text-gray-700 
                            border border-gray-200">
                            {ticket.ticket_type || 'Premium Ticket'}
                          </span>
                        </div>
                        
                        {ticket.transaction_id && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-xs text-gray-500">Transaction: {ticket.transaction_id}</span>
                          </div>
                        )}
                      </div>
                      
                      {ticket.ticket_code && (
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                          <p className="text-xs text-gray-500 mb-1">Ticket Code</p>
                          <p className="text-sm font-mono font-medium text-gray-800">{ticket.ticket_code}</p>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.status === 'active' || ticket.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status || 'unknown'}
                          </span>
                        <Link 
                          href={`/tickets/${ticket.reference}`} 
                          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                          View Ticket
                          </Link>
                      </div>
                    </div>
                  </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Animated Shine Black Section */}
      <div className="max-w-6xl mx-auto px-4 w-full mb-12">
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

        <div className="bg-black rounded-2xl overflow-hidden shadow-xl relative">
          {/* Animated shine effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[10px] opacity-30 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-45deg] animate-shine"></div>
          </div>
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">All Your Tickets in One Place</h3>
                <p className="text-white/80 max-w-md">
                  Keep track of your upcoming events, manage your bookings, and never miss a moment. Your digital ticket wallet for seamless event experiences.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <div className="relative h-48 w-full md:w-64 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                    alt="Digital tickets"
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
    </div>
  );
}