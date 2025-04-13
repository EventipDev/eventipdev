'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminProtectedRoute({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is logged in as admin
    const checkAdmin = () => {
      try {
        const storedAdmin = localStorage.getItem('admin');
        if (storedAdmin) {
          const admin = JSON.parse(storedAdmin);
          if (admin && admin.isAdmin) {
            setAuthorized(true);
            setLoading(false);
            return;
          }
        }
        
        // Not authorized, redirect to login
        router.push('/admin/login');
      } catch (error) {
        console.error('Error checking admin authentication:', error);
        router.push('/admin/login');
      }
    };
    
    checkAdmin();
  }, [router]);

  // Show loading indicator while checking authorization
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authorized, render children
  return authorized ? children : null;
} 