'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '../../lib/supabase';

export default function PartnerRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
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

  // Fetch partner requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        
        // Calculate pagination
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Query to count total records with filter
        let countQuery = supabase
          .from('partner_requests')
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
          .from('partner_requests')
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
        
        setRequests(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching partner requests:', err);
        setError('Failed to load partner requests. Please try again later.');
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
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
  
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    
    // Mark as reviewed if it was pending
    if (request.status === 'pending') {
      updateRequestStatus(request.id, 'reviewed');
    }
  };
  
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('partner_requests')
        .update({ status: newStatus })
        .eq('id', requestId);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setRequests(requests.map(req => {
        if (req.id === requestId) {
          return { ...req, status: newStatus };
        }
        return req;
      }));
      
      // Also update selected request if it's the one being updated
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
      
    } catch (err) {
      console.error('Error updating request status:', err);
      alert('Failed to update request status. Please try again.');
    }
  };
  
  const closeRequestView = () => {
    setSelectedRequest(null);
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

  // Request detail view
  const RequestDetail = () => {
    if (!selectedRequest) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-amber-50">
            <h3 className="text-lg font-medium text-amber-900">Partner Request Detail</h3>
            <button 
              onClick={closeRequestView}
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
                <p className="text-sm font-medium text-gray-500">Company</p>
                <p className="text-sm font-medium text-gray-900">{selectedRequest.company_name}</p>
              </div>
              <div className="col-span-3 md:col-span-1">
                <p className="text-sm font-medium text-gray-500">Contact Person</p>
                <p className="text-sm font-medium text-gray-900">{selectedRequest.contact_person}</p>
              </div>
              <div className="col-span-3 md:col-span-1">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <a href={`mailto:${selectedRequest.email}`} className="text-sm font-medium text-amber-600 hover:text-amber-800">
                  {selectedRequest.email}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-1">
                <p className="text-sm font-medium text-gray-500">Partnership Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{selectedRequest.partnership_type}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm font-medium text-gray-500">Website</p>
                {selectedRequest.website ? (
                  <a href={selectedRequest.website.startsWith('http') ? selectedRequest.website : `https://${selectedRequest.website}`} 
                     target="_blank" rel="noopener noreferrer"
                     className="text-sm font-medium text-amber-600 hover:text-amber-800">
                    {selectedRequest.website}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-500">Not provided</p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Message</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.message}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Received on</p>
              <p className="text-sm text-gray-700">{formatDate(selectedRequest.created_at)}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="mt-1 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                  ${selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    selectedRequest.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 
                    selectedRequest.status === 'contacted' ? 'bg-green-100 text-green-800' : 
                    selectedRequest.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`
                }>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => updateRequestStatus(selectedRequest.id, 'pending')}
              className={`px-3 py-1.5 border border-yellow-600 text-yellow-600 rounded ${
                selectedRequest.status === 'pending' ? 'bg-yellow-50' : 'hover:bg-yellow-50'
              }`}
            >
              Mark as Pending
            </button>
            <button
              onClick={() => updateRequestStatus(selectedRequest.id, 'reviewed')}
              className={`px-3 py-1.5 border border-blue-600 text-blue-600 rounded ${
                selectedRequest.status === 'reviewed' ? 'bg-blue-50' : 'hover:bg-blue-50'
              }`}
            >
              Mark as Reviewed
            </button>
            <button
              onClick={() => updateRequestStatus(selectedRequest.id, 'contacted')}
              className={`px-3 py-1.5 border border-green-600 text-green-600 rounded ${
                selectedRequest.status === 'contacted' ? 'bg-green-50' : 'hover:bg-green-50'
              }`}
            >
              Mark as Contacted
            </button>
            <button
              onClick={() => updateRequestStatus(selectedRequest.id, 'declined')}
              className={`px-3 py-1.5 border border-red-600 text-red-600 rounded ${
                selectedRequest.status === 'declined' ? 'bg-red-50' : 'hover:bg-red-50'
              }`}
            >
              Mark as Declined
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Partner Requests</h1>
              <p className="text-gray-600">Manage and respond to partnership requests from the partner form</p>
            </div>
            <Link href="/admin/dashboard">
              <button className="mt-4 md:mt-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors">
                Back to Dashboard
              </button>
            </Link>
          </div>
          
          {/* Filter controls */}
          <div className="mb-6">
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="contacted">Contacted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
            </div>
          )}
          
          {/* Error state */}
          {!isLoading && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && !error && requests.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800">No partner requests found</h3>
              <p className="text-gray-600 mt-1">There are no partner requests yet.</p>
            </div>
          )}
          
          {/* Partner requests table */}
          {!isLoading && !error && requests.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id}
                          className={request.status === 'pending' ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-sm mr-3">
                              {request.company_name.charAt(0)}
                            </div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                              {request.company_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">{request.partnership_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.contact_person}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              request.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 
                              request.status === 'contacted' ? 'bg-green-100 text-green-800' : 
                              request.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`
                          }>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewRequest(request)}
                            className="text-amber-600 hover:text-amber-900 mr-3"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{Math.min(totalCount, (currentPage - 1) * pageSize + 1)}</span> to{" "}
                  <span className="font-medium">{Math.min(totalCount, currentPage * pageSize)}</span> of{" "}
                  <span className="font-medium">{totalCount}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 border rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 border rounded-md ${
                      currentPage >= totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Detail modal */}
      <RequestDetail />
    </div>
  );
} 