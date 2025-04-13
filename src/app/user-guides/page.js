'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function UserGuides() {
  const guides = [
    {
      title: "Getting Started",
      description: "Learn the basics of creating an account and navigating the platform.",
      icon: "https://img.icons8.com/fluency/96/rocket.png",
      articles: [
        { title: "Creating Your Account", link: "#" },
        { title: "Setting Up Your Profile", link: "#" },
        { title: "Navigating the Dashboard", link: "#" },
        { title: "Understanding Event Types", link: "#" }
      ]
    },
    {
      title: "Finding Events",
      description: "Discover how to search, filter, and find events that match your interests.",
      icon: "https://img.icons8.com/fluency/96/search.png",
      articles: [
        { title: "Using the Search Feature", link: "#" },
        { title: "Filtering Events by Category", link: "#" },
        { title: "Saving Events for Later", link: "#" },
        { title: "Setting Location Preferences", link: "#" }
      ]
    },
    {
      title: "Booking Tickets",
      description: "Step-by-step guides on how to book tickets and manage your reservations.",
      icon: "https://img.icons8.com/fluency/96/ticket.png",
      articles: [
        { title: "Selecting Ticket Types", link: "#" },
        { title: "Payment Methods", link: "#" },
        { title: "Receiving Tickets", link: "#" },
        { title: "Cancellation Policy", link: "#" }
      ]
    },
    {
      title: "For Event Organizers",
      description: "Everything you need to know about creating and managing events.",
      icon: "https://img.icons8.com/fluency/96/conference.png",
      articles: [
        { title: "Creating an Event", link: "#" },
        { title: "Setting Up Ticket Tiers", link: "#" },
        { title: "Promoting Your Event", link: "#" },
        { title: "Managing Attendees", link: "#" }
      ]
    },
    {
      title: "Notifications & Updates",
      description: "Learn how to customize notifications and stay updated on events.",
      icon: "https://img.icons8.com/fluency/96/appointment-reminders.png",
      articles: [
        { title: "Email Notifications", link: "#" },
        { title: "Mobile Alerts", link: "#" },
        { title: "Calendar Integrations", link: "#" },
        { title: "Reminder Settings", link: "#" }
      ]
    },
    {
      title: "Account Management",
      description: "Guides on managing your account settings, privacy, and security.",
      icon: "https://img.icons8.com/fluency/96/user-settings.png",
      articles: [
        { title: "Updating Personal Information", link: "#" },
        { title: "Security Settings", link: "#" },
        { title: "Linking Social Accounts", link: "#" },
        { title: "Deleting Your Account", link: "#" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=2074&auto=format&fit=crop"
          alt="User Guides"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-600/60"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            User Guides
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-2xl text-lg"
          >
            Comprehensive guides to help you make the most of our platform
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search user guides..." 
              className="w-full px-5 py-4 bg-white rounded-lg shadow-md border border-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-12"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Guide Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guides.map((guide, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{guide.title}</h3>
                </div>
                <p className="text-gray-600 mb-5">{guide.description}</p>
                <ul className="space-y-2 mb-6">
                  {guide.articles.map((article, idx) => (
                    <li key={idx}>
                      <a 
                        href={article.link} 
                        className="flex items-center text-gray-700 hover:text-amber-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {article.title}
                      </a>
                    </li>
                  ))}
                </ul>
                <a 
                  href="#" 
                  className="inline-block text-amber-600 font-medium hover:text-amber-700 transition-colors"
                >
                  View all guides 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Quick answers to the most common questions about using our platform</p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">How do I create an account?</h3>
                <p className="text-gray-600">You can create an account by clicking the "Sign Up" button in the top right corner of the homepage. Follow the instructions to complete your registration using your email or social media accounts.</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Can I get a refund for a cancelled event?</h3>
                <p className="text-gray-600">Yes, if an event is cancelled by the organizer, you will automatically receive a full refund. For other circumstances, please refer to the specific event's refund policy or contact our support team.</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">How do I become an event organizer?</h3>
                <p className="text-gray-600">To become an event organizer, go to your profile settings and select "Become an Organizer." You'll need to provide some additional information about yourself or your organization before you can create events.</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept major credit cards, PayPal, and in some regions, Apple Pay and Google Pay. The available payment methods will be displayed during checkout.</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <p className="text-gray-600 mb-6">Still have questions?</p>
            <Link 
              href="/help-center" 
              className="inline-block bg-amber-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-md"
            >
              Visit Our Help Center
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 