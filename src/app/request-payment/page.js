'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';

function RequestPaymentContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethodId: '',
    note: ''
  });
  const [userBalance, setUserBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [minimumWithdrawalAmount, setMinimumWithdrawalAmount] = useState(5000.00); // ₦5000 minimum

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
  }, []);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setLoading(true);
      try {
        const userId = user?.id || userData?.id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setPaymentMethods(data);
          // If there's a default payment method, select it
          const defaultMethod = data.find(method => method.is_default);
          if (defaultMethod) {
            setFormData(prev => ({ ...prev, paymentMethodId: defaultMethod.id }));
          } else {
            setFormData(prev => ({ ...prev, paymentMethodId: data[0].id }));
          }
        } else {
          setError('You need to add a payment method before requesting a payment.');
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setError('Failed to load payment methods. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id || userData?.id) {
      fetchPaymentMethods();
    } else {
      setLoading(false);
    }
  }, [user, userData]);

  // Add this useEffect to fetch the user's balance
  useEffect(() => {
    const fetchUserBalance = async () => {
      setIsBalanceLoading(true);
      let balance = 0;
      
      try {
        const userId = user?.id || userData?.id;
        if (!userId) {
          setIsBalanceLoading(false);
          return;
        }

        // Fetch events created by the current user to calculate revenue
        try {
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select(`
              id,
              name,
              event_date,
              ticket_tiers (
                id,
                price,
                quantity,
                quantity_sold,
                paid_quantity_sold
              )
            `)
            .eq('user_id', userId);
            
          if (!eventsError && eventsData) {
            // Calculate revenue from ticket tiers
            let ticketRevenue = 0;
            
            // Get event IDs for fetching paid tickets data
            const eventIds = eventsData.map(event => event.id);
            
            // Fetch paid tickets for more accurate revenue calculation
            const { data: paidTicketsData, error: paidTicketsError } = await supabase
              .from('paid_tickets')
              .select('*')
              .in('event_id', eventIds);
              
            if (paidTicketsError) {
              console.error('Error fetching paid tickets data:', paidTicketsError);
            }
            
            eventsData.forEach(event => {
              if (event.ticket_tiers && event.ticket_tiers.length > 0) {
                event.ticket_tiers.forEach(tier => {
                  const price = parseFloat(tier.price) || 0;
                  
                  if (price > 0) { // Only count paid tickets
                    // Use paid_quantity_sold when available
                    if (tier.paid_quantity_sold !== undefined && tier.paid_quantity_sold !== null) {
                      const paidTicketCount = Number(tier.paid_quantity_sold) || 0;
                      
                      // Get all paid_tickets for this tier to calculate actual revenue
                      const tierPaidTickets = paidTicketsData?.filter(ticket => 
                        ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                      ) || [];
                      
                      // Sum up the price_paid values from actual tickets (these already have 10% fee deducted)
                      const tierRevenue = tierPaidTickets.reduce((sum, ticket) => 
                        sum + (parseFloat(ticket.price_paid) || 0), 0
                      );
                      
                      // If we have actual paid tickets data, use that revenue, otherwise fallback to calculation
                      ticketRevenue += tierPaidTickets.length > 0 ? tierRevenue : (price * paidTicketCount);
                    }
                  }
                });
              }
            });
            
            // Add ticket revenue to balance
            balance += ticketRevenue;
            console.log('Regular events ticket revenue calculated:', ticketRevenue);
          }
          
          // ADDITION: Also fetch private events for the user
          const { data: privateEvents, error: privateEventsError } = await supabase
            .from('private_events')
            .select('id, event_name, event_start_date, price, quantity, quantity_sold, is_paid, cover_image_url')
            .eq('user_id', userId);
            
          if (privateEventsError) {
            console.error('Error fetching private events:', privateEventsError);
          } else if (privateEvents && privateEvents.length > 0) {
            console.log(`Fetched ${privateEvents.length} private events for balance calculation`);
            
            // Fetch private event tickets for accurate revenue calculation
            const privateEventIds = privateEvents.map(event => event.id);
            let privateEventTickets = [];
            
            const { data: privateTickets, error: privateTicketsError } = await supabase
              .from('private_event_tickets')
              .select('*')
              .in('event_id', privateEventIds);
              
            if (privateTicketsError) {
              console.error('Error fetching private event tickets:', privateTicketsError);
            } else {
              privateEventTickets = privateTickets || [];
              console.log(`Fetched ${privateEventTickets.length} private event tickets for balance calculation`);
            }
            
            // Calculate revenue from private events
            let privateEventsRevenue = 0;
            
            privateEvents.forEach(privateEvent => {
              if (privateEvent.is_paid) {
                // Get tickets for this private event
                const eventTickets = privateEventTickets.filter(ticket => 
                  ticket.event_id === privateEvent.id && ticket.is_paid
                );
                
                if (eventTickets.length > 0) {
                  // Sum up the price_paid values from paid tickets
                  eventTickets.forEach(ticket => {
                    const ticketPrice = parseFloat(ticket.price_paid) || 0;
                    const quantity = parseInt(ticket.quantity) || 1;
                    privateEventsRevenue += ticketPrice * quantity;
                  });
                } else if (privateEvent.quantity_sold > 0) {
                  // Fallback if no tickets found but event shows sales
                  const eventPrice = parseFloat(privateEvent.price) || 0;
                  const soldCount = parseInt(privateEvent.quantity_sold) || 0;
                  privateEventsRevenue += eventPrice * soldCount; // Full price to organizer (no 10% deduction)
                }
              }
            });
            
            // Add private events revenue to balance
            balance += privateEventsRevenue;
            console.log('Private events revenue calculated:', privateEventsRevenue);
          }
        } catch (eventsError) {
          console.error('Error fetching events for revenue:', eventsError);
        }

        // Initialize default balance and handle errors gracefully
        try {
          // Fetch transactions to calculate balance
          const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId);
            
          if (error) {
            console.log('Error fetching transactions:', error.message);
          } else if (transactions && transactions.length > 0) {
            // Calculate balance from transactions
            transactions.forEach(tx => {
              try {
                // Parse amount whether it uses $ or ₦ symbol
                const amount = parseFloat((tx.amount?.replace('$', '').replace('₦', '') || '0').replace(/,/g, ''));
                
                if (tx.status?.toLowerCase() === 'completed' && tx.type === 'credit') {
                  balance += amount;
                } else if (tx.status?.toLowerCase() === 'completed' && tx.type === 'debit') {
                  balance -= amount;
                }
              } catch (parseError) {
                console.log('Error parsing transaction amount:', parseError.message);
                // Continue with other transactions
              }
            });
          }
        } catch (txError) {
          console.log('Transaction calculation error:', txError.message || 'Unknown error');
          // Continue with balance as is
        }
        
        // Try to check pending requests
        try {
          // Fetch all payment requests
          const { data: allPaymentRequests, error: requestsError } = await supabase
            .from('payment_requests')
            .select('amount, status')
            .eq('user_id', userId);
            
          if (requestsError) {
            console.log('Error fetching payment requests:', requestsError.message);
          } else if (allPaymentRequests && allPaymentRequests.length > 0) {
            // Separate active/paid and pending requests
            const activeOrPaidRequests = allPaymentRequests.filter(
              req => req.status === 'active' || req.status === 'paid'
            );
            
            const pendingRequests = allPaymentRequests.filter(
              req => req.status === 'pending'
            );
            
            // Calculate total for active/paid requests
            if (activeOrPaidRequests.length > 0) {
              const activeTotal = activeOrPaidRequests.reduce((sum, request) => {
                try {
                  return sum + parseFloat((request.amount || '0').toString().replace('$', '').replace('₦', '').replace(/,/g, ''));
                } catch (parseError) {
                  console.log('Error parsing request amount:', parseError.message);
                  return sum;
                }
              }, 0);
              
              balance -= activeTotal;
              console.log('Subtracting active/paid payment requests:', activeTotal);
            }
            
            // Calculate pending total
            if (pendingRequests.length > 0) {
              const pendingTotal = pendingRequests.reduce((sum, request) => {
                try {
                  return sum + parseFloat((request.amount || '0').toString().replace('$', '').replace('₦', '').replace(/,/g, ''));
                } catch (parseError) {
                  console.log('Error parsing request amount:', parseError.message);
                  return sum;
                }
              }, 0);
              
              balance -= pendingTotal;
              console.log('Subtracting pending payment requests:', pendingTotal);
            }
          }
        } catch (requestError) {
          console.log('Payment requests calculation error:', requestError.message || 'Unknown error');
          // Continue with balance as is
        }
        
        // Log balance information for debugging
        console.log('Total user balance calculated:', balance);
        
        // Set balance in state (prevent negative balance)
        setUserBalance(Math.max(0, balance));
      } catch (err) {
        // Main error handling
        console.error('Error fetching user balance:', err?.message || 'Unknown error in balance calculation');
        // Set a fallback balance of 0
        setUserBalance(0);
      } finally {
        setIsBalanceLoading(false);
      }
    };
    
    if (user?.id || userData?.id) {
      fetchUserBalance();
    } else {
      setIsBalanceLoading(false);
    }
  }, [user, userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate the amount (must be a positive number)
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      setSubmitting(false);
      return;
    }

    // Check if user has sufficient balance
    if (amount > userBalance) {
      setError(`Insufficient balance. Your available balance is ₦${userBalance.toLocaleString()}.`);
      setSubmitting(false);
      return;
    }

    // Check minimum withdrawal amount
    if (amount < minimumWithdrawalAmount) {
      setError(`Minimum withdrawal amount is ₦${minimumWithdrawalAmount.toLocaleString()}.`);
      setSubmitting(false);
      return;
    }

    // Validate that a payment method was selected
    if (!formData.paymentMethodId) {
      setError('Please select a payment method.');
      setSubmitting(false);
      return;
    }

    try {
      const userId = user?.id || userData?.id;
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Get the selected payment method details
      const selectedMethod = paymentMethods.find(method => method.id === formData.paymentMethodId);
      if (!selectedMethod) {
        throw new Error('Selected payment method not found.');
      }

      // Create a payment request record
      const { data, error } = await supabase
        .from('payment_requests')
        .insert([
          {
            user_id: userId,
            amount: amount,
            payment_method_id: formData.paymentMethodId,
            status: 'pending',
            note: formData.note,
            payment_method_details: {
              bank_name: selectedMethod.bank_name,
              account_type: selectedMethod.account_type,
              account_number_last4: selectedMethod.account_number.slice(-4),
              account_name: selectedMethod.account_name
            },
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/payment');
      }, 2000);
    } catch (err) {
      console.error('Error submitting payment request:', err);
      setError(err.message || 'Failed to submit payment request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (e) => {
    let value = e.target.value;
    
    // Remove all non-digit characters except decimal point
    value = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // For display purposes, you could add commas for thousands
    setFormData(prev => ({ ...prev, amount: value }));
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading payment methods...</p>
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
                <h1 className="text-2xl font-semibold text-slate-800">Request Payment</h1>
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
            {/* Show error message if there's an error */}
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Show success message if the request was successful */}
            {success && (
              <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-200">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Payment request submitted successfully! Redirecting...
                </div>
              </div>
            )}

            {/* Add the balance display section in the form, after the header and before the form */}
            {loading || isBalanceLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Available Balance</h3>
                      <p className={`text-2xl font-bold ${userBalance === 0 ? 'text-red-500' : 'text-green-600'}`}>
                        ₦{userBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {userBalance === 0 && (
                    <div className="mt-3 bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium">You currently have no available balance to request a payment.</p>
                          <p className="mt-1">Create events and sell tickets to generate revenue for withdrawal.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {userBalance > 0 && userBalance < minimumWithdrawalAmount && (
                    <div className="mt-3 bg-yellow-50 text-yellow-700 p-3 rounded-md text-sm border border-yellow-100">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium">Balance below minimum withdrawal amount.</p>
                          <p className="mt-1">Minimum withdrawal amount is ₦{minimumWithdrawalAmount.toLocaleString()}. You need ₦{(minimumWithdrawalAmount - userBalance).toLocaleString()} more to request a payment.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {userBalance >= minimumWithdrawalAmount && (
                    <div className="mt-3 bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-100">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium">Your balance is available for withdrawal!</p>
                          <p className="mt-1">You can request up to ₦{userBalance.toLocaleString()} to be transferred to your account.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Request Payment Form */}
            {paymentMethods.length > 0 ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount (₦)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">₦</span>
                    </div>
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      onChange={formatAmount}
                      required
                      placeholder="0.00"
                      className="mt-1 block w-full pl-7 px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Select Payment Method
                  </label>
                  <div className="space-y-3 mt-1">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="relative">
                        <input
                          type="radio"
                          id={method.id}
                          name="paymentMethodId"
                          value={method.id}
                          checked={formData.paymentMethodId === method.id}
                          onChange={handleChange}
                          className="absolute w-4 h-4 left-4 top-1/2 transform -translate-y-1/2 text-indigo-600"
                        />
                        <label
                          htmlFor={method.id}
                          className={`block w-full pl-12 pr-4 py-3 border ${formData.paymentMethodId === method.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'} rounded-md cursor-pointer hover:bg-slate-50 transition-colors`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900">{method.bank_name}</p>
                                {method.is_default && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500">
                                {method.account_type.charAt(0).toUpperCase() + method.account_type.slice(1)} •••• 
                                {method.account_number.slice(-4)}
                              </p>
                              <p className="text-sm text-slate-500">{method.account_name}</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Note (Optional)
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Add a note about this payment request"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/payment')}
                    className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || userBalance === 0 || userBalance < minimumWithdrawalAmount}
                    className={`px-4 py-2 ${userBalance >= minimumWithdrawalAmount ? 'bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600' : 'bg-slate-400'} text-white rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all duration-300`}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </div>
                    ) : userBalance === 0 ? (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        No Balance Available
                      </div>
                    ) : userBalance < minimumWithdrawalAmount ? (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                        </svg>
                        Balance Below Minimum (₦{minimumWithdrawalAmount.toLocaleString()})
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Submit Payment Request
                      </div>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="mt-2 text-slate-500 mb-6">You need to add a payment method before requesting a payment</p>
                <button 
                  onClick={() => router.push('/add-payment')}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md text-sm font-medium"
                >
                  Add Payment Method
                </button>
              </div>
            )}
          </div>

          {/* Information Notice */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0 text-blue-400">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Payment Request Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Please note the following regarding your payment request:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Requests are typically processed within 72 hours</li>
                    <li>You will receive an email confirmation once the payment is approved</li>
                    <li>You can track the status of your request in your payment history</li>
                    <li>Minimum payment request amount is ₦{minimumWithdrawalAmount.toLocaleString()}</li>
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

export default function RequestPayment() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <RequestPaymentContent />
        </main>
      </div>
    </ProtectedRoute>
  );
} 