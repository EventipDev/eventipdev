'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabase';
import Link from 'next/link';

// Update the MetricCard component with a monochrome design
function MetricCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center text-white">
            {icon}
          </div>
          <div className="ml-5">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-black mt-1">{value}</p>
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-black"></div>
    </div>
  );
}

// Component for recent payment requests
function PaymentRequestsTab({ router }) {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    const fetchPaymentRequests = async () => {
      try {
        // Get total count first
        const { count, error: countError } = await supabase
          .from('payment_requests')
          .select('*', { count: 'exact', head: true });
          
        if (!countError) {
          setTotalCount(count);
        }
        
        // Calculate offset
        const offset = (currentPage - 1) * pageSize;
        
        // First try to get just the payment requests without joins
        const { data, error } = await supabase
          .from('payment_requests')
          .select(`
            id, 
            user_id,
            payment_method_id,
            amount, 
            status, 
            note,
            created_at
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.log('Error fetching payment requests:', error);
          setError(error.message);
          setPaymentRequests([]);
          return;
        }

        // If we successfully got data, try to get user details separately
        if (data && data.length > 0) {
          // Get unique user IDs
          const userIds = [...new Set(data.map(req => req.user_id))];
          
          // Get user details for these IDs
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', userIds);
            
          if (!userError && userData) {
            // Create a map of user data for quick lookup
            const userMap = userData.reduce((map, user) => {
              map[user.id] = user;
              return map;
            }, {});
            
            // Add user data to payment requests
            const enrichedData = data.map(req => ({
              ...req,
              user: userMap[req.user_id] || null
            }));
            
            setPaymentRequests(enrichedData);
          } else {
            // Just use the payment requests without user data
            setPaymentRequests(data);
          }
        } else {
          setPaymentRequests([]);
        }
      } catch (error) {
        console.error('Error in payment requests component:', error);
        setError('Failed to fetch payment requests');
        setPaymentRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentRequests();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Payment Requests</h2>
          <button
            onClick={() => router.push('/admin/payments')}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            View All
          </button>
        </div>
        <div className="p-4 bg-red-50 rounded-md text-red-700">
          <p>There was an error loading payment requests: {error}</p>
          <p className="text-sm mt-2">Please ensure the payment_requests table is set up correctly in your database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Payment Requests</h3>
        <button
          onClick={() => router.push('/admin/payments')}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          View All
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentRequests.length > 0 ? (
                  paymentRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            {request.user?.first_name?.charAt(0) || '?'}
                            {request.user?.last_name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.user?.first_name || 'User'} {request.user?.last_name || request.user_id}
                            </div>
                            <div className="text-sm text-gray-500">{request.user?.email || request.user_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₦{Number(request.amount).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          request.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/payments/${request.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No payment requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {/* Current page display */}
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Component for recent messages
function MessagesTab({ router }) {
  const [recentMessages, setRecentMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    const fetchRecentMessages = async () => {
      try {
        // Get total count first
        const { count, error: countError } = await supabase
          .from('conversation_messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_type', 'user');
          
        if (!countError) {
          setTotalCount(count);
        }
        
        // Calculate offset
        const offset = (currentPage - 1) * pageSize;
        
        // Get recent messages with user info
        const { data, error } = await supabase
          .from('conversation_messages')
          .select(`
            id,
            conversation_id,
            sender_type,
            message,
            is_read,
            created_at,
            conversations (
              user_id,
              users (
                id,
                first_name,
                last_name,
                email
              )
            )
          `)
          .eq('sender_type', 'user')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        
        // Count unread messages
        const unreadMessages = data.filter(msg => !msg.is_read);
        setUnreadCount(unreadMessages.length);
        
        setRecentMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentMessages();
    
    // Set up subscription for new messages
    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: 'sender_type=eq.user'
        },
        () => {
          fetchRecentMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Messages</h2>
        {unreadCount > 0 && (
          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            {unreadCount} unread
          </div>
        )}
        <button
          onClick={() => router.push('/admin/dashboard/messages')}
          className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
        >
          View All
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {recentMessages.length > 0 ? (
              recentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${message.is_read ? 'bg-gray-50' : 'bg-indigo-50 border-l-4 border-indigo-500'}`}
                >
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        {message.conversations?.users?.first_name?.charAt(0) || ''}
                        {message.conversations?.users?.last_name?.charAt(0) || ''}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {message.conversations?.users?.first_name} {message.conversations?.users?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()} at{' '}
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/admin/dashboard/messages?user=${message.conversations?.user_id}`)}
                      className="text-xs text-indigo-600 hover:text-indigo-900"
                    >
                      Reply
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{message.message}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No messages found</div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="pt-4 mt-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {/* Current page display */}
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Update the AdminDashboardContent function with modern styling
function AdminDashboardContent() {
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    totalUsers: 0,
    pendingPayments: 0,
    unreadMessages: 0,
    partnerRequests: 0,
    notifications: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch events count
        const { count: eventsCount, error: eventsError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });
          
        // Fetch users count
        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
          
        // Fetch pending payments count
        const { count: paymentsCount, error: paymentsError } = await supabase
          .from('payment_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
          
        // Fetch unread messages count
        const { count: messagesCount, error: messagesError } = await supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'unread');
          
        // Fetch partner requests count
        const { count: partnerCount, error: partnerError } = await supabase
          .from('partner_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        setMetrics({
          totalEvents: eventsCount || 0,
          totalUsers: usersCount || 0,
          pendingPayments: paymentsCount || 0,
          unreadMessages: messagesCount || 0,
          partnerRequests: partnerCount || 0,
          notifications: 3
        });
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 text-center mb-4">
            There was an error loading the dashboard data. Please check your database connection.
          </p>
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          <div className="mt-6 text-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <div className="mt-4 md:mt-0 space-x-3">
              <Link 
                href="/admin/customers"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Customer Details
              </Link>
              {/* ... existing buttons ... */}
          </div>
        </div>

          {/* Quick Stats Section */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="TOTAL EVENTS"
            value={metrics.totalEvents}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          
          <MetricCard
            title="TOTAL USERS"
            value={metrics.totalUsers}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          
          <MetricCard
            title="PENDING PAYMENTS"
            value={metrics.pendingPayments}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <MetricCard
            title="UNREAD MESSAGES"
            value={metrics.unreadMessages}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          
          <MetricCard
            title="PARTNER REQUESTS"
            value={metrics.partnerRequests}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          
          <MetricCard
            title="NOTIFICATIONS"
            value={metrics.notifications}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
          />
        </div>

          {/* Customer Management Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Management</h2>
            
            <div className="space-y-3">
              <div className="group cursor-pointer" onClick={() => router.push('/admin/customers')}>
                <div className="relative overflow-hidden rounded-lg hover:shadow-md transition-shadow duration-300 border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center text-indigo-600 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Customer Details</h3>
                      <p className="text-xs text-gray-500">View and manage customer information</p>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => router.push('/admin/promotion-events')}>
                <div className="relative overflow-hidden rounded-lg hover:shadow-md transition-shadow duration-300 border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center text-green-600 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Promotion Management</h3>
                      <p className="text-xs text-gray-500">Manage promoted events</p>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors duration-200" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Recent Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PaymentRequestsTab router={router} />
          <MessagesTab router={router} />
        </div>

        {/* Quick Links Section */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/admin/notifications/contact" className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">Contact Messages</h3>
                <p className="text-sm text-gray-500">Manage customer inquiries</p>
              </div>
            </Link>
            
            <Link href="/admin/notifications/partners" className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="flex-shrink-0 h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">Partnership Requests</h3>
                <p className="text-sm text-gray-500">Manage partnership applications</p>
              </div>
            </Link>
            
            <Link href="/admin/payments" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">Payment Management</h3>
                <p className="text-sm text-gray-500">Process payment requests</p>
              </div>
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected Dashboard Page
export default function AdminDashboard() {
  return <AdminDashboardContent />;
} 