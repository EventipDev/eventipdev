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

export default function ContactNotifications() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [selectedNotificationTemplate, setSelectedNotificationTemplate] = useState('');

  // Templates for quick responses
  const notificationTemplates = [
    { 
      id: 'receipt', 
      name: 'Message Receipt', 
      subject: 'We received your message',
      message: `Dear [CONTACT_NAME],

Thank you for reaching out to Eventips! We have received your message regarding "[SUBJECT]".

Our team is reviewing your inquiry and will get back to you as soon as possible. We typically respond to all inquiries within 24-48 hours.

If you have any additional information to share, please feel free to reply to this email.

Best regards,
The Eventips Support Team`
    },
    { 
      id: 'question', 
      name: 'Additional Information', 
      subject: 'Additional information needed',
      message: `Dear [CONTACT_NAME],

Thank you for contacting Eventips regarding "[SUBJECT]".

In order to better assist you, we need some additional information:
- [Add specific questions here]

Your response will help us address your inquiry more effectively.

Best regards,
The Eventips Support Team`
    },
    { 
      id: 'resolved', 
      name: 'Issue Resolved', 
      subject: 'Your Eventips inquiry has been resolved',
      message: `Dear [CONTACT_NAME],

We're pleased to inform you that the issue you reported regarding "[SUBJECT]" has been resolved.

[Add resolution details here]

If you have any further questions or concerns, please don't hesitate to contact us.

Thank you for your patience and for using Eventips!

Best regards,
The Eventips Support Team`
    },
    { 
      id: 'delay', 
      name: 'Response Delay', 
      subject: 'Update on your Eventips inquiry',
      message: `Dear [CONTACT_NAME],

We wanted to let you know that we're still working on your inquiry regarding "[SUBJECT]".

Due to high volume, our response is taking longer than expected. We apologize for the delay and appreciate your patience. We expect to have a complete response for you within [timeframe].

Thank you for your understanding.

Best regards,
The Eventips Support Team`
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
          debugLog('Error checking admin authentication', error);
          router.push('/admin/login');
        }
      }
    };
    
    checkAdmin();
  }, [router]);

  // Fetch contact messages
  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        // Skip session check for now as we've set public access in RLS
        
        // Construct the query based on filters
        debugLog('Building contact query with filters', { statusFilter });
        
        let query = supabase
        .from('contact_messages')
          .select('id, name, email, subject, message, created_at, status')
          .order('created_at', { ascending: false });
          
        // Apply status filter if not 'all'
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
          debugLog('Supabase error details for contacts', error);
          throw error;
        }
        
        debugLog('Contact messages loaded', { count: data?.length || 0 });
        setContacts(data || []);
        
        // Check if notifications table exists before querying
        try {
          // Fetch notification history
          const { data: notificationsData, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .eq('type', 'contact')
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
        debugLog('Error fetching contact data', err);
        setError(`Failed to load contact messages: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [statusFilter]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    // Clear any existing message
    setNotificationMessage('');
    setSelectedNotificationTemplate('');
  };

  const handleCloseContactView = () => {
    setSelectedContact(null);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedNotificationTemplate(templateId);
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template && selectedContact) {
      let message = template.message;
      message = message.replace('[CONTACT_NAME]', selectedContact.name);
      message = message.replace('[SUBJECT]', selectedContact.subject);
      setNotificationMessage(message);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedContact || !notificationMessage.trim()) {
      setNotification({
        type: 'error',
        message: 'Please select a contact and enter a message'
      });
      return;
    }

    setIsSending(true);

    try {
      // Get the template if one was selected
      const template = notificationTemplates.find(t => t.id === selectedNotificationTemplate);
      const subject = template ? template.subject : 'Response from Eventips';

      debugLog('Sending notification email', {
        to: selectedContact.email,
        subject,
        templateId: selectedNotificationTemplate
      });
      
      // Save the notification to the database
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_id: selectedContact.id,
            recipient_email: selectedContact.email,
            recipient_name: selectedContact.name,
            type: 'contact',
          subject,
            message: notificationMessage,
            status: 'sent',
            created_by: 'admin',
            related_subject: selectedContact.subject
          }
        ]);
      
      if (error) {
        debugLog('Error saving notification', error);
        throw error;
      }

      // Update the contact message status
      let newStatus = 'read';
      if (selectedNotificationTemplate === 'resolved') {
        newStatus = 'resolved';
      }
      
      await updateContactStatus(selectedContact.id, newStatus);
      
      // Update notification history
      const { data: updatedHistory, error: historyError } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'contact')
        .order('created_at', { ascending: false });
      
      if (historyError) {
        debugLog('Error fetching updated notification history', historyError);
      } else {
        setNotificationHistory(updatedHistory || []);
      }
      
      setNotification({
        type: 'success',
        message: `Response sent to ${selectedContact.name} at ${selectedContact.email}`
      });
      
      // Clear the form
      setNotificationMessage('');
      setSelectedNotificationTemplate('');
    } catch (err) {
      debugLog('Error sending notification', err);
      setNotification({
        type: 'error',
        message: `Failed to send response: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsSending(false);
    }
  };

  const updateContactStatus = async (contactId, status) => {
    try {
      debugLog('Updating contact status', { contactId, status });
      
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', contactId);

      if (error) {
        debugLog('Error updating contact status', error);
        throw error;
      }
      
      // Update local state to reflect the change
      setContacts(contacts.map(contact => 
        contact.id === contactId ? { ...contact, status } : contact
      ));
      
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact({ ...selectedContact, status });
      }
      
      debugLog('Contact status updated successfully', { status });
    } catch (err) {
      debugLog('Error in updateContactStatus', err);
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
      case 'unread':
        return 'bg-yellow-100 text-yellow-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Contact Notifications</h1>
              <p className="text-sm sm:text-base text-gray-600">Respond to contact form submissions and manage inquiries</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Link href="/admin/contact-us" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 transition-colors">
                  View Messages
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
            {/* Contact List Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-100 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-800">Contact Messages</h2>
                  
                  {/* Status filter */}
                  <div className="mt-2">
              <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"
                    >
                      <option value="all">All Messages</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                      <option value="resolved">Resolved</option>
              </select>
          </div>
        </div>
        
                {isLoading ? (
                  <div className="p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : error ? (
                  <div className="p-4 text-red-600">{error}</div>
                ) : contacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No contact messages found</div>
                ) : (
                  <div className="max-h-[350px] sm:max-h-[500px] overflow-y-auto">
                    {contacts.map((contact) => (
                      <div 
                        key={contact.id} 
                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                          selectedContact?.id === contact.id ? 'bg-amber-50' : (contact.status === 'unread' ? 'bg-yellow-50' : '')
                        }`}
                        onClick={() => handleSelectContact(contact)}
                      >
                        <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold">
                              {contact.name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">{contact.subject}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(contact.status)}`}>
                            {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">{formatDate(contact.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Response Composer Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 h-full">
                {!selectedContact ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">No Message Selected</h3>
                    <p className="text-sm">Select a contact message from the list to compose a response</p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">{selectedContact.name}</h2>
                        <p className="text-sm text-gray-600 break-all">{selectedContact.email}</p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedContact.status)}`}>
                            {selectedContact.status.charAt(0).toUpperCase() + selectedContact.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                            Received on {formatDate(selectedContact.created_at)}
                          </span>
                        </div>
                      </div>
                        <button
                        onClick={handleCloseContactView}
                        className="text-gray-400 hover:text-gray-500"
                        >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    </div>
                    
                    {/* Original Message */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Subject: {selectedContact.subject}</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedContact.message}</p>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Templates
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
                        Your Response
                      </label>
                      <textarea
                        id="message"
                        rows="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Type your response here..."
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateContactStatus(selectedContact.id, 'resolved')}
                          className="w-full sm:w-auto px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                        >
                          Mark as Resolved
                        </button>
                          <button
                          type="button"
                          onClick={() => updateContactStatus(selectedContact.id, 'read')}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          Mark as Read
                          </button>
                      </div>
                          <button
                        type="button"
                        onClick={handleSendNotification}
                        disabled={true}
                        className="w-full sm:w-auto px-5 py-2 rounded-md font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Send Response
                          </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Notification History */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Responses</h2>
            
            {notificationHistory.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <p>No response history yet</p>
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
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Message</th>
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
                            <div className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-none">{notification.recipient_email}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                            <div className="text-xs sm:text-sm text-gray-900">{notification.subject}</div>
                            <div className="text-xs text-gray-500">{truncateText(notification.related_subject)}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                            <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[150px] md:max-w-xs">{truncateText(notification.message)}</div>
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