'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';

const formatCurrency = (amount) => {
  if (!amount) return '₦0';
  
  // Remove any existing currency symbols and commas
  const cleanAmount = amount.toString().replace(/[₦$,]/g, '');
  
  // Parse the amount and format with commas
  const numericAmount = parseFloat(cleanAmount);
  if (isNaN(numericAmount)) return '₦0';
  
  return `₦${numericAmount.toLocaleString()}`;
};

function PaymentContent({ sidebarRef }) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: '₦0',
    pendingPayments: '₦0',
    pendingPaymentsCount: 0,
    successfulPayments: 0,
    paidTransactions: 0,
    freeTransactions: 0,
    rejectedAmount: '₦0',
    rejectedCount: 0,
    hasWithdrawals: false,
    withdrawalAmount: '₦0',
    paidTickets: 0,
    freeTickets: 0,
    totalTickets: 0
  });
  const [error, setError] = useState(null);

  // Fetch user data from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        
        // If we have user data from localStorage, trigger data fetch
        if (parsedUser?.id) {
          fetchPaymentData(parsedUser.id);
        }
        
        // Safety timeout to prevent infinite loading
        const immediateTimer = setTimeout(() => {
          if (loading) { // If still loading after this timeout
            console.log('Forcing loading state to end after timeout');
            setLoading(false);
          }
        }, 3000);
        
        return () => clearTimeout(immediateTimer);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      // No user data in localStorage, set loading to false
      setTimeout(() => setLoading(false), 1000);
    }
  }, []); // Empty dependency array since this should only run once on mount

  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const targetUserId = user?.id || userData?.id;
      
      if (!targetUserId) {
        console.log('No user ID available for fetching payment data');
        setLoading(false);
        return;
      }

      console.log('Fetching payment data for user ID:', targetUserId);

      // First, fetch revenue data and ticket counts from events
      let totalRevenue = 0;
      let paidTickets = 0;
      let freeTickets = 0;
      let pendingAmount = 0;
      let successfulCount = 0; // Reset to zero
      let paidTransactionsCount = 0;
      let freeTransactionsCount = 0;
      let rejectedAmount = 0;
      let rejectedCount = 0;
      let refundedAmount = 0;
      let pendingCount = 0;
      
      // Track which events have successful ticket sales to avoid double counting
      const eventsWithSuccessfulSales = new Set();

      try {
        // Fetch regular events data
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
          .eq('user_id', targetUserId);
          
        if (!eventsError && eventsData) {
          // Fetch paid tickets data for more accurate revenue calculations
          const eventIds = eventsData.map(event => event.id);
          const { data: paidTicketsData, error: paidTicketsError } = await supabase
            .from('paid_tickets')
            .select('*')
            .in('event_id', eventIds);
            
          if (paidTicketsError) {
            console.error('Error fetching paid tickets data:', paidTicketsError);
          }
            
          // Calculate revenue and ticket counts from ticket sales
          eventsData.forEach(event => {
            let eventHasPaidTickets = false;
            
            if (event.ticket_tiers && event.ticket_tiers.length > 0) {
              event.ticket_tiers.forEach(tier => {
                const price = parseFloat(tier.price) || 0;
                
                if (price > 0) {
                  // Paid tickets
                  if (tier.paid_quantity_sold !== undefined && tier.paid_quantity_sold !== null) {
                    const paidTicketCount = Number(tier.paid_quantity_sold) || 0;
                    paidTickets += paidTicketCount;
                    
                    // Get all paid_tickets for this tier to calculate actual revenue
                    const tierPaidTickets = paidTicketsData?.filter(ticket => 
                      ticket.event_id === event.id && ticket.ticket_tier_id === tier.id
                    ) || [];
                    
                    // Sum up the price_paid values from actual tickets
                    const tierRevenue = tierPaidTickets.reduce((sum, ticket) => 
                      sum + (parseFloat(ticket.price_paid) || 0), 0
                    );
                    
                    // If we have actual paid tickets data, use that revenue, otherwise fallback to calculation
                    totalRevenue += tierPaidTickets.length > 0 ? tierRevenue : (price * paidTicketCount);
                    
                    // Count these as paid transactions
                    paidTransactionsCount += paidTicketCount;
                    
                    // Mark this event as having paid tickets
                    if (paidTicketCount > 0) {
                      eventHasPaidTickets = true;
                    }
                  }
                } else {
                  // Free tickets - use quantity_sold
                  const freeTicketCount = Number(tier.quantity_sold) || 0;
                  freeTickets += freeTicketCount;
                  
                  // Count these as free transactions
                  freeTransactionsCount += freeTicketCount;
                  // Do not count free tickets as successful payments
                }
              });
              
              // Only increment successful count once per event with paid tickets
              if (eventHasPaidTickets && !eventsWithSuccessfulSales.has(event.id)) {
                successfulCount++;
                eventsWithSuccessfulSales.add(event.id);
              }
            }
          });
          
          console.log('Ticket counts from ticket tiers:', {
            paidTickets,
            freeTickets,
            paidTransactionsCount,
            freeTransactionsCount,
            totalRevenue,
            successfulCount,
            eventsWithPaidTickets: Array.from(eventsWithSuccessfulSales)
          });
        }
        
        // ADDITION: Fetch private events data
        const { data: privateEvents, error: privateEventsError } = await supabase
          .from('private_events')
          .select('id, event_name, event_start_date, price, quantity, quantity_sold, is_paid, cover_image_url')
          .eq('user_id', targetUserId);
          
        if (privateEventsError) {
          console.error('Error fetching private events:', privateEventsError);
        } else if (privateEvents && privateEvents.length > 0) {
          console.log(`Fetched ${privateEvents.length} private events`);
          
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
            console.log(`Fetched ${privateEventTickets.length} private event tickets`);
          }
          
          // Calculate revenue from private events
          let privateEventsRevenue = 0;
          let privatePaidTickets = 0;
          let privateFreeTickets = 0;
          let privatePaidTransactions = 0;
          let privateFreeTransactions = 0;
          
          privateEvents.forEach(privateEvent => {
            let eventHasPaidTickets = false;
            
            // Get tickets for this private event
            const eventTickets = privateEventTickets.filter(ticket => 
              ticket.event_id === privateEvent.id
            );
            
            if (privateEvent.is_paid) {
              // Process paid private event tickets
              const paidEventTickets = eventTickets.filter(ticket => ticket.is_paid);
              
              if (paidEventTickets.length > 0) {
                // Sum up the price_paid values from paid tickets
                paidEventTickets.forEach(ticket => {
                  const ticketPrice = parseFloat(ticket.price_paid) || 0;
                  const quantity = parseInt(ticket.quantity) || 1;
                  privateEventsRevenue += ticketPrice * quantity;
                  privatePaidTickets += quantity;
                  privatePaidTransactions += 1; // Count each ticket as one transaction
                  eventHasPaidTickets = true;
                });
              } else if (privateEvent.quantity_sold > 0) {
                // Fallback if no tickets found but event shows sales
                const eventPrice = parseFloat(privateEvent.price) || 0;
                const soldCount = parseInt(privateEvent.quantity_sold) || 0;
                privateEventsRevenue += eventPrice * soldCount; // Full price to organizer (no 10% deduction)
                privatePaidTickets += soldCount;
                privatePaidTransactions += soldCount;
                eventHasPaidTickets = soldCount > 0;
              }
            } else {
              // Process free private event tickets
              const freeTicketCount = eventTickets.length || parseInt(privateEvent.quantity_sold) || 0;
              privateFreeTickets += freeTicketCount;
              privateFreeTransactions += freeTicketCount;
            }
            
            // Count successful events
            if (eventHasPaidTickets && !eventsWithSuccessfulSales.has(privateEvent.id)) {
              successfulCount++;
              eventsWithSuccessfulSales.add(privateEvent.id);
            }
          });
          
          // Add private event stats to totals
          totalRevenue += privateEventsRevenue;
          paidTickets += privatePaidTickets;
          freeTickets += privateFreeTickets;
          paidTransactionsCount += privatePaidTransactions;
          freeTransactionsCount += privateFreeTransactions;
          
          console.log('Private events stats:', {
            privateEventsRevenue,
            privatePaidTickets,
            privateFreeTickets,
            privatePaidTransactions,
            privateFreeTransactions
          });
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      }

      // Fetch payment methods and transactions
      let paymentMethodsData = [];
      let transactionsData = [];
      let paymentRequestsData = [];

      // Fetch payment methods
      const { data: methodsData, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', targetUserId);
        
      if (!methodsError) {
        paymentMethodsData = methodsData;
      }

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', targetUserId);
        
      if (!txError && txData) {
        transactionsData = txData;
        
        // Process transactions for stats
        txData.forEach(tx => {
          try {
            // Replace $ with ₦ if it exists, then parse the numeric value
            const amount = parseFloat((tx.amount?.replace('$', '').replace('₦', '') || '0').replace(/,/g, ''));
            
            // Tag the transaction with its payment type
            tx.isPaid = amount > 0;
            tx.isFree = amount === 0;
            
            // Use numeric amount for calculations
            tx.numericAmount = amount;
            
            // Format the amount consistently
            tx.formattedAmount = `₦${amount.toLocaleString()}`;
            
            // Count based on status - only count as successful if completed, paid, or approved
            const statusLower = tx.status?.toLowerCase() || '';
            if (statusLower === 'completed' || statusLower === 'paid' || statusLower === 'approved') {
              totalRevenue += amount;
              
              // Only count as successful if it's a paid transaction
              if (tx.isPaid) {
                successfulCount++;
                paidTransactionsCount++;
              } else {
                freeTransactionsCount++;
              }
            } else if (statusLower === 'pending') {
              pendingAmount += amount;
              pendingCount++;
              // Do not count pending transactions as successful
            } else if (statusLower === 'refunded' || statusLower === 'rejected') {
              rejectedAmount += amount;
              rejectedCount++;
            }
          } catch (err) {
            console.error('Error processing transaction:', err);
          }
        });
      }

      // Fetch payment requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select(`
          *,
          payment_methods(*)
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });
        
      if (!requestsError) {
        paymentRequestsData = requestsData;
      }

      // Format and combine transactions
      let allTransactions = [...transactionsData];
      if (paymentRequestsData.length > 0) {
        const formattedRequests = paymentRequestsData.map(request => ({
          id: request.id,
          eventName: 'Payment Request',
          amount: formatCurrency(request.amount),
          status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
          date: new Date(request.created_at).toLocaleDateString(),
          paymentMethod: request.payment_methods?.bank_name || 'Bank Account',
          customer: 'Self',
          email: userData?.email || user?.email,
          note: request.note,
          type: 'request',
          created_at: request.created_at
        }));
        
        allTransactions = [...formattedRequests, ...allTransactions];
      }

      // Apply filters and format transactions
      const filteredTransactions = applyFilters(allTransactions);
      const formattedTransactions = filteredTransactions.map(transaction => ({
        ...transaction,
        amount: formatCurrency(transaction.amount),
        date: new Date(transaction.created_at).toLocaleDateString(),
        status: transaction.status || 'pending'
      }));

      // Calculate payment stats based on transactions
      let adjustedRevenue = totalRevenue;
      let paymentRequestAdjustment = 0;
      let shouldAdjustRevenue = false;
      let activeOrPaidRequestsCount = 0;
      let pendingRequestsCount = 0;
      let rejectedRequestsCount = 0;
      
      // Parse the payment requests to find active/paid requests
      if (paymentRequestsData && paymentRequestsData.length > 0) {
        const activeOrPaidRequests = paymentRequestsData.filter(
          req => req.status?.toLowerCase() === 'active' || req.status?.toLowerCase() === 'paid'
        );
        
        const pendingRequests = paymentRequestsData.filter(
          req => req.status?.toLowerCase() === 'pending'
        );
        
        const rejectedRequests = paymentRequestsData.filter(
          req => req.status?.toLowerCase() === 'rejected'
        );
        
        activeOrPaidRequestsCount = activeOrPaidRequests.length;
        pendingRequestsCount = pendingRequests.length;
        rejectedRequestsCount = rejectedRequests.length;
        
        // Add to pending stats
        if (pendingRequests.length > 0) {
          const pendingRequestsAmount = pendingRequests.reduce(
            (sum, req) => {
              const reqAmount = parseFloat((req.amount || '0').toString().replace('$', '').replace('₦', '').replace(/,/g, ''));
              return sum + reqAmount;
            }, 0
          );
          pendingAmount += pendingRequestsAmount;
        }
        
        // Add to rejected stats
        if (rejectedRequests.length > 0) {
          const rejectedRequestsAmount = rejectedRequests.reduce(
            (sum, req) => {
              const reqAmount = parseFloat((req.amount || '0').toString().replace('$', '').replace('₦', '').replace(/,/g, ''));
              return sum + reqAmount;
            }, 0
          );
          rejectedAmount += rejectedRequestsAmount;
        }
        
        if (activeOrPaidRequests.length > 0) {
          // Calculate amount to subtract from revenue
          paymentRequestAdjustment = activeOrPaidRequests.reduce(
            (sum, req) => {
              const reqAmount = parseFloat((req.amount || '0').toString().replace('$', '').replace('₦', '').replace(/,/g, ''));
              return sum + reqAmount;
            }, 0
          );
          
          console.log('Payment request adjustment:', paymentRequestAdjustment);
          
          // Apply adjustment to revenue
          adjustedRevenue = totalRevenue - paymentRequestAdjustment;
          shouldAdjustRevenue = true;
          
          // Count successful payments only for paid/active requests, NOT pending ones
          successfulCount += activeOrPaidRequests.length; 
        }
      }
      
      // Set payment stats after all calculations
      setPaymentStats({
        totalRevenue: shouldAdjustRevenue 
          ? `₦${adjustedRevenue.toLocaleString()}` 
          : `₦${totalRevenue.toLocaleString()}`,
        pendingPayments: `₦${pendingAmount.toLocaleString()}`,
        pendingPaymentsCount: pendingRequestsCount,
        successfulPayments: successfulCount,
        paidTransactions: paidTransactionsCount,
        freeTransactions: freeTransactionsCount,
        rejectedAmount: `₦${rejectedAmount.toLocaleString()}`,
        rejectedCount: rejectedRequestsCount,
        hasWithdrawals: shouldAdjustRevenue,
        withdrawalAmount: shouldAdjustRevenue ? `₦${paymentRequestAdjustment.toLocaleString()}` : '₦0',
        // Add total ticket counts to payment stats
        paidTickets: paidTickets,
        freeTickets: freeTickets,
        totalTickets: paidTickets + freeTickets
      });
      
      // Add final stats log to help with debugging
      console.log('Final payment stats:', {
        totalRevenue: shouldAdjustRevenue ? adjustedRevenue : totalRevenue,
        pendingAmount,
        pendingRequestsCount,
        successfulCount,
        paidTransactionsCount,
        freeTransactionsCount,
        rejectedAmount,
        rejectedRequestsCount,
        hasWithdrawals: shouldAdjustRevenue,
        withdrawalAmount: paymentRequestAdjustment
      });

      // Set states
      setPaymentMethods(paymentMethodsData);
      setTransactions(formattedTransactions);

    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError('Failed to load payment data');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [user, userData, selectedStatus, dateRange]);

  // Function to apply filters to transactions
  const applyFilters = useCallback((transactions) => {
    if (!transactions) return [];
    
    // First filter by status
    let filtered = transactions;
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(
        t => t.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    
    // Then filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(t => {
          // Try to parse the date from either a created_at field or from date string
          const transactionDate = t.created_at 
            ? new Date(t.created_at) 
            : new Date(t.date);
          
          return transactionDate >= startDate;
        });
      }
    }
    
    return filtered;
  }, [selectedStatus, dateRange]);

  // Apply filters when selectedStatus or dateRange change
  useEffect(() => {
    const userId = user?.id || userData?.id;
    if (userId) {
      fetchPaymentData(userId);
    }
  }, [selectedStatus, dateRange, fetchPaymentData]);

  // When user or userData changes, fetch payment data
  useEffect(() => {
    const userId = user?.id || userData?.id;
    if (userId) {
      fetchPaymentData(userId);
    } else if (user === null) {
      setLoading(false);
    }
  }, [user, userData, fetchPaymentData]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleRequestPayment = () => {
    console.log('Request Payment button clicked');
    console.log('Payment methods before redirect:', paymentMethods);
    
    // Add a safety check in case payment methods are still loading
    if (!paymentMethods || paymentMethods.length === 0) {
      console.log('No payment methods found, redirecting to /add-payment');
      router.push('/add-payment');
    } else {
      console.log('Payment methods found, redirecting to /request-payment');
      router.push('/request-payment');
    }
  };

  // Function to toggle sidebar
  const toggleSidebar = () => {
    if (sidebarRef && sidebarRef.current && typeof sidebarRef.current.toggleMobileMenu === 'function') {
      sidebarRef.current.toggleMobileMenu();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading payment data...</p>
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
              <button 
                onClick={toggleSidebar}
                className="text-slate-500 hover:text-indigo-600 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <div className="text-sm text-slate-500">Payments</div>
                <h1 className="text-2xl font-semibold text-slate-800">Payment History</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile menu button for payment actions (three dots) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              <div className="hidden lg:flex items-center gap-4">
                <button 
                  onClick={() => router.push('/add-payment')} 
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md"
                >
                  + Add Payment Method
                </button>
                <Link 
                  href="/request-payment"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-md"
                >
                  Request Payment
                </Link>
              </div>

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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-sm">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <button 
              onClick={() => router.push('/add-payment')} 
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md"
            >
              + Add Payment Method
            </button>
            <Link 
              href="/request-payment"
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-md"
            >
              Request Payment
            </Link>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-500/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="relative">
              <div className="text-sm text-slate-500 mb-1">Total Revenue</div>
              <div className="text-3xl font-bold text-slate-800">{paymentStats.totalRevenue}</div>
              <div className="text-sm text-slate-500 mt-1">
                <span className="text-indigo-500">{paymentStats.paidTickets || 0} paid tickets</span>
                <span className="mx-1">•</span>
                <span className="text-green-500">{paymentStats.freeTickets || 0} free tickets</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                <span>{paymentStats.paidTransactions} paid transactions</span>
                <span className="mx-1">•</span>
                <span>{paymentStats.freeTransactions} free transactions</span>
              </div>
              {paymentStats.hasWithdrawals && (
                <div className="text-xs text-slate-500 mt-1">
                  {paymentStats.withdrawalAmount} withdrawn
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-500/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="relative">
              <div className="text-sm text-slate-500 mb-1">Pending Payments</div>
              <div className="text-3xl font-bold text-slate-800">{paymentStats.pendingPayments}</div>
              <div className="text-sm text-slate-500 mt-1">
                {paymentStats.pendingPaymentsCount} {paymentStats.pendingPaymentsCount === 1 ? 'request' : 'requests'} awaiting processing
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-500/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="relative">
              <div className="text-sm text-slate-500 mb-1">Successful Payments</div>
              <div className="text-3xl font-bold text-slate-800">{paymentStats.successfulPayments}</div>
              <div className="text-sm text-slate-500 mt-1">
                Paid and active transactions
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-500/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="relative">
              <div className="text-sm text-slate-500 mb-1">Rejected Payments</div>
              <div className="text-3xl font-bold text-slate-800">{paymentStats.rejectedAmount}</div>
              <div className="text-sm text-slate-500 mt-1">
                {paymentStats.rejectedCount} {paymentStats.rejectedCount === 1 ? 'request' : 'requests'} rejected
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h3 className="text-lg font-medium text-slate-900 mb-2 sm:mb-0">Payment Transactions</h3>
            <p className="text-sm text-slate-500">
              {dateRange === 'today' && 'Today\'s transactions'}
              {dateRange === 'week' && 'Transactions in the past 7 days'}
              {dateRange === 'month' && 'Transactions in the past 30 days'}
              {dateRange === 'year' && 'Transactions in the past year'}
              {dateRange === 'all' && 'All time transactions'}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="dateRange" className="block text-sm font-medium text-slate-700 mb-1">
                Date Range
              </label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{transaction.eventName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{transaction.amount}</div>
                        {transaction.status === 'Completed' && (
                          <div className="text-xs">
                            {transaction.isPaid ? (
                              <span className="text-indigo-500">Paid</span>
                            ) : (
                              <span className="text-green-500">Free</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{transaction.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{transaction.paymentMethod}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.type === 'request' ? (
                          <div className="text-sm text-slate-900">{transaction.note || 'No notes'}</div>
                        ) : (
                          <div className="text-sm text-slate-900">{transaction.customer}</div>
                        )}
                        {transaction.type !== 'request' && (
                          <div className="text-sm text-slate-500">{transaction.email}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-500 mb-4">No payment transactions or requests found</p>
              <p className="text-sm text-slate-400 max-w-sm text-center">Transactions will appear here once you have received payments for your events or made withdrawal requests.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Payment() {
  const sidebarRef = useRef();
  
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50">
        <Sidebar ref={sidebarRef} />
        <main className="flex-1 overflow-auto">
          <PaymentContent sidebarRef={sidebarRef} />
        </main>
      </div>
    </ProtectedRoute>
  );
}