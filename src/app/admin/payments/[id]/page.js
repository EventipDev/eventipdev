'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabase';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';

function PaymentRequestDetailContent({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPaymentRequestDetails();
  }, [id]);

  const fetchPaymentRequestDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch payment request
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (requestError) throw requestError;
      
      setPaymentRequest(requestData);
      
      // Fetch user details
      if (requestData.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, phone, created_at')
          .eq('id', requestData.user_id)
          .single();
        
        if (!userError) {
          setUser(userData);
        }
      }
      
      // Fetch payment method details if available
      if (requestData.payment_method_id) {
        const { data: methodData, error: methodError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('id', requestData.payment_method_id)
          .single();
        
        if (!methodError) {
          setPaymentMethod(methodData);
        }
      }
    } catch (err) {
      console.error('Error fetching payment request details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setProcessingAction(true);
      
      // Update the payment request status
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
      
      // Refresh the payment request details
      fetchPaymentRequestDetails();
    } catch (err) {
      console.error('Error updating payment request:', err);
      alert(`Failed to update payment request: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !paymentRequest) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push('/admin/payments')}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Payment Requests
          </button>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading payment request</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || "Payment request not found"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/admin/payments')}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Payment Requests
        </button>
        
        {/* Header with main info */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Request</h1>
                <p className="text-gray-500 text-sm">ID: {paymentRequest.id}</p>
              </div>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                paymentRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                paymentRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                paymentRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                paymentRequest.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {paymentRequest.status.charAt(0).toUpperCase() + paymentRequest.status.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Amount</h2>
                <p className="text-2xl font-bold text-indigo-600">₦{Number(paymentRequest.amount).toLocaleString()}</p>
                
                {paymentRequest.note && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700">Note</h3>
                    <p className="text-gray-600 mt-1">{paymentRequest.note}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Status Timeline</h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Created: {new Date(paymentRequest.created_at).toLocaleDateString()} at {new Date(paymentRequest.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  
                  {paymentRequest.updated_at && paymentRequest.updated_at !== paymentRequest.created_at && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Updated: {new Date(paymentRequest.updated_at).toLocaleDateString()} at {new Date(paymentRequest.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                  
                  {paymentRequest.processed_at && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Processed: {new Date(paymentRequest.processed_at).toLocaleDateString()} at {new Date(paymentRequest.processed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            {paymentRequest.status === 'pending' && (
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={processingAction}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {processingAction ? 'Processing...' : 'Approve Request'}
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={processingAction}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {processingAction ? 'Processing...' : 'Reject Request'}
                </button>
              </div>
            )}
            
            {paymentRequest.status === 'approved' && (
              <div className="mt-6">
                <button
                  onClick={() => handleStatusChange('paid')}
                  disabled={processingAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {processingAction ? 'Processing...' : 'Mark as Paid'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">User Information</h2>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-4">
                  {user.first_name?.charAt(0) || ''}
                  {user.last_name?.charAt(0) || ''}
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900">{user.first_name} {user.last_name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="border-t border-gray-200 pt-2">
                  <p className="text-gray-500">User ID</p>
                  <p className="font-medium text-gray-900">{user.id}</p>
                </div>
                {user.phone && (
                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{user.phone}</p>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <p className="text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Method Info */}
        {paymentMethod && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="border-t border-gray-200 pt-2">
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">{paymentMethod.type || 'Bank Transfer'}</p>
                </div>
                {paymentMethod.bank_name && (
                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-gray-500">Bank</p>
                    <p className="font-medium text-gray-900">{paymentMethod.bank_name}</p>
                  </div>
                )}
                {paymentMethod.account_number && (
                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-gray-500">Account Number</p>
                    <p className="font-medium text-gray-900">{paymentMethod.account_number}</p>
                  </div>
                )}
                {paymentMethod.account_name && (
                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-gray-500">Account Name</p>
                    <p className="font-medium text-gray-900">{paymentMethod.account_name}</p>
                  </div>
                )}
              </div>
              
              {/* If there are payment method details saved as JSON */}
              {paymentRequest.payment_method_details && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Additional Details</h3>
                  <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto">
                    {JSON.stringify(paymentRequest.payment_method_details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentRequestDetailPage({ params }) {
  return (
    <AdminProtectedRoute>
      <PaymentRequestDetailContent params={params} />
    </AdminProtectedRoute>
  );
} 