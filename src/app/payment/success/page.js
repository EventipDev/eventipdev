'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Add this function before the component
function getPaystackReceiptUrl(reference) {
  return `https://dashboard.paystack.com/#/transactions/${reference}/receipt`;
}

// Create a client component that uses the search params
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reference, setReference] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    // Get reference from URL params
    const ref = searchParams.get('reference');
    
    if (!ref) {
      console.error('No payment reference provided');
      return;
    }
    
    setReference(ref);
    setIsVerifying(true);
    
    // Verify the payment with our backend
    const verifyPayment = async () => {
      try {
        console.log('Starting payment verification for reference:', ref);
        
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reference: ref }),
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Payment verification result:', data);
        
        if (data.success) {
          setVerificationStatus('success');
          setTransactionId(data.data?.transaction_id || 'N/A');
          
          // Store the verification result in localStorage
          try {
            localStorage.setItem('paymentVerification', JSON.stringify({
              reference: ref,
              status: 'success',
              transactionId: data.data?.transaction_id
            }));
          } catch (err) {
            console.warn('Failed to store verification result:', err);
          }
          
          // Auto-redirect to ticket page after 3 seconds
          const timer = setTimeout(() => {
            router.push(`/tickets/${ref}`);
          }, 3000);
          
          return () => clearTimeout(timer);
        } else {
          setVerificationStatus('failed');
          console.error('Payment verification failed:', data.message);
          // Show error message to user
          alert(`Payment verification failed: ${data.message || 'Unknown error occurred'}`);
        }
      } catch (error) {
        setVerificationStatus('error');
        console.error('Error verifying payment:', error);
        // Show error message to user
        alert(`An error occurred while verifying payment: ${error.message}`);
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your ticket has been confirmed.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Reference:</span>
            <span className="font-medium">{reference || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-medium">{transactionId || 'Processing...'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Status:</span>
            <span className="inline-flex items-center text-green-700">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Confirmed
            </span>
          </div>
        </div>
        
        <div className="text-center">
          {isVerifying ? (
            <div className="flex items-center justify-center mb-4">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Verifying payment...</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to your ticket in a moment... If you are not redirected automatically, please click the button below.
            </p>
          )}
          
          <Link 
            href={`/tickets/${reference}`}
            className={`inline-block w-full px-6 py-3 ${verificationStatus === 'failed' ? 'bg-gray-400' : 'bg-[#0077B6] hover:bg-[#03045E]'} text-white font-medium rounded-md transition-colors mb-3`}
          >
            View My Ticket
          </Link>
          
          {reference && (
            <a 
              href={getPaystackReceiptUrl(reference)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors mb-3"
            >
              View Paystack Receipt
            </a>
          )}
          
          <Link 
            href="/"
            className="inline-block text-[#0077B6] hover:underline text-sm"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Create a fallback UI for the Suspense boundary
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="animate-pulse">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
          
          <div className="h-20 bg-gray-100 rounded mb-6"></div>
          
          <div className="h-12 bg-gray-200 rounded mb-3"></div>
          <div className="h-12 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function PaymentSuccess() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 