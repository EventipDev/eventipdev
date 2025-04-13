'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';

// Create a client component that uses useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get token and email from URL parameters
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      router.push('/signin');
    }
  }, [token, email, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Verify token and update password
      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('reset_token', token)
        .single();

      if (queryError || !user) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if token is expired
      const tokenExpiry = new Date(user.reset_token_expires);
      if (tokenExpiry < new Date()) {
        throw new Error('Reset token has expired. Please request a new password reset.');
      }

      // Update password and clear reset token
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: password,
          reset_token: null,
          reset_token_expires: null
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error('Error updating password');
      }

      setSuccess(true);

      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        router.push('/signin');
      }, 3000);

    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 text-amber-900">Set New Password</h1>
      <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
        Enter your new password below.
      </p>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 text-xs sm:text-sm">
          Password has been successfully reset. Redirecting to sign in...
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
        {/* New Password Input */}
        <div className="relative">
          <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all text-black text-sm sm:text-base"
            required
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-amber-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M3 3l18 18M10.94 6.08A6.002 6.002 0 0118 12c0 .34-.03.67-.09 1M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
              {!showPassword && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
            </svg>
          </button>
        </div>

        {/* Confirm Password Input */}
        <div className="relative">
          <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
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
  );
}

// Loading fallback component
function ResetPasswordLoading() {
  return (
    <div className="relative">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 text-amber-900">Set New Password</h1>
      <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
        Loading reset form...
      </p>
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function ResetPassword() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-8 md:py-16">
        <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md relative shadow-xl border border-amber-100/60">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl from-amber-50/80 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-12 sm:w-20 h-12 sm:h-20 bg-gradient-to-tr from-amber-50/50 to-transparent rounded-tr-full"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-400/20 rounded-xl blur opacity-30"></div>
          
          <Suspense fallback={<ResetPasswordLoading />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
      <Footer />
    </div>
  );
} 