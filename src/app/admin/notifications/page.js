'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabase';

// Create a debug function to safely log objects
const debugLog = (label, data) => {
  try {
    console.log(label, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(`${label} (couldn't stringify):`, data);
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      debugLog('Fetching notifications with filter', { tab: activeTab });
      let query;

      // Fetch notifications based on active tab
      if (activeTab === 'contact') {
        // Fetch contact messages
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          debugLog('Error fetching contact messages', error);
          throw error;
        }
        
        // Transform to notification format
        setNotifications(data.map(msg => ({
          id: msg.id,
          type: 'contact',
          title: msg.subject || 'New Contact Message',
          message: msg.message,
          sender: msg.name,
          email: msg.email,
          created_at: msg.created_at,
          status: msg.status
        })));
      } 
      else if (activeTab === 'partnership') {
        // Fetch partnership requests
        const { data, error } = await supabase
          .from('partner_requests')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          debugLog('Error fetching partnership requests', error);
          throw error;
        }
        
        // Transform to notification format
        setNotifications(data.map(req => ({
          id: req.id,
          type: 'partnership',
          title: 'New Partnership Request',
          message: req.message,
          sender: req.contact_person,
          email: req.email,
          company: req.company_name,
          created_at: req.created_at,
          status: req.status
        })));
      }
      else if (activeTab === 'unread') {
        // Fetch all unread notifications
        const [contactResponse, partnershipResponse] = await Promise.all([
          supabase
            .from('contact_messages')
            .select('*')
            .eq('status', 'unread')
            .order('created_at', { ascending: false }),
            
          supabase
            .from('partner_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
        ]);
        
        if (contactResponse.error) {
          debugLog('Error fetching unread contact messages', contactResponse.error);
          throw contactResponse.error;
        }
        if (partnershipResponse.error) {
          debugLog('Error fetching unread partnership requests', partnershipResponse.error);
          throw partnershipResponse.error;
        }
        
        // Combine and transform
        const contactNotifications = contactResponse.data.map(msg => ({
          id: msg.id,
          type: 'contact',
          title: msg.subject || 'New Contact Message',
          message: msg.message,
          sender: msg.name,
          email: msg.email,
          created_at: msg.created_at,
          status: msg.status
        }));
        
        const partnershipNotifications = partnershipResponse.data.map(req => ({
          id: req.id,
          type: 'partnership',
          title: 'New Partnership Request',
          message: req.message,
          sender: req.contact_person,
          email: req.email,
          company: req.company_name,
          created_at: req.created_at,
          status: req.status
        }));
        
        setNotifications([...contactNotifications, ...partnershipNotifications].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ));
      }
      else if (activeTab === 'read') {
        // Fetch all read notifications
        const [contactResponse, partnershipResponse] = await Promise.all([
          supabase
            .from('contact_messages')
            .select('*')
            .eq('status', 'read')
            .order('created_at', { ascending: false }),
            
          supabase
            .from('partner_requests')
            .select('*')
            .neq('status', 'pending')
            .order('created_at', { ascending: false })
        ]);
        
        if (contactResponse.error) {
          debugLog('Error fetching read contact messages', contactResponse.error);
          throw contactResponse.error;
        }
        if (partnershipResponse.error) {
          debugLog('Error fetching read partnership requests', partnershipResponse.error);
          throw partnershipResponse.error;
        }
        
        // Combine and transform
        const contactNotifications = contactResponse.data.map(msg => ({
          id: msg.id,
          type: 'contact',
          title: msg.subject || 'New Contact Message',
          message: msg.message,
          sender: msg.name,
          email: msg.email,
          created_at: msg.created_at,
          status: msg.status
        }));
        
        const partnershipNotifications = partnershipResponse.data.map(req => ({
          id: req.id,
          type: 'partnership',
          title: 'New Partnership Request',
          message: req.message,
          sender: req.contact_person,
          email: req.email,
          company: req.company_name,
          created_at: req.created_at,
          status: req.status
        }));
        
        setNotifications([...contactNotifications, ...partnershipNotifications].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ));
      }
      else {
        // Fetch all notifications
        const [contactResponse, partnershipResponse] = await Promise.all([
          supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false }),
            
          supabase
            .from('partner_requests')
            .select('*')
            .order('created_at', { ascending: false })
        ]);
        
        if (contactResponse.error) {
          debugLog('Error fetching all contact messages', contactResponse.error);
          throw contactResponse.error;
        }
        if (partnershipResponse.error) {
          debugLog('Error fetching all partnership requests', partnershipResponse.error);
          throw partnershipResponse.error;
        }
        
        // Combine and transform
        const contactNotifications = contactResponse.data.map(msg => ({
          id: msg.id,
          type: 'contact',
          title: msg.subject || 'New Contact Message',
          message: msg.message,
          sender: msg.name,
          email: msg.email,
          created_at: msg.created_at,
          status: msg.status
        }));
        
        const partnershipNotifications = partnershipResponse.data.map(req => ({
          id: req.id,
          type: 'partnership',
          title: 'New Partnership Request',
          message: req.message,
          sender: req.contact_person,
          email: req.email,
          company: req.company_name,
          created_at: req.created_at,
          status: req.status
        }));
        
        setNotifications([...contactNotifications, ...partnershipNotifications].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ));
      }
      
      debugLog('Notifications loaded', { count: notifications.length });
    } catch (error) {
      debugLog('Error fetching notifications', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id, type) => {
    try {
      debugLog('Marking notification as read', { id, type });
      
      if (type === 'contact') {
        const { error } = await supabase
          .from('contact_messages')
          .update({ status: 'read' })
          .eq('id', id);
          
        if (error) {
          debugLog('Error marking contact message as read', error);
          throw error;
        }
      } else if (type === 'partnership') {
        const { error } = await supabase
          .from('partner_requests')
          .update({ status: 'reviewed' })
          .eq('id', id);
          
        if (error) {
          debugLog('Error marking partnership request as read', error);
          throw error;
        }
      }
      
      // Refresh the notifications
      fetchNotifications();
      debugLog('Successfully marked notification as read', { id, type });
    } catch (error) {
      debugLog('Error in markAsRead function', error);
    }
  };

  const handleTabChange = (tab) => {
    debugLog('Changing tab', { from: activeTab, to: tab });
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-6 gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage all system notifications and inquiries
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

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg mb-6 sm:mb-8">
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => handleTabChange('all')}
                  className={`${
                    activeTab === 'all'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-1 text-center`}
                >
                  All
                </button>
                <Link
                  href="/admin/notifications/contact"
                  className="whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-xs sm:text-sm flex-1 text-center"
                >
                  Contact
                </Link>
                <button
                  onClick={() => handleTabChange('partnership')}
                  className={`${
                    activeTab === 'partnership'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-1 text-center`}
                >
                  Partnership
                </button>
                <button
                  onClick={() => handleTabChange('unread')}
                  className={`${
                    activeTab === 'unread'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-1 text-center`}
                >
                  Unread
                </button>
                <button
                  onClick={() => handleTabChange('read')}
                  className={`${
                    activeTab === 'read'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex-1 text-center`}
                >
                  Read
                </button>
              </nav>
            </div>

            {/* Notifications Content */}
            <div className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 sm:h-64">
                  <div className="h-16 w-16 sm:h-24 sm:w-24 text-gray-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">No notifications found</h3>
                  <p className="text-sm text-gray-500 text-center px-4">Try changing your filter settings or check back later</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={`${notification.type}-${notification.id}`}
                      className={`bg-white border rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow ${
                        (notification.status === 'unread' || notification.status === 'pending') 
                          ? 'border-l-4 border-l-indigo-500' 
                          : 'border'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`hidden sm:flex flex-shrink-0 rounded-full p-2 ${
                          notification.type === 'contact' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {notification.type === 'contact' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="sm:ml-4 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <div className="flex items-center">
                              <div className={`sm:hidden flex-shrink-0 rounded-full p-1.5 mr-2 ${
                                notification.type === 'contact' 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-green-100 text-green-600'
                              }`}>
                                {notification.type === 'contact' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                )}
                              </div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{notification.title}</h3>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                              {new Date(notification.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">From: {notification.sender} 
                            <span className="block sm:inline sm:ml-1 truncate max-w-[250px]">({notification.email})</span>
                          </p>
                          {notification.company && (
                            <p className="text-sm text-gray-600">Company: {notification.company}</p>
                          )}
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{notification.message}</p>
                          
                          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                notification.status === 'unread' || notification.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {notification.status === 'unread' || notification.status === 'pending' ? 'New' : 'Reviewed'}
                              </span>
                            </div>
                            <div className="flex space-x-3 w-full sm:w-auto justify-end">
                              {(notification.status === 'unread' || notification.status === 'pending') && (
                                <button
                                  onClick={() => markAsRead(notification.id, notification.type)}
                                  className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                >
                                  Mark as read
                                </button>
                              )}
                              <button
                                className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notification Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            <Link href="/admin/notifications/contact" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mr-3 sm:mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Contact Form Responses</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Respond to contact form submissions</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/notifications/partners" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mr-3 sm:mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Partner Notifications</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Communicate with partnership applicants</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}