'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function HelpCenter() {
  const [activeCategory, setActiveCategory] = useState('general');
  
  const categories = [
    { id: 'general', name: 'General' },
    { id: 'account', name: 'Account' },
    { id: 'events', name: 'Events' },
    { id: 'tickets', name: 'Tickets' },
    { id: 'payments', name: 'Payments' },
    { id: 'organizers', name: 'For Organizers' }
  ];
  
  const faqs = {
    general: [
      {
        question: "What is Event IP?",
        answer: "Event IP is a platform that helps you discover, book, and attend events in your area. From concerts and sports events to workshops and conferences, we connect event-goers with experiences they'll love."
      },
      {
        question: "How do I contact customer support?",
        answer: "You can contact our customer support team through the 'Contact Us' page, by emailing support@eventip.com, or by using the live chat feature available on the bottom right of every page when you're logged in."
      },
      {
        question: "Is Event IP available in my country?",
        answer: "Event IP is currently available in most countries worldwide. During registration, you'll be notified if our services aren't available in your region yet."
      },
      {
        question: "Are there mobile apps available?",
        answer: "Yes, Event IP is available as a mobile app for both iOS and Android devices. You can download them from the App Store or Google Play Store."
      }
    ],
    account: [
      {
        question: "How do I create an account?",
        answer: "You can create an account by clicking the 'Sign Up' button in the top right corner of our homepage. You can register using your email address or through your social media accounts."
      },
      {
        question: "How do I reset my password?",
        answer: "Click on 'Login' and then 'Forgot Password'. Enter the email address associated with your account, and we'll send you a password reset link."
      },
      {
        question: "Can I have multiple accounts?",
        answer: "We recommend having only one account per person. Having multiple accounts may lead to confusion with tickets and bookings."
      },
      {
        question: "How do I delete my account?",
        answer: "You can delete your account by going to Account Settings > Privacy & Security > Delete Account. Please note that this action is irreversible."
      }
    ],
    events: [
      {
        question: "How can I find events near me?",
        answer: "Use our search feature and apply location filters to discover events in your area. You can also enable location services to automatically see local events."
      },
      {
        question: "Can I save events for later?",
        answer: "Yes, you can bookmark events by clicking the 'Save' icon on any event card. You can view all saved events in your profile under 'Saved Events'."
      },
      {
        question: "How do I share an event with friends?",
        answer: "Each event has social sharing buttons that allow you to share events via social media, messaging apps, or email."
      },
      {
        question: "Are there age restrictions for events?",
        answer: "Age restrictions vary by event. Check the event details page for specific age requirements set by the event organizer."
      }
    ],
    tickets: [
      {
        question: "How do I receive my tickets?",
        answer: "After purchase, tickets are delivered to your email address and are also available in your account under 'My Tickets'. Most tickets have QR codes that will be scanned at the venue."
      },
      {
        question: "Can I transfer my ticket to someone else?",
        answer: "Many tickets can be transferred to another user. Go to 'My Tickets', select the ticket you want to transfer, and click 'Transfer Ticket'."
      },
      {
        question: "What if I lost my ticket?",
        answer: "Don't worry! You can always access your tickets by logging into your account and going to 'My Tickets'. From there, you can download or show your ticket again."
      },
      {
        question: "Can I get a refund if I can't attend an event?",
        answer: "Refund policies vary by event. Check the specific event's refund policy in the event details page or contact the event organizer directly."
      }
    ],
    payments: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept major credit/debit cards, PayPal, Apple Pay, and Google Pay. Available payment methods may vary by region."
      },
      {
        question: "Is my payment information secure?",
        answer: "Yes, all payment transactions are encrypted and processed securely. We do not store your complete credit card information on our servers."
      },
      {
        question: "Why was my payment declined?",
        answer: "Payments can be declined for various reasons including insufficient funds, incorrect card information, or security measures by your bank. Try using a different payment method or contact your bank."
      },
      {
        question: "How do I get an invoice for my purchase?",
        answer: "You can download an invoice for any purchase from your account under 'Purchase History'. Select the relevant transaction and click 'Download Invoice'."
      }
    ],
    organizers: [
      {
        question: "How do I create an event?",
        answer: "To create an event, you need to have an organizer account. Go to 'Create Event' in your dashboard and follow the step-by-step instructions."
      },
      {
        question: "What fees does Event IP charge organizers?",
        answer: "Event IP charges a percentage of ticket sales plus a small processing fee per ticket. Full details can be found on our 'Organizer Pricing' page."
      },
      {
        question: "How do I manage attendees?",
        answer: "You can manage attendees through your event dashboard. View attendee lists, check in attendees at the venue, send announcements, and more."
      },
      {
        question: "When do I receive payment for ticket sales?",
        answer: "Payments are typically processed within 5-7 business days after your event has concluded. For events with high ticket volumes, you may qualify for early payouts."
      }
    ]
  };

  const supportTopics = [
    {
      icon: "📝",
      title: "Check our Guides",
      description: "Browse through comprehensive guides and tutorials",
      link: "/user-guides",
      linkText: "View Guides"
    },
    {
      icon: "📞",
      title: "Contact Support",
      description: "Get assistance from our dedicated support team",
      link: "/contact-us",
      linkText: "Contact Us"
    },
    {
      icon: "💬",
      title: "Live Chat",
      description: "Chat with our support agents in real-time",
      link: "#",
      linkText: "Start Chat"
    },
    {
      icon: "📧",
      title: "Email Support",
      description: "Email us with your questions or concerns",
      link: "mailto:support@eventip.com",
      linkText: "Email Us"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Help Center"
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
            Help Center
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-2xl text-lg"
          >
            Find answers to your questions and get the support you need
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
              placeholder="Search for help..." 
              className="w-full px-5 py-4 bg-white rounded-lg shadow-md border border-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-12"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-16">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Frequently Asked Questions</h2>
            
            {/* Category Tabs */}
            <div className="flex flex-wrap border-b border-gray-200 mb-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 mr-2 mb-2 rounded-t-lg text-sm font-medium transition-colors ${
                    activeCategory === category.id 
                      ? 'bg-amber-100 text-amber-800 border-b-2 border-amber-600' 
                      : 'text-gray-600 hover:text-amber-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {/* FAQ Content */}
            <div className="space-y-6">
              {faqs[activeCategory].map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-5 hover:border-amber-200 transition-colors">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Support Options */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Need More Help?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportTopics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{topic.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{topic.title}</h3>
                <p className="text-gray-600 mb-4">{topic.description}</p>
                <a 
                  href={topic.link} 
                  className="inline-block text-amber-600 font-medium hover:text-amber-700 transition-colors"
                >
                  {topic.linkText}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Community Support */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Join Our Community</h2>
                <p className="text-amber-100 mb-6 max-w-xl">
                  Connect with other users, share experiences, and get community support from fellow event enthusiasts and organizers.
                </p>
                <a 
                  href="#" 
                  className="inline-block bg-white text-amber-600 px-6 py-3 rounded-lg font-medium hover:bg-amber-50 transition-colors shadow-md"
                >
                  Join Community Forum
                </a>
              </div>
              <div className="w-full md:w-1/3 max-w-xs">
                <div className="relative aspect-square">
                  <Image
                    src="https://img.freepik.com/free-vector/online-community-illustration_24877-52543.jpg"
                    alt="Community"
                    width={300}
                    height={300}
                    className="object-cover rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 