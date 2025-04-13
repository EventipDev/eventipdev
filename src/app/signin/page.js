'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('Checking credentials...');
      
      // Check credentials against users table
      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();
      
      if (queryError) {
        console.error('Login query error:', queryError);
        throw new Error('Invalid email or password');
      }

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password (in a real app, you should use proper password hashing)
      if (user.password !== password) {
        throw new Error('Invalid email or password');
      }

      console.log('Login successful for user:', user.email);

      // Store user data in localStorage for session management
      const sessionUser = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at
      };
      
      localStorage.setItem('user', JSON.stringify(sessionUser));
      
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      }
      
      console.log('Sign-in successful, redirecting to dashboard...');
      
      // Use a slight delay to ensure localStorage is set before redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      console.error('Sign-in error:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/signin`
        }
      });

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check for OAuth callback on component mount
  useEffect(() => {
    const checkOAuthSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError('Error checking authentication session. Please try again.');
          return;
        }
        
        if (!session || !session.user) {
          return;
        }
        
        const user = session.user;
        
        // Only handle Google OAuth users
        if (user.app_metadata?.provider === 'google') {
          console.log('Processing Google OAuth user for signin');
          
          try {
            // Check if user exists in our users table
            const { data: existingUser, error: queryError } = await supabase
              .from('users')
              .select('*')
              .eq('email', user.email)
              .single();
              
            if (queryError && queryError.code !== 'PGRST116') {
              console.error('Error checking for existing user:', queryError);
              setError('Error checking user account. Please try again.');
              return;
            }
              
            if (!existingUser) {
              setError('No account found with this Google email. Please sign up first.');
              return;
            }
            
            // Store user data in localStorage
            const sessionUser = {
              id: existingUser.id,
              email: existingUser.email,
              first_name: existingUser.first_name,
              last_name: existingUser.last_name,
              created_at: existingUser.created_at
            };
            
            localStorage.setItem('user', JSON.stringify(sessionUser));
            console.log('Google sign-in successful, redirecting...');
            
            // Use a slight delay to ensure localStorage is set before redirect
            setTimeout(() => {
              router.push('/dashboard');
            }, 100);
          } catch (err) {
            console.error('Error processing OAuth user:', err);
            setError('Failed to process Google sign in. Please try again.');
          }
        }
      } catch (err) {
        console.error('Error in OAuth session check:', err);
        setError('Failed to complete Google sign in. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkOAuthSession();
  }, [router]);

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
            <Link href="/" className="absolute right-0 top-0 text-gray-400 hover:text-amber-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>

            {/* Header */}
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 text-amber-900">Welcome back.</h1>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">Log in to your account</p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-6">
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
                  placeholder="example.email@gmail.com"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all text-black text-sm sm:text-base"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs sm:text-sm text-amber-600 hover:text-amber-800 hover:underline transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                  />
                  <span className="absolute w-8 sm:w-12 h-3 sm:h-4 bg-amber-100 opacity-40 rounded-full left-0 top-0 transform scale-0 origin-left transition-transform duration-300 peer-checked:scale-100"></span>
                </div>
                <label htmlFor="remember" className="ml-2 block text-xs sm:text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              {/* Sign In Button */}
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
                    Signing in...
                  </span>
                ) : 'Log in'}
              </button>
            </form>

            {/* Social Sign-In Options */}
            <div className="mt-6 sm:mt-8">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 sm:mx-4 text-gray-500 text-xs sm:text-sm">or continue with</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              
              <div className="flex space-x-2 sm:space-x-4 mt-3 sm:mt-4">
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex-1 bg-white border border-gray-200 rounded-lg p-2 sm:p-3 shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.5006 12.2332C22.5006 11.3699 22.4291 10.7399 22.2744 10.0865H12.2148V13.9832H18.1196C18.0006 14.9515 17.3577 16.4099 15.9291 17.3898L15.9096 17.5203L19.0902 19.935L19.3101 19.9565C21.3338 18.1249 22.5006 15.4298 22.5006 12.2332Z" fill="#4285F4"/>
                    <path d="M12.214 22.5C15.1068 22.5 17.5353 21.5666 19.3092 19.9566L15.9282 17.39C15.0235 18.0083 13.8092 18.4399 12.214 18.4399C9.38069 18.4399 6.97596 16.6083 6.11874 14.0766L5.99309 14.0871L2.68583 16.5954L2.64258 16.7132C4.40446 20.1433 8.0235 22.5 12.214 22.5Z" fill="#34A853"/>
                    <path d="M6.12096 14.0767C5.89476 13.4234 5.77358 12.7233 5.77358 12C5.77358 11.2767 5.89476 10.5767 6.10905 9.92337L6.10306 9.78423L2.75435 7.22839L2.64478 7.28667C1.91862 8.71002 1.50195 10.3083 1.50195 12C1.50195 13.6917 1.91862 15.29 2.64478 16.7133L6.12096 14.0767Z" fill="#FBBC05"/>
                    <path d="M12.214 5.55997C14.2259 5.55997 15.583 6.41163 16.3569 7.12335L19.3807 4.23C17.5236 2.53834 15.1069 1.5 12.214 1.5C8.02353 1.5 4.40447 3.85665 2.64258 7.28662L6.10686 9.92332C6.97598 7.39166 9.38073 5.55997 12.214 5.55997Z" fill="#EB4335"/>
                  </svg>
                </button>
                <button className="flex-1 bg-white border border-gray-200 rounded-lg p-2 sm:p-3 shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.6644 1.5C14.2806 1.5 13.3763 2.415 11.9994 2.415C10.5544 2.415 9.39562 1.5 7.33312 1.5C5.37562 1.5 3.23813 2.8575 1.91813 5.1075C0.0181253 8.3325 0.384375 14.355 3.84563 19.2225C5.04187 21 6.54187 22.9575 8.55187 22.9925C10.425 23.025 10.9406 21.63 11.9981 21.63C13.0556 21.63 13.515 23.025 15.4519 22.9925C17.4656 22.9575 19.0556 20.8425 20.2519 19.065C21.1519 17.7075 21.5181 17.0175 22.0844 15.36C18.1744 13.9425 17.3606 8.2275 21.2269 6.06C19.7325 3.9825 18.1331 1.5 16.6644 1.5Z" fill="black"/>
                  </svg>
                </button>
                <button className="flex-1 bg-white border border-gray-200 rounded-lg p-2 sm:p-3 shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12C0 17.31 3.435 21.795 8.205 23.385C8.805 23.49 9.03 23.13 9.03 22.815C9.03 22.53 9.015 21.585 9.015 20.58C6 21.135 5.22 19.845 4.98 19.17C4.845 18.825 4.26 17.76 3.75 17.475C3.33 17.25 2.73 16.695 3.735 16.68C4.68 16.665 5.355 17.55 5.58 17.91C6.66 19.725 8.385 19.215 9.075 18.9C9.18 18.12 9.495 17.595 9.84 17.295C7.17 16.995 4.38 15.96 4.38 11.37C4.38 10.065 4.845 8.985 5.61 8.145C5.49 7.845 5.07 6.615 5.73 4.965C5.73 4.965 6.735 4.65 9.03 6.195C9.99 5.925 11.01 5.79 12.03 5.79C13.05 5.79 14.07 5.925 15.03 6.195C17.325 4.635 18.33 4.965 18.33 4.965C18.99 6.615 18.57 7.845 18.45 8.145C19.215 8.985 19.68 10.05 19.68 11.37C19.68 15.975 16.875 16.995 14.205 17.295C14.64 17.67 15.015 18.39 15.015 19.515C15.015 21.12 15 22.41 15 22.815C15 23.13 15.225 23.505 15.825 23.385C18.2072 22.5807 20.2772 21.0497 21.7437 19.0074C23.2101 16.965 23.9993 14.5143 24 12C24 5.37 18.63 0 12 0Z" fill="black"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center mt-5 sm:mt-8 text-xs sm:text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-amber-600 hover:text-amber-800 hover:underline transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


