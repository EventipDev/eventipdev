'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import supabase from '../lib/supabase';
import Link from 'next/link';

export default function Messages() {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Debug mobile menu state
  useEffect(() => {
    console.log('Mobile menu state changed:', isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.mobile-menu-button') && !e.target.closest('.sidebar-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMobileMenuOpen]);

  // Ensure mobile menu is closed on initial load
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Get user data from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
      
      // Set loading to false after data is loaded
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      setIsLoading(false);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for existing conversation or create one
  useEffect(() => {
    const fetchOrCreateConversation = async () => {
      try {
        if (!user?.id && !userData?.id) {
          console.log('No user ID available yet, waiting...');
          return;
        }
        
        const userId = user?.id || userData?.id;
        console.log('Using user ID:', userId);
        
        // Check if there's an existing conversation
        const { data: existing, error: queryError } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', userId)
          .single();
          
        if (queryError && queryError.code !== 'PGRST116') {
          console.error('Error checking for existing conversation:', queryError);
          return;
        }
        
        if (existing) {
          console.log('Found existing conversation:', existing.id);
          // Found existing conversation
          setConversationId(existing.id);
          
          // Fetch messages for this conversation
          fetchConversationMessages(existing.id);
        } else {
          console.log('No existing conversation found, creating new one');
          // Create a new conversation
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({ user_id: userId })
            .select('id')
            .single();
            
          if (createError) {
            console.error('Error creating conversation:', createError);
            return;
          }
          
          console.log('Created new conversation:', newConv.id);
          setConversationId(newConv.id);
          
          // Default welcome message
          setMessages([
            {
              id: 'welcome',
              sender: 'Support Team',
              avatar: '/avatars/support.jpg',
              content: 'Hello! Welcome to EventIP support. How can I help you today?',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'received'
            }
          ]);
        }
      } catch (error) {
        console.error('Error in fetch/create conversation:', error);
      }
    };
    
    fetchOrCreateConversation();
  }, [user, userData]);
  
  // Function to fetch conversation messages
  const fetchConversationMessages = async (convId) => {
    try {
      console.log('Fetching messages for conversation:', convId);
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Found', data.length, 'messages');
        // Format the messages for display
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          sender: msg.sender_type === 'user' ? 'You' : 'Support Team',
          avatar: msg.sender_type === 'user' ? null : '/avatars/support.jpg',
          content: msg.message,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: msg.sender_type === 'user' ? 'sent' : 'received'
        }));
        
        setMessages(formattedMessages);
      } else {
        console.log('No messages found, setting welcome message');
        // No messages yet, set default welcome message
        setMessages([
          {
            id: 'welcome',
            sender: 'Support Team',
            avatar: '/avatars/support.jpg',
            content: 'Hello! Welcome to EventIP support. How can I help you today?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'received'
          }
        ]);
      }
    } catch (error) {
      console.error('Error in fetchConversationMessages:', error);
    }
  };

  // Get user details from metadata
  const firstName = userData?.first_name || user?.user_metadata?.first_name || '';
  const lastName = userData?.last_name || user?.user_metadata?.last_name || '';
  const email = userData?.email || user?.email || '';
  const fullName = `${firstName} ${lastName}`.trim() || email || 'User';
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
    : (email?.charAt(0) || 'U');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;
    
    // Create a temporary message to show immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: 'You',
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'sent'
    };
    
    // Add to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Store the message text and clear input
    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      const userId = user?.id || userData?.id;
      
      if (!userId) {
        console.error('User ID not available');
        return;
      }
      
      console.log('Sending message to conversation:', conversationId);
      // Add the message to the conversations_messages table
      const { error: msgError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          sender_id: userId,
          message: messageText
        });
        
      if (msgError) {
        console.error('Error saving message:', msgError);
      }
      
      // Update the last_message_at timestamp on the conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
        
      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;
    
    console.log('Setting up real-time subscription for conversation:', conversationId);
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
          const userId = user?.id || userData?.id;
          
          // Skip if this is a message from the user (we already added it)
          if (payload.new.sender_type === 'user' && payload.new.sender_id === userId) {
            return;
          }
          
          console.log('Received new message via subscription:', payload.new);
          // Format and add the new message to the chat
          const newMessage = {
            id: payload.new.id,
            sender: 'Support Team',
            avatar: '/avatars/support.jpg',
            content: payload.new.message,
            time: new Date(payload.new.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            type: 'received'
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();
      
    return () => {
      if (subscription) {
        console.log('Removing subscription for conversation:', conversationId);
        supabase.removeChannel(subscription);
      }
    };
  }, [conversationId, user, userData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Mobile sidebar */}
      <div 
        className={`md:hidden fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} z-30 transition duration-300 ease-in-out w-64 sidebar-container`}
      >
        <Sidebar isOpen={isMobileMenuOpen} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center px-4 sm:px-8 py-4">
            <div className="flex items-center">
              {/* Hamburger menu for mobile */}
              <button 
                className="mobile-menu-button md:hidden mr-4 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-100 relative z-40"
                onClick={() => {
                  console.log('Button clicked, current state:', isMobileMenuOpen);
                  setIsMobileMenuOpen(prev => !prev);
                }}
                aria-label="Toggle mobile menu"
                style={{ touchAction: 'manipulation' }}
              >
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <div>
                <div className="text-sm text-slate-500 mb-1">Messages</div>
                <h1 className="text-2xl font-semibold text-slate-800">Support Chat</h1>
              </div>
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

        <div className="flex flex-col h-[calc(100vh-73px)]">
          {/* Chat Header */}
          <div className="p-4 bg-white border-b border-slate-200 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-medium shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div>
                <h2 className="text-lg font-medium text-slate-900">EventIP Support</h2>
                <p className="text-sm text-slate-500">
                  Online • Typically replies within 10 minutes
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`flex items-end gap-2 max-w-[70%] ${message.type === 'sent' ? 'flex-row-reverse' : ''}`}>
                  {message.type === 'received' && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white font-medium shadow-md flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                  )}
                  <div className={`rounded-lg p-3 ${
                    message.type === 'sent'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'sent' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
              <button
                type="button"
                className="text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 disabled:opacity-50 transition-all duration-300 shadow-md"
                disabled={!newMessage.trim() || !conversationId}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 