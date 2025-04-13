'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '../../../lib/supabase';

// Create a debug function to safely log objects
const debugLog = (label, data) => {
  try {
    console.log(label, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(`${label} (couldn't stringify):`, data);
  }
};

export default function PartnerNotifications() {
  const router = useRouter();
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnershipTypeFilter, setPartnershipTypeFilter] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [selectedNotificationTemplate, setSelectedNotificationTemplate] = useState('');
  const [partnershipTypes, setPartnershipTypes] = useState([]);

  // Templates for quick responses
  const notificationTemplates = [
    { 
      id: 'interest', 
      name: 'Interest Confirmation', 
      subject: 'We received your partnership request',
      message: `Dear [PARTNER_NAME],

Thank you for your interest in partnering with Eventips! We have received your partnership request for [COMPANY_NAME].

Our team is currently reviewing your application and we will get back to you within 3-5 business days to discuss the next steps.

If you have any questions in the meantime, please don't hesitate to contact us.

Best regards,
The Eventips Partnership Team`
    },
    { 
      id: 'followup', 
      name: 'Follow-up Discussion', 
      subject: 'Let\'s discuss your partnership request',
      message: `Dear [PARTNER_NAME],

We've reviewed your partnership request for [COMPANY_NAME] and we're excited about the potential collaboration!

We'd like to schedule a call to discuss your partnership request in more detail. Please let us know what times work best for you in the next few days.

Looking forward to speaking with you soon.

Best regards,
The Eventips Partnership Team`
    },
    { 
      id: 'approved', 
      name: 'Partnership Approved', 
      subject: 'Your Eventips Partnership Request is Approved!',
      message: `Dear [PARTNER_NAME],

Great news! We're pleased to inform you that your partnership request for [COMPANY_NAME] has been approved.

We're excited to welcome you to the Eventips partner network. Our partnership manager will be in touch soon with the next steps and to provide you with all the resources you need.

Welcome aboard!

Best regards,
The Eventips Partnership Team`
    },
    { 
      id: 'declined', 
      name: 'Partnership Declined', 
      subject: 'Regarding your Eventips Partnership Request',
      message: `Dear [PARTNER_NAME],

Thank you for your interest in partnering with Eventips. We've carefully reviewed your partnership request for [COMPANY_NAME].

After consideration, we regret to inform you that we're unable to proceed with the partnership at this time. This decision doesn't reflect on the quality of your business, but rather on our current partnership criteria and capacity.

We appreciate your interest and wish you the best with your business endeavors.

Best regards,
The Eventips Partnership Team`
    }
  ];

  // Admin check
  useEffect(() => {
    const checkAdmin = async () => {
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

  // Fetch partnership types
  useEffect(() => {
    const fetchPartnershipTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('partner_requests')
          .select('partnership_type')
          .order('partnership_type');
        
        if (error) {
          console.error('Error fetching partnership types:', error);
          throw error;
        }
        
        // Extract unique partnership types
        const uniqueTypes = [...new Set(data.map(item => item.partnership_type))];
        setPartnershipTypes(uniqueTypes);
      } catch (err) {
        console.error('Error fetching partnership types:', err.message || err);
      }
    };
    
    fetchPartnershipTypes();
  }, []);

  // Fetch partner requests
  useEffect(() => {
    const fetchPartnerRequests = async () => {
      setIsLoading(true);
      try {
        // Skip session check for now as we've set public access in RLS
        
        // Construct the query based on filters
        debugLog('Building query with filters', { statusFilter, partnershipTypeFilter });
        
        let query = supabase
          .from('partner_requests')
          .select('id, company_name, website, contact_person, email, partnership_type, message, created_at, status')
          .order('created_at', { ascending: false });
          
        // Apply status filter if not 'all'
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        // Apply partnership type filter if not 'all'
        if (partnershipTypeFilter !== 'all') {
          query = query.eq('partnership_type', partnershipTypeFilter);
        }
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
          debugLog('Supabase error details', error);
          throw error;
        }
        
        debugLog('Partner requests loaded', { count: data?.length || 0 });
        setPartnerRequests(data || []);
        
        // Check if notifications table exists before querying
        try {
          // Fetch notification history
          const { data: notificationsData, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .eq('type', 'partner')
            .order('created_at', { ascending: false });
          
          if (notificationsError) {
            debugLog('Notification error details', notificationsError);
            // Don't throw here, just log the error
          } else {
            setNotificationHistory(notificationsData || []);
          }
        } catch (notificationErr) {
          debugLog('Error with notifications table', notificationErr);
          // Set empty array to avoid errors in the UI
          setNotificationHistory([]);
        }
        
      } catch (err) {
        debugLog('Error fetching partner data', err);
        setError(`Failed to load partner requests: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartnerRequests();
  }, [statusFilter, partnershipTypeFilter]);

  const handleSelectPartner = (partner) => {
    setSelectedPartner(partner);
    // Clear any existing message
    setNotificationMessage('');
    setSelectedNotificationTemplate('');
  };

  const handleClosePartnerView = () => {
    setSelectedPartner(null);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedNotificationTemplate(templateId);
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template && selectedPartner) {
      let message = template.message;
      message = message.replace('[PARTNER_NAME]', selectedPartner.contact_person);
      message = message.replace('[COMPANY_NAME]', selectedPartner.company_name);
      setNotificationMessage(message);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedPartner || !notificationMessage.trim()) {
      setNotification({
        type: 'error',
        message: 'Please select a partner and enter a message'
      });
      return;
    }

    setIsSending(true);

    try {
      // Get the template if one was selected
      const template = notificationTemplates.find(t => t.id === selectedNotificationTemplate);
      const subject = template ? template.subject : 'Notification from Eventips';

      // In a real app, this would send an actual email
      // For now, we'll just log it and save to notifications table
      console.log(`Sending email to ${selectedPartner.email}:`, {
        subject,
        message: notificationMessage
      });
      
      // Save the notification to the database
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_id: selectedPartner.id,
            recipient_email: selectedPartner.email,
            recipient_name: selectedPartner.contact_person,
            type: 'partner',
            subject,
            message: notificationMessage,
            status: 'sent',
            created_by: 'admin',
            related_company: selectedPartner.company_name
          }
        ]);
      
      if (error) throw error;

      // Update the partner status if it was a specific template
      if (selectedNotificationTemplate === 'approved') {
        await updatePartnerStatus(selectedPartner.id, 'contacted');
      } else if (selectedNotificationTemplate === 'declined') {
        await updatePartnerStatus(selectedPartner.id, 'declined');
      } else if (['interest', 'followup'].includes(selectedNotificationTemplate)) {
        await updatePartnerStatus(selectedPartner.id, 'contacted');
      }
      
      // Update notification history
      const { data: updatedHistory, error: historyError } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'partner')
        .order('created_at', { ascending: false });
      
      if (!historyError) {
        setNotificationHistory(updatedHistory || []);
      }
      
      setNotification({
        type: 'success',
        message: `Notification sent to ${selectedPartner.contact_person} at ${selectedPartner.email}`
      });
      
      // Clear the form
      setNotificationMessage('');
      setSelectedNotificationTemplate('');
    } catch (err) {
      console.error('Error sending notification:', err);
      setNotification({
        type: 'error',
        message: 'Failed to send notification. Please try again.'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const updatePartnerStatus = async (partnerId, status) => {
    try {
      const { error } = await supabase
        .from('partner_requests')
        .update({ status })
        .eq('id', partnerId);
      
      if (error) throw error;
      
      // Update local state to reflect the change
      setPartnerRequests(partnerRequests.map(partner => 
        partner.id === partnerId ? { ...partner, status } : partner
      ));
      
      if (selectedPartner && selectedPartner.id === partnerId) {
        setSelectedPartner({ ...selectedPartner, status });
      }
    } catch (err) {
      console.error('Error updating partner status:', err);
    }
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Partner Notifications</h1>
              <p className="text-sm sm:text-base text-gray-600">Send notifications to partners and manage communication</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Link href="/admin/partners" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 transition-colors">
                  View Partners
                </button>
              </Link>
              <Link href="/admin/dashboard" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
          
          {notification && (
            <div className={`p-4 mb-6 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {notification.message}
              <button 
                onClick={() => setNotification(null)} 
                className="ml-4 text-sm font-medium hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Partner List Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-100 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-800">Partner Requests</h2>
                  
                  {/* Status filter */}
                  <div className="mt-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="contacted">Contacted</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                  
                  {/* Partnership type filter */}
                  <div className="mt-2">
                    <select
                      value={partnershipTypeFilter}
                      onChange={(e) => setPartnershipTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"
                    >
                      <option value="all">All Partnership Types</option>
                      {partnershipTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 text-red-600">{error}</div>
                ) : partnerRequests.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No partner requests found</div>
                ) : (
                  <div className="max-h-[350px] sm:max-h-[500px] overflow-y-auto">
                    {partnerRequests.map((partner) => (
                      <div 
                        key={partner.id} 
                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${selectedPartner?.id === partner.id ? 'bg-amber-50' : ''}`}
                        onClick={() => handleSelectPartner(partner)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold">
                              {partner.company_name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{partner.company_name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">{partner.contact_person}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(partner.status)}`}>
                            {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">{partner.partnership_type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Notification Composer Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 h-full">
                {!selectedPartner ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">No Partner Selected</h3>
                    <p className="text-sm">Select a partner from the list to send a notification</p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">{selectedPartner.company_name}</h2>
                        <p className="text-sm text-gray-600 break-all">
                          {selectedPartner.contact_person} • {selectedPartner.email}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedPartner.status)}`}>
                            {selectedPartner.status.charAt(0).toUpperCase() + selectedPartner.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                            Request submitted on {formatDate(selectedPartner.created_at)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs font-medium text-gray-700">Partnership Type: </span>
                          <span className="text-xs text-gray-700">{selectedPartner.partnership_type}</span>
                        </div>
                        {selectedPartner.website && (
                          <div className="mt-1">
                            <a 
                              href={selectedPartner.website.startsWith('http') ? selectedPartner.website : `https://${selectedPartner.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-amber-600 hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleClosePartnerView}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Partner Message:</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedPartner.message}</p>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Templates
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {notificationTemplates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleTemplateSelect(template.id)}
                            className={`px-3 py-1.5 text-xs sm:text-sm rounded-full ${
                              selectedNotificationTemplate === template.id
                                ? 'bg-amber-100 text-amber-800 border-amber-300 border'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                            }`}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Notification Message
                      </label>
                      <textarea
                        id="message"
                        rows="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Enter your message to the partner here..."
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSendNotification}
                        disabled={true}
                        className="w-full sm:w-auto px-5 py-2 rounded-md font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Send Notification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Notification History */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Notifications</h2>
            
            {notificationHistory.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <p>No notification history yet</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Subject</th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {notificationHistory.map((notification) => (
                        <tr key={notification.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {formatDate(notification.created_at)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{notification.recipient_name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-none">{notification.related_company}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                            <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[150px] md:max-w-xs">{notification.subject}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {notification.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 