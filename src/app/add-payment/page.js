'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';

function AddPaymentContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountCurrencyType, setAccountCurrencyType] = useState('dollar');
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
    accountType: 'checking',
    isDefault: false
  });

  // Fetch user data from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    // Simulate loading
    setTimeout(() => {
      setPageLoading(false);
    }, 1000);
  }, []);

  // Update accountType options when currency type changes
  useEffect(() => {
    if (accountCurrencyType === 'non-dollar' && 
        (formData.accountType === 'checking' || formData.accountType === 'savings')) {
      setFormData(prev => ({
        ...prev,
        accountType: 'savings'
      }));
    }
  }, [accountCurrencyType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get user ID from userData or user object
      const userId = userData?.id || user?.id;
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Prepare data based on account currency type
      const paymentData = {
        user_id: userId,
        account_name: formData.accountName,
        account_number: formData.accountNumber,
        bank_name: formData.bankName,
        account_type: formData.accountType,
        is_default: formData.isDefault,
        routing_number: accountCurrencyType === 'dollar' ? formData.routingNumber : ''
      };

      const { data, error } = await supabase
        .from('payment_methods')
        .insert([paymentData])
        .select();

      if (error) throw error;
      
      console.log('Payment method created:', data);

      setSuccess(true);
      setTimeout(() => {
        router.push('/payment');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (pageLoading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/payment" className="text-slate-500 hover:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <div>
                <div className="text-sm text-slate-500">Payments</div>
                <h1 className="text-2xl font-semibold text-slate-800">Add Payment Method</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-medium">
                  {(userData?.first_name?.[0] || userData?.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-medium text-slate-700">
                    {userData?.first_name} {userData?.last_name}
                  </div>
                  <div className="text-xs text-slate-500">{userData?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-200">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Payment method added successfully! Redirecting...
                  </div>
                </div>
              )}

              {/* Account Currency Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Account Currency Type
                </label>
                <div className="flex space-x-6 bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="dollar"
                      name="accountCurrencyType"
                      value="dollar"
                      checked={accountCurrencyType === 'dollar'}
                      onChange={(e) => setAccountCurrencyType(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                    <label htmlFor="dollar" className="ml-2 block text-sm text-slate-700">
                      Dollar Account
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="non-dollar"
                      name="accountCurrencyType"
                      value="non-dollar"
                      checked={accountCurrencyType === 'non-dollar'}
                      onChange={(e) => setAccountCurrencyType(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                    <label htmlFor="non-dollar" className="ml-2 block text-sm text-slate-700">
                      Non-Dollar Account
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Only show routing number for dollar accounts */}
              {accountCurrencyType === 'dollar' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    name="routingNumber"
                    value={formData.routingNumber}
                    onChange={handleChange}
                    required={accountCurrencyType === 'dollar'}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Type
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {/* Different account type options based on currency type */}
                  {accountCurrencyType === 'dollar' ? (
                    <>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </>
                  ) : (
                    <>
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <label className="ml-2 block text-sm text-slate-700">
                  Set as default payment method
                </label>
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/payment')}
                  className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-md shadow-sm text-sm font-medium hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </div>
                  ) : 'Add Payment Method'}
                </button>
              </div>
            </form>
          </div>

          {/* Payment Processing Notice */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0 text-blue-400">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Payment Processing Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Please note the following regarding payments:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Payments typically take 72 hours to process</li>
                    <li>You will receive a confirmation email once the payment is initiated</li>
                    <li>You can track the payment status in your payment history</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddPayment() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <AddPaymentContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}