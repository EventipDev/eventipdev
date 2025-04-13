'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import { motion } from 'framer-motion';
import Link from 'next/link';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const currentDate = new Date();

// Fallback mock events
const mockEvents = [
  {
    id: 1,
    title: 'Rock Revolt',
    time: '7:00 PM',
    date: new Date(2024, 2, 15),
    type: 'Music',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    id: 2,
    title: 'Tech Conference',
    time: '9:00 AM',
    date: new Date(2024, 2, 18),
    type: 'Conference',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 3,
    title: 'Art Exhibition',
    time: '3:00 PM',
    date: new Date(2024, 2, 20),
    type: 'Art',
    color: 'bg-purple-100 text-purple-800'
  }
];

// Map event categories to colors with gradients
const getCategoryColor = (category) => {
  const categoryColors = {
    'music': {
      bg: 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800',
      dot: 'bg-pink-500'
    },
    'conference': {
      bg: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
      dot: 'bg-blue-500'
    },
    'art': {
      bg: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800',
      dot: 'bg-purple-500'
    },
    'sports': {
      bg: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800',
      dot: 'bg-green-500'
    },
    'food': {
      bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800',
      dot: 'bg-yellow-500'
    },
    'business': {
      bg: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800',
      dot: 'bg-indigo-500'
    },
    'education': {
      bg: 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800',
      dot: 'bg-teal-500'
    },
    'health': {
      bg: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800',
      dot: 'bg-red-500'
    },
    'technology': {
      bg: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
      dot: 'bg-blue-500'
    },
    'other': {
      bg: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800',
      dot: 'bg-gray-500'
    }
  };
  
  return categoryColors[category?.toLowerCase()] || categoryColors['other'];
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

function CalendarContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [view, setView] = useState('month'); // month, week, day
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  // Toggle mobile menu function for the Sidebar
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Get user data from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, []);

  // Get user details from metadata
  const firstName = userData?.first_name || user?.user_metadata?.first_name || '';
  const lastName = userData?.last_name || user?.user_metadata?.last_name || '';
  const email = userData?.email || user?.email || '';
  const fullName = `${firstName} ${lastName}`.trim() || email || 'User';
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
    : (email?.charAt(0) || 'U');


  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Get the user ID from either Auth context or localStorage
        const userId = user?.id || userData?.id;
        
        if (!userId) {
          console.log('No user ID found, cannot fetch events');
          setEvents(mockEvents);
          return;
        }

        console.log('Fetching events for user ID:', userId);

        // Fetch events created by the current user
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            start_time,
            end_time,
            category,
            city,
            state,
            status,
            description,
            user_id
          `)
          .eq('user_id', userId)
          .order('event_date', { ascending: true });
          
        if (eventsError) throw eventsError;
        
        console.log('Fetched events for calendar:', eventsData);
        
        // Process events data
        const processedEvents = eventsData.map(event => {
          // Parse date
          let eventDate;
          try {
            eventDate = new Date(event.event_date);
          } catch (error) {
            console.error(`Error parsing date: ${event.event_date}`, error);
            eventDate = new Date(); // Fallback to current date
          }
          
          const categoryStyle = getCategoryColor(event.category);
          
          return {
            id: event.id,
            title: event.name,
            time: event.start_time || '12:00 PM',
            date: eventDate,
            type: event.category || 'Other',
            color: categoryStyle.bg,
            dotColor: categoryStyle.dot,
            location: event.city && event.state ? `${event.city}, ${event.state}` : (event.city || event.state || ''),
            description: event.description || 'No description available',
            status: event.status
          };
        });
        
        setEvents(processedEvents);
      } catch (error) {
        console.error('Error fetching events for calendar:', error.message);
        // Use mock data as fallback
        setEvents(mockEvents);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user, userData]);

  // Get calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = [];
    
    // Add previous month's days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i);
      daysInMonth.unshift({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      daysInMonth.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add next month's days
    const remainingDays = 42 - daysInMonth.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      daysInMonth.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return daysInMonth;
  };

  const calendarDays = getDaysInMonth(selectedDate);

  const getEventsForDate = (date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const handleCreateEvent = () => {
    router.push('/create-event');
  };

  const formatMonthYear = (date) => {
    return date.toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    });
  };


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Include Sidebar directly in the component */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Loading State - Centered */}
        {isLoading ? (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="mt-4 text-slate-600 font-medium text-center">Loading calendar...</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header - Improved responsive layout */}
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-8 py-4 space-y-4 sm:space-y-0">
                <div className="w-full sm:w-auto">
                  <div className="text-sm text-slate-500 mb-1">Calendar</div>
                  <h1 className="text-2xl font-semibold text-slate-800">Event Calendar</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <button 
                    onClick={handleCreateEvent}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Create Event</span>
                  </button>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
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
              </div>
            </header>

            <div className="p-4 sm:p-6 md:p-8">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                {/* Calendar Controls */}
                <motion.div 
                  className="bg-white rounded-xl shadow-md mb-6 overflow-hidden border border-slate-200"
                  variants={itemVariants}
                >
                  <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 gap-3 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <motion.button
                        onClick={() => setSelectedDate(new Date())}
                        className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Today
                      </motion.button>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <motion.button
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setSelectedDate(newDate);
                          }}
                          className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </motion.button>
                        <h2 className="text-sm sm:text-lg font-semibold text-slate-800">
                          {formatMonthYear(selectedDate)}
                        </h2>
                        <motion.button
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setSelectedDate(newDate);
                          }}
                          className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <motion.button
                        onClick={() => setView('month')}
                        className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                          view === 'month' 
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                        whileHover={view !== 'month' ? { scale: 1.05 } : {}}
                        whileTap={view !== 'month' ? { scale: 0.95 } : {}}
                      >
                        Month
                      </motion.button>
                      <motion.button
                        onClick={() => setView('week')}
                        className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                          view === 'week' 
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                        whileHover={view !== 'week' ? { scale: 1.05 } : {}}
                        whileTap={view !== 'week' ? { scale: 0.95 } : {}}
                      >
                        Week
                      </motion.button>
                      <motion.button
                        onClick={() => setView('day')}
                        className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                          view === 'day' 
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                        whileHover={view !== 'day' ? { scale: 1.05 } : {}}
                        whileTap={view !== 'day' ? { scale: 0.95 } : {}}
                      >
                        Day
                      </motion.button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="p-2 sm:p-4">
                    {/* Days of week */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-2 sm:mb-4">
                      {days.map(day => (
                        <div key={day} className="text-xs sm:text-sm font-medium text-slate-500 text-center">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-4">
                      {calendarDays.map(({ date, isCurrentMonth }, index) => {
                        const dayEvents = getEventsForDate(date);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const hasEvents = dayEvents.length > 0;

                        return (
                          <motion.div
                            key={index}
                            className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg border transition-all ${
                              isCurrentMonth ? 'bg-white' : 'bg-slate-50'
                            } ${isToday ? 'border-indigo-500 shadow-md' : 'border-slate-200'} 
                            ${hasEvents ? 'hover:shadow-md' : ''}`}
                            whileHover={hasEvents ? { scale: 1.02 } : {}}
                            variants={itemVariants}
                          >
                            <div className="text-right">
                              <span className={`inline-block rounded-full w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm ${
                                isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                              } ${isToday ? 'bg-indigo-500 text-white font-bold' : ''}`}>
                                {date.getDate()}
                              </span>
                            </div>
                            <div className="mt-1 sm:mt-2 space-y-1">
                              {dayEvents.slice(0, 2).map(event => (
                                <motion.div
                                  key={event.id}
                                  className={`text-xs p-1 sm:p-1.5 rounded-md shadow-sm truncate cursor-pointer relative`}
                                  style={{
                                    background: 'linear-gradient(to right, rgba(79, 70, 229, 0.1), rgba(59, 130, 246, 0.1))',
                                    color: '#4338ca'
                                  }}
                                  title={`${event.title} - ${event.time}${event.location ? ` - ${event.location}` : ''}`}
                                  whileHover={{ scale: 1.05 }}
                                  onMouseEnter={() => setHoveredEvent(event)}
                                  onMouseLeave={() => setHoveredEvent(null)}
                                >
                                  <div className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500`}></span>
                                    <span className="font-medium">{event.time}</span>
                                  </div>
                                  <div className="truncate text-[10px] sm:text-xs">{event.title}</div>
                                  
                                  {/* Event tooltip on hover */}
                                  {hoveredEvent?.id === event.id && (
                                    <motion.div 
                                      className="absolute z-10 left-0 sm:left-auto sm:right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg p-3 text-left border border-slate-200"
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <h4 className="font-bold text-slate-800">{event.title}</h4>
                                      <p className="text-xs text-slate-600 mt-1">{event.time}</p>
                                      {event.location && (
                                        <p className="text-xs text-slate-600 mt-1">
                                          <span className="font-medium">Location:</span> {event.location}
                                        </p>
                                      )}
                                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{event.description}</p>
                                    </motion.div>
                                  )}
                                </motion.div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-[10px] sm:text-xs text-slate-500 pl-1">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* Upcoming Events */}
                <motion.div 
                  className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200"
                  variants={itemVariants}
                >
                  <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                    <div className="text-indigo-500 bg-indigo-100 p-1.5 sm:p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Upcoming Events
                  </h3>
                  {events.length === 0 ? (
                    <motion.div 
                      className="text-center py-6 sm:py-8 bg-slate-50 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-slate-400 mb-2 sm:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-500 text-sm mb-3 sm:mb-4">No upcoming events found.</p>
                      <motion.button 
                        onClick={handleCreateEvent}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Create an Event
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {events
                        .filter(event => event.date >= new Date(new Date().setHours(0, 0, 0, 0)))
                        .sort((a, b) => a.date - b.date)
                        .slice(0, 5)
                        .map((event, index) => (
                          <motion.div 
                            key={event.id} 
                            className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
                              <span className="text-xs sm:text-sm font-bold">{event.date.getDate()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-medium text-slate-800 truncate">{event.title}</h4>
                              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 truncate">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="truncate">{event.date.toLocaleDateString()} at {event.time}</span>
                              </p>
                              {event.location && (
                                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 truncate">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="truncate">{event.location}</span>
                                </p>
                              )}
                            </div>
                            <span className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-indigo-100 text-indigo-800 shadow-sm whitespace-nowrap">
                              {event.type}
                            </span>
                          </motion.div>
                        ))
                      }
                      
                      {events.filter(event => event.date >= new Date(new Date().setHours(0, 0, 0, 0))).length > 5 && (
                        <motion.div 
                          className="text-center mt-3 sm:mt-4"
                          whileHover={{ scale: 1.05 }}
                        >
                          <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800 flex items-center gap-1 mx-auto transition-colors">
                            View all events
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export default function Calendar() {
  return (
    <ProtectedRoute>
      <CalendarContent />
    </ProtectedRoute>
  );
} 