'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabase';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';

function PaymentRequestsContent() {
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPaymentRequests();
  }, [filter, sortField, sortDirection]);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('payment_requests')
        .select(`
          id, 
          user_id,
          payment_method_id,
          amount, 
          status, 
          note,
          payment_method_details,
          created_at,
          updated_at,
          processed_at
        `);

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply search filter if present
      if (searchTerm) {
        // First get payment requests
        const { data: filteredRequests } = await query;
        
        if (filteredRequests && filteredRequests.length > 0) {
          // Get user details to match against search term
          const userIds = [...new Set(filteredRequests.map(req => req.user_id))];
          const { data: userData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
          
          // Filter payment requests by numeric search (amount/id) or by user match
          const matchingUserIds = userData?.map(user => user.id) || [];
          const filtered = filteredRequests.filter(req => {
            // Match by amount
            if (req.amount.toString().includes(searchTerm)) return true;
            // Match by ID
            if (req.id.toString().includes(searchTerm)) return true;
            // Match by note
            if (req.note && req.note.toLowerCase().includes(searchTerm.toLowerCase())) return true;
            // Match by user
            return matchingUserIds.includes(req.user_id);
          });
          
          // Sort the filtered results
          const sorted = sortPaymentRequests(filtered);
          
          // Get user details for the filtered requests
          await enrichWithUserData(sorted);
          return;
        }
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (data) {
        await enrichWithUserData(data);
      }
    } catch (err) {
      console.error('Error fetching payment requests:', err);
      setError(err.message);
      setPaymentRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const enrichWithUserData = async (requests) => {
    if (!requests || requests.length === 0) {
      setPaymentRequests([]);
      return;
    }
    
    try {
      // Get unique user IDs
      const userIds = [...new Set(requests.map(req => req.user_id))];
      
      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone')
        .in('id', userIds);
        
      if (userError) throw userError;
      
      // Create a map for quick lookup
      const userMap = userData.reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {});
      
      // Add user data to payment requests
      const enrichedData = requests.map(req => ({
        ...req,
        user: userMap[req.user_id] || null
      }));
      
      setPaymentRequests(enrichedData);
    } catch (err) {
      console.error('Error enriching user data:', err);
      // Still set the payment requests even without user data
      setPaymentRequests(requests);
    }
  };

  const sortPaymentRequests = (requests) => {
    return [...requests].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDirection === 'asc' 
          ? parseFloat(a.amount) - parseFloat(b.amount)
          : parseFloat(b.amount) - parseFloat(a.amount);
      }
      
      if (sortField === 'created_at' || sortField === 'updated_at' || sortField === 'processed_at') {
        const dateA = new Date(a[sortField] || 0);
        const dateB = new Date(b[sortField] || 0);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Default string comparison
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      return sortDirection === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setProcessingId(id);
      
      const { error } = await supabase
        .from('payment_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'paid'
            ? { processed_at: new Date().toISOString() } 
            : {}
          )
        })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the payment requests
      fetchPaymentRequests();
    } catch (err) {
      console.error('Error updating payment request:', err);
      alert(`Failed to update payment request: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to descending by default
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Payment Requests</h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        
        {/* Filters and search */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label htmlFor="payment-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="payment-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by user, amount, or notes..."
                  className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={fetchPaymentRequests}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment requests table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="mb-4 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payment Requests</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : paymentRequests.length === 0 ? (
            <div className="p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mt-4">No Payment Requests Found</h3>
              <p className="text-gray-600 mt-2">There are no payment requests matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('created_at')}>
                      Date {renderSortIcon('created_at')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amount')}>
                      Amount {renderSortIcon('amount')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                      Status {renderSortIcon('status')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            {request.user?.first_name?.charAt(0) || '?'}
                            {request.user?.last_name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.user ? `${request.user.first_name} ${request.user.last_name}` : 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.user?.email || request.user_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₦{Number(request.amount).toLocaleString()}</div>
                        {request.note && (
                          <div className="text-xs text-gray-500 max-w-xs truncate" title={request.note}>
                            {request.note}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          request.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/payments/${request.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </button>
                        
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'approved')}
                              disabled={processingId === request.id}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              {processingId === request.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'rejected')}
                              disabled={processingId === request.id}
                              className="text-red-600 hover:text-red-900"
                            >
                              {processingId === request.id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        )}
                        
                        {request.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'paid')}
                            disabled={processingId === request.id}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {processingId === request.id ? 'Processing...' : 'Mark Paid'}
                          </button>
                        )}
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
  );
}

export default function PaymentRequestsPage() {
  return (
    <AdminProtectedRoute>
      <PaymentRequestsContent />
    </AdminProtectedRoute>
  );
} 