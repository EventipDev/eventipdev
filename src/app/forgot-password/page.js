'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      // First check if the user exists in our users table
      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();
      
      if (queryError || !user) {
        throw new Error('No account found with this email address');
      }

      // Generate a reset token (you might want to use a more secure method in production)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store the reset token in the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: resetTokenExpiry.toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error('Error generating reset token');
      }

      // In a real application, you would send an email with a reset link
      // For now, we'll just show the reset token (for demonstration)
      console.log('Reset token:', resetToken);
      
      setSuccess(true);
      
      // Redirect to reset password page after 3 seconds
      setTimeout(() => {
        router.push(`/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`);
      }, 3000);

    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to process password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-8 md:py-16">
        <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md relative shadow-xl border border-amber-100/60">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl from-amber-50/80 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-12 sm:w-20 h-12 sm:h-20 bg-gradient-to-tr from-amber-50/50 to-transparent rounded-tr-full"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-400/20 rounded-xl blur opacity-30"></div>
          
          <div className="relative">
            {/* Close Button */}
            <Link href="/signin" className="absolute right-0 top-0 text-gray-400 hover:text-amber-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>

            {/* Header */}
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 text-amber-900">Reset Password</h1>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 text-xs sm:text-sm">
                Password reset instructions have been sent to your email address. Redirecting...
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all text-black text-sm sm:text-base"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-400 text-white py-2 sm:py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>

            {/* Back to Sign In */}
            <p className="text-center mt-5 sm:mt-8 text-xs sm:text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/signin" className="text-amber-600 hover:text-amber-800 hover:underline transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 