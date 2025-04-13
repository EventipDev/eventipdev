'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function LocationSelection() {
  const router = useRouter();
  const { user, updateUserMetadata } = useAuth();
  const [location, setLocation] = useState('New York, NY');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    
    // Save location to user metadata
    if (user) {
      await updateUserMetadata({
        location: location
      });
    }
    
    // Redirect to dashboard
    router.push('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 p-4 sm:p-8 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Left side with questions */}
          <div className="w-full lg:w-1/2 lg:pr-8 mb-8 lg:mb-0">
            <div className="mb-4 text-sm text-gray-500">Tell us</div>
            
            {/* Progress Steps */}
            <div className="flex flex-col gap-4 sm:gap-8 mb-8">
              {/* Step 1 - Interests */}
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black text-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-400">What Are Your Interests?</h2>
              </div>

              {/* Step 2 - Location */}
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold">What is your preferred location?</h1>
              </div>
            </div>
          </div>

          {/* Right side with location input */}
          <div className="w-full lg:w-1/2">
            <div className="mb-6">
              <p className="text-base sm:text-lg mb-4">Looking for an event in</p>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm sm:text-base"
                  placeholder="Enter your location"
                />
              </div>
              <button className="mt-3 sm:mt-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m0 0H8m4 0h4m-4-8a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
                Add location
              </button>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 sm:mt-8">
          <Link 
            href="/onboarding"
            className="px-4 sm:px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back
          </Link>
          <button 
            onClick={handleFinish}
            disabled={loading}
            className="px-4 sm:px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-md flex items-center text-sm sm:text-base"
          >
            {loading ? 'Finishing...' : 'Finish'}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
} 