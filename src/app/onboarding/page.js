'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';

export default function Onboarding() {
  return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1">
          <OnboardingContent />
        </div>
        <Footer />
      </div>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { } = useAuth();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
    preferences: {}
  });

  // Handle initial data loading
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get user from localStorage as fallback
        const storedUserData = localStorage.getItem('user');
        let localUser = null;
        
        if (storedUserData) {
          try {
            localUser = JSON.parse(storedUserData);
            console.log('Found user in localStorage:', localUser.email);
            
            // Pre-fill form with localStorage data
            setUserData({
              firstName: localUser.first_name || '',
              lastName: localUser.last_name || '',
              phoneNumber: localUser.phone_number || '',
              bio: '',
              preferences: {}
            });
          } catch (e) {
            console.error('Error parsing stored user data:', e);
          }
        }
        
        // Try to get user from Supabase Auth
        try {
          const { data, error } = await supabase.auth.getUser();
          
          if (!error && data && data.user) {
            const authUser = data.user;
            console.log('Found auth user:', authUser.email);
            
            // Try to get the user's data from the users table
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', authUser.email)
                .single();
                
              if (!userError && userData) {
                // Pre-fill form with user data
                setUserData({
                  firstName: userData.first_name || '',
                  lastName: userData.last_name || '',
                  phoneNumber: userData.phone || '',
                  bio: '',
                  preferences: {}
                });
                console.log('Pre-filled form with user data');
              }
            } catch (userErr) {
              console.log('Error fetching user data (continuing):', userErr.message);
            }
          } else if (error) {
            console.log('Auth session missing (continuing with localStorage):', error.message);
          }
        } catch (authErr) {
          console.log('Error getting auth user (continuing with localStorage):', authErr.message);
        }
        
        // Only show error if we've tried everything and still have no data
        if (!localUser && !userData.firstName && !userData.lastName) {
          console.log('No user data found, but allowing manual entry');
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        // Don't show error - let user fill out form manually
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Handle OAuth redirects
  const handleOAuthRedirect = useCallback(async () => {
      try {
        // Check if this is an OAuth redirect
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Error getting session:', error.message);
          return;
        }
        
        if (!data || !data.session) {
          console.log('No active session found');
          return;
        }
        
        const user = data.session.user;
        
        // Only handle OAuth users
        if (user.app_metadata?.provider) {
          console.log('Processing OAuth user:', user.email);
          
          // Get the user's data from the users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
            
          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }
          
          if (!userData) {
            console.error('No user found with email:', user.email);
            return;
          }
          
          // Store user data in localStorage
          const sessionUser = {
            id: userData.id,
            email: userData.email,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            phone_number: userData.phone || '',
            created_at: userData.created_at
          };
          
          localStorage.setItem('user', JSON.stringify(sessionUser));
          console.log('User data stored in localStorage');
          
          // Pre-fill form with user data
          setUserData({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            phoneNumber: userData.phone || '',
            bio: '',
            preferences: {}
          });
        }
      } catch (err) {
        console.error('Error handling OAuth redirect:', err);
      }
  }, []);
    
  useEffect(() => {
    handleOAuthRedirect();
  }, [handleOAuthRedirect]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleUserInfoSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user from localStorage
      const storedUserData = localStorage.getItem('user');
      if (!storedUserData) {
        throw new Error('No user data found. Please sign in again.');
      }

      const parsedUser = JSON.parse(storedUserData);
      console.log('Updating user:', parsedUser.id);

      // Update the user in the custom users table with the specific schema
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: userData.firstName.trim(),
          last_name: userData.lastName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', parsedUser.id);

      if (updateError) {
        console.error('Error updating user:', updateError.message);
        throw new Error('Failed to update your information. Please try again.');
      }

      console.log('Successfully updated user profile');

      // Update localStorage with new data
      const newUserData = {
        ...parsedUser,
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        phone_number: userData.phoneNumber.trim(), // Store in localStorage even if not in DB
        bio: userData.bio.trim(), // Store in localStorage even if not in DB
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(newUserData));
      console.log('User data updated in localStorage');
      
      // Proceed to the next step
      setStep(2);
    } catch (error) {
      console.error('Error updating user information:', error.message);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (category) => {
    if (interests.includes(category)) {
      setInterests(interests.filter(item => item !== category));
    } else {
      setInterests([...interests, category]);
    }
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      
      // Get user ID from localStorage as fallback
      const storedUserData = localStorage.getItem('user');
      let userId = null;
      let isTemporary = false;
      
      if (storedUserData) {
        try {
          const parsedUser = JSON.parse(storedUserData);
          userId = parsedUser.id;
          isTemporary = parsedUser.is_temporary === true;
          console.log('Found user ID from localStorage:', userId, isTemporary ? '(temporary)' : '');
          
          // Update localStorage with interests
          parsedUser.interests = interests.length > 0 ? interests.join(', ') : null;
          localStorage.setItem('user', JSON.stringify(parsedUser));
          console.log('Updated interests in localStorage');
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // Only try to update Supabase if we have a non-temporary user
      if (userId && !isTemporary) {
        // Try to get user from Supabase Auth
        try {
          const { data, error } = await supabase.auth.getUser();
          if (!error && data && data.user) {
            const authUser = data.user;
            userId = authUser.id; // Prefer auth user ID if available
            console.log('Found auth user:', authUser.email);
            
            // Try to update the user metadata in Supabase Auth
            if (interests.length > 0) {
              try {
                const { error: updateAuthError } = await supabase.auth.updateUser({
                  data: {
        interests: interests
                  }
                });
                
                if (updateAuthError) {
                  console.log('Error updating auth user interests (continuing):', updateAuthError.message);
                } else {
                  console.log('Successfully updated auth user interests');
                }
              } catch (updateErr) {
                console.log('Error updating auth user interests (continuing):', updateErr.message);
              }
            }
            
            // Try to update the profiles table
            try {
              const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({
                  interests: interests.length > 0 ? interests.join(', ') : null
                })
                .eq('id', userId);
              
              if (updateProfileError) {
                console.log('Error updating profile interests (continuing):', updateProfileError.message);
              } else {
                console.log('Successfully updated profile interests');
              }
            } catch (profileErr) {
              console.log('Error updating profile interests (continuing):', profileErr.message);
            }
          } else if (error) {
            console.log('Auth session missing (continuing with localStorage):', error.message);
          }
        } catch (authErr) {
          console.log('Error getting auth user (continuing with localStorage):', authErr.message);
        }
      } else {
        console.log('Using temporary user, skipping Supabase updates');
      }
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error in handleNext:', err);
      setError('An error occurred while saving your interests');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Navigate to dashboard instead of location
    router.push('/dashboard');
  };

  // Music categories
  const musicCategories = [
    'Blues & Jazz', 'Country', 'EDM', 'Hip Hop', 'RAP', 'Pop', 'R&B',
    'Electronic', 'Experimental', 'Psychedelic'
  ];

  // Sport categories
  const sportCategories = [
    'Football (soccer)', 'Basketball', 'Tennis', 'Baseball', 'Swimming',
    'Volleyball', 'Athletics', 'Rugby', 'Ice hockey'
  ];

  // Business categories
  const businessCategories = [
    'Trade Shows', 'Product Launches', 'Business Seminars',
    'Workshops', 'Business Awards', 'Investor Pitch Events'
  ];

  // Exhibition categories
  const exhibitionCategories = [
    'Oil paints', 'Canvas', 'Watercolor set', 'Sketchbook', 'Charcoal pencils',
    'Chalkboard', 'Pottery wheel', 'Colored pencils', 'Wood carving tools'
  ];

  // Render user info form (Step 1)
  const renderUserInfoForm = () => {
    return (
      <div className="flex flex-1">
        {/* Left side with questions */}
        <div className="w-1/2 pr-8">
          <div className="mb-4 text-sm text-gray-500">Tell us</div>
          
          {/* Progress Steps */}
          <div className="flex flex-col gap-8 mb-8">
            {/* Step 1 - User Info */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <h1 className="text-4xl font-bold">Your Information</h1>
            </div>

            {/* Step 2 - Interests */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              </div>
              <h2 className="text-2xl text-gray-400">What are your interests?</h2>
            </div>
            
            {/* Step 3 - Location */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              </div>
              <h2 className="text-2xl text-gray-400">What is your preferred location?</h2>
            </div>
          </div>
        </div>

        {/* Right side with form */}
        <div className="w-1/2">
          <div className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={userData.firstName}
                onChange={handleInputChange}
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={userData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={userData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1 (123) 456-7890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render interests selection (Step 2)
  const renderInterestsSelection = () => {
  return (
        <div className="flex flex-1">
          {/* Left side with questions */}
          <div className="w-1/2 pr-8">
            <div className="mb-4 text-sm text-gray-500">Tell us</div>
            
            {/* Progress Steps */}
            <div className="flex flex-col gap-8 mb-8">
            {/* Step 1 - User Info */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl text-gray-400">Your Information</h2>
            </div>

            {/* Step 2 - Interests */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <h1 className="text-4xl font-bold">What Are Your Interests?</h1>
              </div>

            {/* Step 3 - Location */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                </div>
                <h2 className="text-2xl text-gray-400">What is your preferred location?</h2>
              </div>
            </div>
          </div>

          {/* Right side with interest categories */}
          <div className="w-1/2">
            {/* Music Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <span className="text-gray-500">♫</span> Music
              </h3>
              <div className="flex flex-wrap gap-2">
                {musicCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleInterestToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      interests.includes(category)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sport Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <span className="text-gray-500">⚽</span> Sport
              </h3>
              <div className="flex flex-wrap gap-2">
                {sportCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleInterestToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      interests.includes(category)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <span className="text-gray-500">💼</span> Business
              </h3>
              <div className="flex flex-wrap gap-2">
                {businessCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleInterestToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      interests.includes(category)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Exhibition Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <span className="text-gray-500">🎨</span> Exhibition
              </h3>
              <div className="flex flex-wrap gap-2">
                {exhibitionCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleInterestToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      interests.includes(category)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
    );
  };

  // Effect to update userData fields when they change
  useEffect(() => {
    // This effect ensures userData fields are included as dependencies
  }, [userData.firstName, userData.lastName, userData.phoneNumber, userData.bio, userData.preferences]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm mx-4 sm:mx-8 mt-4">
          {error}
        </div>
      )}
      
      <div className="flex-1 p-4 sm:p-8 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Left side with questions */}
          <div className="w-full lg:w-1/2 lg:pr-8 mb-8 lg:mb-0">
            <div className="mb-4 text-sm text-gray-500">Tell us</div>
            
            {/* Progress Steps */}
            <div className="flex flex-col gap-4 sm:gap-8 mb-8">
              {step === 1 ? (
                <>
                  {/* Step 1 - User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black text-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold">Your Information</h1>
                  </div>

                  {/* Step 2 - Interests */}
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    </div>
                    <h2 className="text-xl sm:text-2xl text-gray-400">What are your interests?</h2>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 1 - User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl text-gray-400">Your Information</h2>
                  </div>

                  {/* Step 2 - Interests */}
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black text-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold">What Are Your Interests?</h1>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right side with form/interests */}
          <div className="w-full lg:w-1/2">
            {step === 1 ? (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+1 (123) 456-7890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {/* Music Section */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="flex items-center gap-2 text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                    <span className="text-gray-500">♫</span> Music
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {musicCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleInterestToggle(category)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm ${
                          interests.includes(category)
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sport Section */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="flex items-center gap-2 text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                    <span className="text-gray-500">⚽</span> Sport
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sportCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleInterestToggle(category)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm ${
                          interests.includes(category)
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Business Section */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="flex items-center gap-2 text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                    <span className="text-gray-500">💼</span> Business
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {businessCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleInterestToggle(category)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm ${
                          interests.includes(category)
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exhibition Section */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="flex items-center gap-2 text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                    <span className="text-gray-500">🎨</span> Exhibition
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {exhibitionCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleInterestToggle(category)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm ${
                          interests.includes(category)
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 sm:mt-8">
          {step === 1 ? (
            <>
              <button 
                onClick={() => setStep(2)}
                className="px-4 sm:px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm sm:text-base"
              >
                Skip
              </button>
              <button 
                onClick={handleUserInfoSubmit}
                disabled={loading}
                className="px-4 sm:px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-md disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? 'Saving...' : 'Next'}
              </button>
            </>
          ) : (
            <>
          <button 
            onClick={handleSkip}
                className="px-4 sm:px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm sm:text-base"
          >
            Skip
          </button>
          <button 
            onClick={handleNext}
                className="px-4 sm:px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-md text-sm sm:text-base"
          >
            Next
          </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 