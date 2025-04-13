'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../lib/supabase';

const Sidebar = forwardRef(function Sidebar(props, ref) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  // Use the isOpen prop from parent if provided
  useEffect(() => {
    if (props.isOpen !== undefined) {
      setIsMobileMenuOpen(props.isOpen);
    }
  }, [props.isOpen]);

  // Expose the toggleMobileMenu function to parent components
  useImperativeHandle(ref, () => ({
    toggleMobileMenu: () => setIsMobileMenuOpen(prev => !prev)
  }));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      // Use Supabase auth signOut for compatibility
      await supabase.auth.signOut();
      // Clear the user from localStorage
      localStorage.removeItem('user');
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
    {/* Mobile Menu Button - Only visible on mobile */}
    {props.isOpen === undefined && (
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 shadow-md flex flex-col z-50`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <a href={pathname} className="flex items-center">
            <div className="w-10 h-10">
              <img 
                src="/logo.png" 
                alt="Eventip Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="ml-3 text-xl font-bold">
              <span className="text-black">Event</span>
              <span className="text-red-600">Ip</span>
            </span>
          </a>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <Link 
            href="/" 
            className="flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors hover:bg-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="ml-3">Back to Home</span>
          </Link>

          <Link 
            href="/dashboard" 
            className={`flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors ${
              pathname === '/dashboard'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <span className="ml-3">Dashboard</span>
          </Link>

          <Link 
            href="/calendar" 
            className={`flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors ${
              pathname === '/calendar'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="ml-3">Calendar</span>
          </Link>

          <Link 
            href="/my-events" 
            className={`flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors ${
              pathname === '/my-events'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="ml-3">My Events</span>
          </Link>

          <Link 
            href="/private-events" 
            className={`flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors ${
              pathname === '/private-events'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="ml-3">Private Events</span>
          </Link>

          <Link 
            href="/revenue" 
            className={`flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors ${
              pathname === '/revenue'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-3">Revenue</span>
          </Link>

          <Link 
            href="/payment" 
            className={`flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors ${
              pathname === '/payment'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="ml-3">Payment</span>
          </Link>

          <Link 
            href="/messages" 
            className={`flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors ${
              pathname === '/messages'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="ml-3">Messages</span>
          </Link>

          <Link 
            href="/settings" 
            className={`flex items-center px-4 py-3 text-slate-600 rounded-lg transition-colors ${
              pathname === '/settings'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-sm'
                : 'hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="ml-3">Settings</span>
          </Link>
        </nav>

        {/* Sign Out Button */}
        <div className="px-4 py-4 border-t border-slate-200">
          <button 
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-red-600 rounded-lg transition-colors hover:bg-red-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="ml-3">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
});

export default Sidebar; 
