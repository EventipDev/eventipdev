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

  // If still loading auth state or not authenticated, show loading or redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }
  
  if (!user) {
    // This shouldn't be visible as the useEffect will redirect,
    // but just in case there's a delay in the redirect
    return null;
  }
  
  // Function to handle ticket search by email
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address to search');
      return;
    }
    
    try {
      setError(null);
      setAllTickets([]);
      setFreeTickets([]);
      setPaidTickets([]);
      setLoading(true);
      setSearched(true);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Fetch tickets from the main tickets table
      console.log('Fetching tickets from general tickets table for email:', email);
      try {
        const ticketsResponse = await fetch(`/api/tickets?email=${encodeURIComponent(email)}`);
        
        if (ticketsResponse.ok) {
          const ticketsResult = await ticketsResponse.json();
          
          if (ticketsResult.success) {
            console.log(`General tickets fetched: ${ticketsResult.data.length} tickets found`);
            setAllTickets(ticketsResult.data || []);
          } else {
            console.warn('Tickets API returned success: false -', ticketsResult.message);
          }
        } else {
          console.warn(`General tickets API returned ${ticketsResponse.status}: ${ticketsResponse.statusText}`);
          // Don't throw error, continue with other API calls
        }
      } catch (ticketsError) {
        console.warn('Error fetching from general tickets API:', ticketsError);
        // Continue with other API calls, don't abort the entire process
      }
      
      // Fetch paid tickets
      console.log('Fetching paid tickets for email:', email);
      try {
        const paidResponse = await fetch(`/api/tickets?email=${encodeURIComponent(email)}`);
        
        if (paidResponse.ok) {
          const paidResult = await paidResponse.json();
          
          if (paidResult.success) {
            console.log(`Paid tickets fetched: ${paidResult.data.length} tickets found`);
            setPaidTickets(paidResult.data || []);
          } else {
            console.warn('Paid tickets API returned success: false -', paidResult.message);
          }
        } else {
          console.warn(`Paid tickets API returned ${paidResponse.status}: ${paidResponse.statusText}`);
        }
      } catch (paidError) {
        console.warn('Error fetching from paid tickets API:', paidError);
      }
      
      // Fetch free tickets
      console.log('Fetching free tickets for email:', email);
      try {
        const freeResponse = await fetch(`/api/free-tickets?email=${encodeURIComponent(email)}`);
        
        if (freeResponse.ok) {
          const freeResult = await freeResponse.json();
          
          if (freeResult.success) {
            console.log(`Free tickets fetched: ${freeResult.data.length} tickets found`);
            setFreeTickets(freeResult.data || []);
          } else {
            console.warn('Free tickets API returned success: false -', freeResult.message);
          }
        } else {
          console.warn(`Free tickets API returned ${freeResponse.status}: ${freeResponse.statusText}`);
        }
      } catch (freeError) {
        console.warn('Error fetching from free tickets API:', freeError);
      }
      
    } catch (err) {
      console.error('Error searching tickets:', err);
      setError('Error searching for tickets. Please try again.');
    } finally {
      setLoading(false);
    }
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
          
          {/* Search Results - General Tickets */}
          {searched && !loading && allTickets.length > 0 && (
            <div className="mb-12 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">General Tickets</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Ticket Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.event_title || `Event ID: ${ticket.event_id?.substring(0, 8)}...`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ticket.event_date ? formatDate(ticket.event_date) : formatDate(ticket.purchase_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.customer_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {ticket.ticket_type || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₦{parseFloat(ticket.price_paid || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.purchase_date || ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ticket.status === 'active' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/tickets/${ticket.reference}`} className="text-purple-600 hover:text-purple-900 font-bold">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Search Results - Paid Tickets */}
          {searched && !loading && paidTickets.length > 0 && (
            <div className="mb-12 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Paid Event Tickets</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paidTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.event_title || `Event ID: ${ticket.event_id?.substring(0, 8)}...`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ticket.event_date ? formatDate(ticket.event_date) : formatDate(ticket.purchase_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.customer_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{ticket.customer_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                            {ticket.ticket_type || 'Paid Ticket'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₦{parseFloat(ticket.price_paid || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.purchase_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ticket.status === 'active' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/tickets/${ticket.reference}`} className="text-amber-600 hover:text-amber-900 font-bold">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Search Results - Free Tickets */}
          {searched && !loading && freeTickets.length > 0 && (
            <div className="mb-12 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Free Event Tickets</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Attendee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Ticket Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {freeTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.event_title || 'Event'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(ticket.event_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.customer_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{ticket.customer_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {ticket.ticket_type || 'Free Ticket'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(ticket.event_date)}</div>
                          <div className="text-xs text-gray-500">{ticket.event_time || 'Time not specified'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.event_location || 'Location not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ticket.status === 'active' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/tickets/${ticket.reference}`} className="text-blue-600 hover:text-blue-900 font-bold">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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