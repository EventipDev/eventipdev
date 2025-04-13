'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '../../lib/supabase';

export default function ContactMessages() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const pageSize = 10;

  // Admin check
  useEffect(() => {
    const checkAdmin = () => {
      if (typeof window !== 'undefined') {
        try {
          const adminData = localStorage.getItem('admin');
          
          if (!adminData) {
            router.push('/admin/login');
            return;
          }
          
          const admin = JSON.parse(adminData);
          if (!admin || !admin.isAdmin) {
            router.push('/admin/login');
          }
        } catch (error) {
          console.error('Error checking admin authentication:', error);
          router.push('/admin/login');
        }
      }
    };
    
    checkAdmin();
  }, [router]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        
        // Calculate pagination
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Query to count total records with filter
        let countQuery = supabase
          .from('contact_messages')
          .select('id', { count: 'exact', head: true });
          
        if (statusFilter !== 'all') {
          countQuery = countQuery.eq('status', statusFilter);
        }
        
        const { count, error: countError } = await countQuery;
        
        if (countError) {
          throw countError;
        }
        
        setTotalCount(count || 0);
        
        // Main query to fetch data with filter
        let query = supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);
          
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setMessages(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching contact messages:', err);
        setError('Failed to load contact messages. Please try again later.');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [currentPage, statusFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    
    // Mark as read if it was unread
    if (message.status === 'unread') {
      updateMessageStatus(message.id, 'read');
    }
  };
  
  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', messageId);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setMessages(messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, status: newStatus };
        }
        return msg;
      }));
      
      // Also update selected message if it's the one being updated
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
      
    } catch (err) {
      console.error('Error updating message status:', err);
      alert('Failed to update message status. Please try again.');
    }
  };
  
  const closeMessageView = () => {
    setSelectedMessage(null);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Message detail view
  const MessageDetail = () => {
    if (!selectedMessage) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
            <h3 className="text-lg font-medium text-indigo-900">Message Detail</h3>
            <button 
              onClick={closeMessageView}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-y-auto p-4 flex-grow">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-3 md:col-span-1">
                <p className="text-sm font-medium text-gray-500">From</p>
                <p className="text-sm font-medium text-gray-900">{selectedMessage.name}</p>
              </div>
              <div className="col-span-3 md:col-span-1">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <a href={`mailto:${selectedMessage.email}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  {selectedMessage.email}
                </a>
              </div>
              <div className="col-span-3 md:col-span-1">
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(selectedMessage.created_at)}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Subject</p>
              <p className="text-base font-medium text-gray-900">{selectedMessage.subject}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Message</p>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-800">
                {selectedMessage.message}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-700 mr-2">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                selectedMessage.status === 'unread' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : selectedMessage.status === 'read' 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
              </span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                disabled={selectedMessage.status === 'read'}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  selectedMessage.status === 'read'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Mark as Read
              </button>
              <button
                onClick={() => updateMessageStatus(selectedMessage.id, 'resolved')}
                disabled={selectedMessage.status === 'resolved'}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  selectedMessage.status === 'resolved'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Mark as Resolved
              </button>
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                className="px-3 py-1 text-sm font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Reply by Email
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-4 sm:px-0 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Contact Messages</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and respond to messages from the contact form
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center">
              <Link href="/admin/dashboard">
                <button
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Filter Controls */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex-grow mb-4 sm:mb-0">
              <label htmlFor="status-filter" className="sr-only">Filter by status</label>
              <div className="relative">
                <select
                  id="status-filter"
                  name="status-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Messages</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                {totalCount === 0 
                  ? 'No messages' 
                  : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} messages`}
              </span>
            </div>
          </div>
          
          {/* Messages List */}
          {isLoading ? (
            <div className="px-4 py-10 sm:px-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent" />
              <p className="mt-4 text-gray-500">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="px-4 py-6 sm:px-6">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading messages</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="px-4 py-6 sm:px-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all' 
                  ? 'There are no contact messages yet.'
                  : `There are no ${statusFilter} messages at this time.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr 
                      key={message.id} 
                      className={`hover:bg-gray-50 ${message.status === 'unread' ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                            {message.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{message.name}</div>
                            <div className="text-sm text-gray-500">{message.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{message.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(message.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          message.status === 'unread' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : message.status === 'read' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewMessage(message)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => updateMessageStatus(message.id, message.status === 'unread' ? 'read' : 'unread')}
                          className={`${
                            message.status === 'unread' 
                              ? 'text-blue-600 hover:text-blue-900' 
                              : 'text-yellow-600 hover:text-yellow-900'
                          } mr-4`}
                        >
                          {message.status === 'unread' ? 'Mark Read' : 'Mark Unread'}
                        </button>
                        <button
                          onClick={() => updateMessageStatus(message.id, 'resolved')}
                          className="text-green-600 hover:text-green-900"
                          disabled={message.status === 'resolved'}
                        >
                          {message.status === 'resolved' ? 'Resolved' : 'Resolve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalCount > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show 5 pages max, centered around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
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
        </div>
      </div>
      
      {/* Message Detail Modal */}
      <MessageDetail />
    </div>
  );
} 