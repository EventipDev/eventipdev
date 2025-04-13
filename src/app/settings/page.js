'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import { motion } from 'framer-motion';

function SettingsContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [localUserId, setLocalUserId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [userPassword, setUserPassword] = useState('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    isDefault: false
  });
  
  // Form states
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get user data from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        if (parsedUser.id) {
          setLocalUserId(parsedUser.id);
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, []);

  // Get user details from metadata
  const firstName = userData?.first_name || user?.user_metadata?.first_name || '';
  const lastName = userData?.last_name || user?.user_metadata?.last_name || '';
  const email = userData?.email || user?.email || '';
  const fullName = `${firstName} ${lastName}`.trim() || email || 'User';
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
    : (email?.charAt(0) || 'U');

  // Get user details from metadata
  useEffect(() => {
    setIsLoading(true);
    if (user || userData) {
      setProfileData({
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: user?.user_metadata?.phone || ''
      });
      
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [user, userData, firstName, lastName, email, localUserId]);

  // Add this effect to fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setIsLoadingPaymentMethods(true);
      try {
        const userId = user?.id || localUserId;
        if (!userId) return;
        
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', userId);
          
        if (error) throw error;
        setPaymentMethods(data || []);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };
    
    if (user || localUserId) {
      fetchPaymentMethods();
    }
  }, [user, localUserId]);

  // Add effect to fetch user password when active tab is security
  useEffect(() => {
    const fetchUserPassword = async () => {
      if (activeTab !== 'security') return;
      
      setIsLoadingPassword(true);
      try {
        // Get user ID from either context or localStorage
        const userId = user?.id || localUserId;
        if (!userId) {
          setIsLoadingPassword(false);
          return;
        }
        
        // Get email from context or localStorage
        const userEmail = userData?.email || user?.email;
        if (!userEmail) {
          setIsLoadingPassword(false);
          return;
        }
        
        // Fetch user from custom users table using email
        const { data, error } = await supabase
          .from('users')
          .select('password')
          .eq('email', userEmail)
          .single();
          
        if (error) {
          console.error('Error fetching user password:', error);
          setMessage({ type: 'error', text: 'Could not fetch user data. Please try again later.' });
          setIsLoadingPassword(false);
          return;
        }
        
        if (data?.password) {
          setUserPassword(data.password);
        }
      } catch (error) {
        console.error('Error fetching user password:', error);
        setMessage({ type: 'error', text: 'An error occurred fetching user data.' });
      } finally {
        setIsLoadingPassword(false);
      }
    };
    
    fetchUserPassword();
  }, [activeTab, user, userData, localUserId]);

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Get user ID from either context or localStorage
      const userId = user?.id || localUserId;
      const userEmail = userData?.email || user?.email;
      
      if (!userId || !userEmail) {
        setMessage({ type: 'error', text: 'User information not found. Please try logging in again.' });
        setIsSaving(false);
        return;
      }
      
      // Update profile in custom users table
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating profile in database:', error);
        setMessage({ 
          type: 'error', 
          text: 'Failed to update profile. Please try again.' 
        });
        setIsSaving(false);
        return;
      }
      
      // Update localStorage
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.first_name = profileData.firstName;
          parsedUser.last_name = profileData.lastName;
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
      
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });
      
      // If email was changed, we need to handle that separately with an email update in the users table
      if (profileData.email !== userEmail) {
        // Check if email already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', profileData.email)
          .maybeSingle();
          
        if (checkError) {
          console.error('Error checking email availability:', checkError);
          setMessage({ 
            type: 'warning', 
            text: 'Profile updated, but could not validate email availability.' 
          });
          setIsSaving(false);
          return;
        }
        
        if (existingUser) {
          setMessage({ 
            type: 'warning', 
            text: 'Profile updated, but email is already in use by another account.' 
          });
          setIsSaving(false);
          return;
        }
        
        // Update email in the users table
        const { error: emailError } = await supabase
          .from('users')
          .update({ 
            email: profileData.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (emailError) {
          setMessage({ 
            type: 'warning', 
            text: 'Profile updated, but email change could not be saved.' 
          });
        } else {
          // Update localStorage with new email
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              parsedUser.email = profileData.email;
              localStorage.setItem('user', JSON.stringify(parsedUser));
            }
          } catch (e) {
            console.error('Error updating email in localStorage:', e);
          }
          
          setMessage({ 
            type: 'success', 
            text: 'Profile and email updated successfully!' 
          });
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setIsSaving(false);
      return;
    }
    
    // Validate current password against stored password
    if (userPassword && passwordData.currentPassword !== userPassword) {
      setMessage({ type: 'error', text: 'Current password is incorrect.' });
      setIsSaving(false);
      return;
    }
    
    try {
      // Get user ID and email
      const userId = user?.id || localUserId;
      const userEmail = userData?.email || user?.email;
      
      if (!userId || !userEmail) {
        setMessage({ type: 'error', text: 'User information not found. Please try logging in again.' });
        setIsSaving(false);
        return;
      }
      
      // Update password in custom users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          password: passwordData.newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
          
      if (dbError) {
        console.error('Error updating password in database:', dbError);
        setMessage({ type: 'error', text: 'Failed to update password. Please try again.' });
        setIsSaving(false);
        return;
      }
      
      // Update local state with new password
      setUserPassword(passwordData.newPassword);
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update password. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add handler to edit payment method
  const handleEditPaymentMethod = (method) => {
    setEditingPaymentMethod(method);
    setPaymentFormData({
      accountName: method.account_name,
      bankName: method.bank_name,
      accountNumber: method.account_number,
      routingNumber: method.routing_number,
      accountType: method.account_type,
      isDefault: method.is_default
    });
  };

  // Add handler to save edited payment method
  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({
          account_name: paymentFormData.accountName,
          bank_name: paymentFormData.bankName,
          account_number: paymentFormData.accountNumber,
          routing_number: paymentFormData.routingNumber,
          account_type: paymentFormData.accountType,
          is_default: paymentFormData.isDefault,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPaymentMethod.id);
        
      if (error) throw error;
      
      // Update payment methods list
      setPaymentMethods(prevMethods => 
        prevMethods.map(method => 
          method.id === editingPaymentMethod.id 
            ? {
                ...method,
                account_name: paymentFormData.accountName,
                bank_name: paymentFormData.bankName,
                account_number: paymentFormData.accountNumber,
                routing_number: paymentFormData.routingNumber,
                account_type: paymentFormData.accountType,
                is_default: paymentFormData.isDefault
              } 
            : method
        )
      );
      
      setMessage({ type: 'success', text: 'Payment method updated successfully!' });
      setEditingPaymentMethod(null);
    } catch (error) {
      console.error('Error updating payment method:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update payment method.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Add handler to delete payment method
  const handleDeletePaymentMethod = async (methodId) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);
        
      if (error) throw error;
      
      // Update payment methods list
      setPaymentMethods(prevMethods => prevMethods.filter(method => method.id !== methodId));
      setMessage({ type: 'success', text: 'Payment method deleted successfully!' });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete payment method.' });
    }
  };

  // Add handler to set default payment method
  const handleSetDefaultPaymentMethod = async (methodId) => {
    try {
      // Update the selected payment method to be default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);
        
      if (error) throw error;
      
      // Update payment methods list to reflect the change
      setPaymentMethods(prevMethods => 
        prevMethods.map(method => ({
          ...method,
          is_default: method.id === methodId
        }))
      );
      
      setMessage({ type: 'success', text: 'Default payment method updated!' });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to set default payment method.' });
    }
  };

  // Format message type to Tailwind classes
  const getMessageClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center px-4 sm:px-8 py-4">
            <div>
              <div className="text-sm text-slate-500 mb-1">Settings</div>
              <h1 className="text-2xl font-semibold text-slate-800">
                Account Settings
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-medium shadow-md">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-slate-800">{fullName}</div>
                  <div className="text-xs text-slate-500">{email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {/* Settings Navigation */}
          <div className="mb-6 flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'profile' 
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'security' 
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'billing' 
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Billing
            </button>
          </div>

          {/* Status Message */}
          {message.text && (
            <div 
              className={`mb-6 p-4 border rounded-lg ${getMessageClasses(message.type)}`}
            >
              {message.text}
            </div>
          )}

          {/* Settings Content */}
          <div className="grid grid-cols-12 gap-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div 
                className="col-span-12 md:col-span-9 space-y-6"
              >
                <div className="bg-white rounded-lg shadow-md border border-slate-200">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-6">Profile Settings</h3>
                    <form className="space-y-6" onSubmit={handleProfileSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">First Name</label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Last Name</label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Email</label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Phone</label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all duration-300"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div 
                className="col-span-12 md:col-span-9 space-y-6"
              >
                <div className="bg-white rounded-lg shadow-md border border-slate-200">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-6">Security Settings</h3>
                    {isLoadingPassword ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="ml-2 text-slate-600">Loading password information...</p>
                      </div>
                    ) : (
                      <form className="space-y-6" onSubmit={handlePasswordChange}>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Current Password</label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">New Password</label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all duration-300 justify-center"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Billing */}
            {activeTab === 'billing' && (
              <div 
                className="col-span-12 md:col-span-9 space-y-6"
              >
                <div className="bg-white rounded-lg shadow-md border border-slate-200">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-6">Payment Methods</h3>
                    
                    {isLoadingPaymentMethods ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      </div>
                    ) : editingPaymentMethod ? (
                      <form onSubmit={handleSavePaymentMethod} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              value={paymentFormData.accountName}
                              onChange={(e) => setPaymentFormData({...paymentFormData, accountName: e.target.value})}
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
                              value={paymentFormData.bankName}
                              onChange={(e) => setPaymentFormData({...paymentFormData, bankName: e.target.value})}
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
                              value={paymentFormData.accountNumber}
                              onChange={(e) => setPaymentFormData({...paymentFormData, accountNumber: e.target.value})}
                              required
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Routing Number
                            </label>
                            <input
                              type="text"
                              value={paymentFormData.routingNumber}
                              onChange={(e) => setPaymentFormData({...paymentFormData, routingNumber: e.target.value})}
                              required
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Account Type
                            </label>
                            <select
                              value={paymentFormData.accountType}
                              onChange={(e) => setPaymentFormData({...paymentFormData, accountType: e.target.value})}
                              required
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="checking">Checking</option>
                              <option value="savings">Savings</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={paymentFormData.isDefault}
                              onChange={(e) => setPaymentFormData({...paymentFormData, isDefault: e.target.checked})}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-slate-700">
                              Set as default payment method
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPaymentMethod(null)}
                            className="px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-md shadow-sm text-sm font-medium hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50"
                          >
                            {isSaving ? (
                              <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </div>
                            ) : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        {paymentMethods.length > 0 ? (
                          paymentMethods.map((method) => (
                            <div 
                              key={method.id} 
                              className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                  </div>
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
                                <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end">
                                  {!method.is_default && (
                                    <button 
                                      onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                      className="px-2 py-1 text-xs text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                                    >
                                      Set Default
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleEditPaymentMethod(method)}
                                    className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                    className="px-2 py-1 text-xs text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <p className="mt-2 text-slate-500">No payment methods found</p>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => router.push('/add-payment')}
                          className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md text-sm font-medium"
                        >
                          Add Payment Method
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
} 