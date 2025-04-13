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

export default function SystemNotifications() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'system',
    event_trigger: '',
    subject: '',
    message: '',
    is_active: true
  });

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

  // Fetch system notification templates
  useEffect(() => {
    const fetchSystemNotifications = async () => {
      setIsLoading(true);
      try {
        // Skip session check for now as we've set public access in RLS
        debugLog('Fetching system notification templates');
        
        const { data, error } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('type', 'system')
          .order('name', { ascending: true });
        
        if (error) {
          debugLog('Supabase error details for system notifications', error);
          throw error;
        }
        
        debugLog('System notification templates loaded', { count: data?.length || 0 });
        setSystemNotifications(data || []);
      } catch (err) {
        debugLog('Error fetching system notifications', err);
        setError(`Failed to load system notifications: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemNotifications();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditNotification = (notification) => {
    debugLog('Editing notification template', { id: notification.id, name: notification.name });
    setEditingNotification(notification);
    setFormData({
      name: notification.name,
      type: notification.type,
      event_trigger: notification.event_trigger,
      subject: notification.subject,
      message: notification.message,
      is_active: notification.is_active
    });
  };

  const handleCancelEdit = () => {
    debugLog('Canceling edit operation');
    setEditingNotification(null);
    setFormData({
      name: '',
      type: 'system',
      event_trigger: '',
      subject: '',
      message: '',
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      debugLog('Submitting notification template form', { 
        isEditing: !!editingNotification,
        formData
      });
      
      if (editingNotification) {
        // Update existing notification
        const { error } = await supabase
          .from('notification_templates')
          .update(formData)
          .eq('id', editingNotification.id);
        
        if (error) {
          debugLog('Error updating notification template', error);
          throw error;
        }
        
        debugLog('Successfully updated notification template', { name: formData.name });
        setNotification({
          type: 'success',
          message: `Notification template "${formData.name}" updated successfully`
        });
      } else {
        // Create new notification
        const { error } = await supabase
          .from('notification_templates')
          .insert([formData]);
        
        if (error) {
          debugLog('Error creating notification template', error);
          throw error;
        }
        
        debugLog('Successfully created notification template', { name: formData.name });
        setNotification({
          type: 'success',
          message: `Notification template "${formData.name}" created successfully`
        });
      }
      
      // Refresh the list
      const { data, error: refreshError } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('type', 'system')
        .order('name', { ascending: true });
      
      if (refreshError) {
        debugLog('Error refreshing notification templates list', refreshError);
      } else {
        setSystemNotifications(data || []);
      }
      
      // Reset form
      handleCancelEdit();
    } catch (err) {
      debugLog('Error saving notification template', err);
      setNotification({
        type: 'error',
        message: `Failed to save notification template: ${err.message || 'Unknown error'}`
      });
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      debugLog('Toggling notification active status', { id, currentStatus });
      
      const { error } = await supabase
        .from('notification_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) {
        debugLog('Error toggling notification status', error);
        throw error;
      }
      
      debugLog('Successfully toggled notification status', { newStatus: !currentStatus });
      
      // Update local state
      setSystemNotifications(
        systemNotifications.map(notification => 
          notification.id === id ? { ...notification, is_active: !notification.is_active } : notification
        )
      );
    } catch (err) {
      debugLog('Error in handleToggleActive', err);
      setNotification({
        type: 'error',
        message: `Failed to update notification status: ${err.message || 'Unknown error'}`
      });
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

  // Event trigger options
  const eventTriggers = [
    { value: 'user_signup', label: 'User Registration' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'event_created', label: 'Event Created' },
    { value: 'ticket_purchased', label: 'Ticket Purchased' },
    { value: 'event_reminder', label: 'Event Reminder' },
    { value: 'payment_processed', label: 'Payment Processed' },
    { value: 'payment_failed', label: 'Payment Failed' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">System Notifications</h1>
              <p className="text-gray-600">Manage automated system notification templates</p>
            </div>
            <Link href="/admin/dashboard">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors">
                Back to Dashboard
              </button>
            </Link>
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
            {/* Form Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  {editingNotification ? 'Edit Notification Template' : 'Create Notification Template'}
                </h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="event_trigger" className="block text-sm font-medium text-gray-700 mb-1">
                        Event Trigger
                      </label>
                      <select
                        id="event_trigger"
                        name="event_trigger"
                        value={formData.event_trigger}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="">Select an event trigger</option>
                        {eventTriggers.map(trigger => (
                          <option key={trigger.value} value={trigger.value}>
                            {trigger.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message Template
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows="6"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Use [NAME], [EMAIL], etc. as placeholders"
                      ></textarea>
                      <p className="mt-1 text-xs text-gray-500">
                        Use placeholders like [NAME], [EMAIL], [EVENT_NAME], etc. which will be replaced with actual values.
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      {editingNotification && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        {editingNotification ? 'Update' : 'Create'} Template
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Templates List Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-100 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-800">Notification Templates</h2>
                </div>
                
                {isLoading ? (
                  <div className="p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 text-red-600">{error}</div>
                ) : systemNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No system notification templates found</p>
                    <p className="text-sm mt-2">Create your first template using the form</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Template Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event Trigger
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {systemNotifications.map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{template.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{template.subject}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {eventTriggers.find(t => t.value === template.event_trigger)?.label || template.event_trigger}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {template.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEditNotification(template)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleActive(template.id, template.is_active)}
                                className={`${
                                  template.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                }`}
                              >
                                {template.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* Template Usage Guide */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-blue-800 mb-2">Template Variables</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="text-sm text-blue-700">
                    <p><strong>[NAME]</strong> - Recipient's name</p>
                    <p><strong>[EMAIL]</strong> - Recipient's email</p>
                    <p><strong>[EVENT_NAME]</strong> - Name of the event</p>
                    <p><strong>[EVENT_DATE]</strong> - Date of the event</p>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p><strong>[TICKET_TYPE]</strong> - Ticket type/category</p>
                    <p><strong>[PAYMENT_AMOUNT]</strong> - Payment amount</p>
                    <p><strong>[PAYMENT_ID]</strong> - Payment ID/reference</p>
                    <p><strong>[SITE_URL]</strong> - Website URL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 