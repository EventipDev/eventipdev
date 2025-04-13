'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();
  
  // Redirect to admin login page
  useEffect(() => {
    const checkAdmin = () => {
      if (typeof window !== 'undefined') {
        try {
          const adminData = localStorage.getItem('admin');
          
          if (adminData) {
            const admin = JSON.parse(adminData);
            if (admin && admin.isAdmin) {
              router.push('/admin/dashboard');
              return;
            }
          }
          
          // If we get here, user is not authenticated as admin
          router.push('/admin/login');
        } catch (error) {
          console.error('Error checking admin authentication:', error);
          router.push('/admin/login');
        }
      }
    };
    
    const timer = setTimeout(() => {
      checkAdmin();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Redirecting to admin panel...</p>
      </div>
    </div>
  );
} 