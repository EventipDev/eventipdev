'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';

export default function CustomerDetails() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate pagination range
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Fetch from private_event_tickets
      const { data: privateTickets, error: privateError } = await supabase
        .from('private_event_tickets')
        .select('buyer_name, buyer_email, buyer_phone, customer_email, purchase_date, price_paid, ticket_code')
        .ilike('buyer_email', `%${searchTerm}%`)
        .order('purchase_date', { ascending: false })
        .range(from, to);

      // Fetch from paid_tickets
      const { data: paidTickets, error: paidError } = await supabase
        .from('paid_tickets')
        .select('customer_name, customer_email, customer_phone, purchase_date, price_paid, ticket_type')
        .ilike('customer_email', `%${searchTerm}%`)
        .order('purchase_date', { ascending: false })
        .range(from, to);

      // Fetch from free_tickets
      const { data: freeTickets, error: freeError } = await supabase
        .from('free_tickets')
        .select('customer_name, customer_email, customer_phone, purchase_date, price_paid, ticket_type')
        .ilike('customer_email', `%${searchTerm}%`)
        .order('purchase_date', { ascending: false })
        .range(from, to);

      if (privateError || paidError || freeError) {
        throw new Error('Error fetching customer data');
      }

      // Combine and format the data
      const combinedCustomers = [
        ...(privateTickets || []).map(ticket => ({
          name: ticket.buyer_name,
          email: ticket.buyer_email || ticket.customer_email,
          phone: ticket.buyer_phone,
          purchaseDate: new Date(ticket.purchase_date).toLocaleDateString(),
          amount: ticket.price_paid,
          ticketType: 'Private Event',
          ticketCode: ticket.ticket_code
        })),
        ...(paidTickets || []).map(ticket => ({
          name: ticket.customer_name,
          email: ticket.customer_email,
          phone: ticket.customer_phone,
          purchaseDate: new Date(ticket.purchase_date).toLocaleDateString(),
          amount: ticket.price_paid,
          ticketType: ticket.ticket_type,
          ticketCode: null
        })),
        ...(freeTickets || []).map(ticket => ({
          name: ticket.customer_name,
          email: ticket.customer_email,
          phone: ticket.customer_phone,
          purchaseDate: new Date(ticket.purchase_date).toLocaleDateString(),
          amount: 0,
          ticketType: 'Free Ticket',
          ticketCode: null
        }))
      ];

      // Get total count for pagination
      const { count: privateCount } = await supabase
        .from('private_event_tickets')
        .select('*', { count: 'exact', head: true })
        .ilike('buyer_email', `%${searchTerm}%`);

      const { count: paidCount } = await supabase
        .from('paid_tickets')
        .select('*', { count: 'exact', head: true })
        .ilike('customer_email', `%${searchTerm}%`);

      const { count: freeCount } = await supabase
        .from('free_tickets')
        .select('*', { count: 'exact', head: true })
        .ilike('customer_email', `%${searchTerm}%`);

      setTotalCustomers((privateCount || 0) + (paidCount || 0) + (freeCount || 0));
      setCustomers(combinedCustomers);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to fetch customer data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Details</h1>
              <p className="text-sm text-gray-500 mt-1">
                View and manage customer information
              </p>
            </div>
            <div className="mt-2 sm:mt-0">
              <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">{error}</div>
              ) : customers.length === 0 ? (
                <div className="text-center text-gray-600 py-8">No customers found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.map((customer, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.purchaseDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₦{customer.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.ticketType}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {!isLoading && customers.length > 0 && (
            <div className="mt-6 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} of {Math.ceil(totalCustomers / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => 
                    Math.min(prev + 1, Math.ceil(totalCustomers / itemsPerPage))
                  )}
                  disabled={currentPage >= Math.ceil(totalCustomers / itemsPerPage)}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage >= Math.ceil(totalCustomers / itemsPerPage)
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 