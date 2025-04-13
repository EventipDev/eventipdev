'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function NotFound() {
  const [isClient, setIsClient] = useState(false);

  // Safely check if we're running in a browser
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {isClient && <Navbar />}
      
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="flex justify-center">
            <Image
              src="/404.svg"
              alt="Page not found"
              width={300}
              height={300}
              priority
            />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
          
          <p className="text-xl text-gray-600">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          
          <div className="pt-6">
            <Link href="/" className="px-6 py-3 bg-pink-600 text-white rounded-lg shadow-md hover:bg-pink-700 transition-colors inline-block">
              Return Home
            </Link>
          </div>
        </div>
      </main>
      
      {isClient && <Footer />}
    </div>
  );
} 