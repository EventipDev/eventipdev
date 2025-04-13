'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabase';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';

function AdminMessagesContent() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Toggle sidebar visibility (for mobile)
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Get admin data from localStorage
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      try {
        setAdminData(JSON.parse(storedAdmin));
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
  }, []);

  // Automatically hide sidebar on mobile when a user is selected
  useEffect(() => {
    if (selectedUser && window.innerWidth < 768) {
      setSidebarVisible(false);
    }
  }, [selectedUser]);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial state
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch conversation when a user is selected
  useEffect(() => {
    if (!selectedUser || !adminData) return;

    const fetchOrCreateConversation = async () => {
      try {
        // Get or create conversation
        const { data: conversation, error: convError } = await supabase.rpc(
          'get_or_create_conversation',
          {
            p_user_id: selectedUser.id,
            p_admin_id: adminData.id
          }
        );

        if (convError) throw convError;
        setConversationId(conversation);

        // Fetch messages for this conversation
        fetchMessages(conversation);
      } catch (error) {
        console.error('Error getting/creating conversation:', error);
      }
    };

    fetchOrCreateConversation();
  }, [selectedUser, adminData]);

  // Fetch messages for a conversation
  const fetchMessages = async (convId) => {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select(`
          id,
          sender_type,
          sender_id,
          message,
          is_read,
          created_at
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Scroll to bottom of messages
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Mark messages as read if they were sent by the user
      const unreadMessages = data?.filter(
        m => m.sender_type === 'user' && !m.is_read
      ) || [];

      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(m => m.id);
        await supabase
          .from('conversation_messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !adminData) return;

    setSendingMessage(true);
    try {
      // Insert the new message
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'admin',
          sender_id: adminData.id,
          message: newMessage.trim()
        });

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Clear the input and refetch messages
      setNewMessage('');
      fetchMessages(conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`conversation_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Only add the message if it's not already in the list
          const existingMessage = messages.find(m => m.id === payload.new.id);
          if (!existingMessage) {
            setMessages(prevMessages => [...prevMessages, payload.new]);
            scrollToBottom();

            // Mark as read if it's from user
            if (payload.new.sender_type === 'user') {
              supabase
                .from('conversation_messages')
                .update({ is_read: true })
                .eq('id', payload.new.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId, messages]);

  return (
    <div className="flex h-[calc(100vh-72px)] relative bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Users Sidebar */}
      <div className={`${sidebarVisible ? 'block' : 'hidden'} md:block w-full md:w-72 bg-white shadow-lg border-r border-gray-200 overflow-y-auto absolute md:relative z-10`}>
        <div className="sticky top-0 bg-white px-4 py-4 border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Conversations</h2>
            <button onClick={() => setSidebarVisible(false)} className="md:hidden p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Select a user to chat with</p>
          {/* Back to Dashboard Button */}
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 w-full mt-3 px-4 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg shadow-sm hover:bg-indigo-100 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        
        <div className="relative">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li 
                  key={user.id}
                  className={`hover:bg-indigo-50 transition-colors duration-200 cursor-pointer ${selectedUser?.id === user.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium shadow-md">
                          {user.first_name?.charAt(0) || ''}
                          {user.last_name?.charAt(0) || ''}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              
              {users.length === 0 && (
                <li className="px-4 py-8 text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="font-medium">No users found</p>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center shadow-sm sticky top-0 z-10">
              <button 
                onClick={toggleSidebar} 
                className="mr-3 md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-shrink-0 mr-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium shadow-md">
                  {selectedUser.first_name?.charAt(0) || ''}
                  {selectedUser.last_name?.charAt(0) || ''}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-12 py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-700">No messages yet</h3>
                  <p className="mt-1">Start the conversation now!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 shadow-sm ${
                        message.sender_type === 'admin'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm md:text-base">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_type === 'admin' ? 'text-indigo-200' : 'text-gray-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-inner">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className={`px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-full hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm md:text-base transition-all duration-200 ${
                    !newMessage.trim() || sendingMessage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="flex items-center">
                      <span>Send</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
              {!sidebarVisible && (
                <button 
                  onClick={toggleSidebar}
                  className="mb-6 inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Show Users
                </button>
              )}
              <svg 
                className="mx-auto h-20 w-20 text-indigo-500 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Conversation</h3>
              <p className="text-gray-600 mb-1">
                Select a user from the list to start a conversation.
              </p>
              <p className="text-xs text-gray-500">
                Your messages will appear here after selection.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <AdminProtectedRoute>
      <AdminMessagesContent />
    </AdminProtectedRoute>
  );
} 