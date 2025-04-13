'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NewsUpdates() {
  const [activeCategory, setActiveCategory] = useState('all');
  
  // News categories
  const categories = [
    { id: 'all', name: 'All News' },
    { id: 'company', name: 'Company Updates' },
    { id: 'features', name: 'New Features' },
    { id: 'events', name: 'Events Industry' },
    { id: 'guides', name: 'Tips & Guides' }
  ];
  
  // Featured news item
  const featuredNews = {
    id: 1,
    title: "Event IP Launches Revolutionary AI-Powered Event Matching",
    excerpt: "Our new AI technology helps attendees discover events that perfectly match their interests and preferences, creating more meaningful experiences.",
    image: "https://img.freepik.com/free-vector/ai-technology-brain-background-vector-digital-transformation-concept_53876-117812.jpg",
    date: "June 15, 2023",
    category: "features",
    author: {
      name: "The Innovator",
      position: "Chief Technology Officer",
      image: "https://randomuser.me/api/portraits/men/22.jpg"
    }
  };
  
  // News articles
  const newsArticles = [
    {
      id: 2,
      title: "Event IP Expands to 10 New Countries",
      excerpt: "We're excited to announce our platform is now available in 10 additional countries across Europe and Asia, bringing our total global presence to 45 countries.",
      image: "https://img.freepik.com/free-vector/global-network-connection-world-map-concept_1017-32397.jpg",
      date: "May 28, 2023",
      category: "company",
      author: {
        name: "The Visionary",
        position: "Chief Executive Officer",
        image: "https://randomuser.me/api/portraits/men/41.jpg"
      }
    },
    {
      id: 3,
      title: "New Mobile App Features: Offline Ticket Access and AR Venue Navigation",
      excerpt: "Our latest mobile app update includes the ability to access tickets offline and AR-powered venue navigation to help attendees find their way around large event spaces.",
      image: "https://img.freepik.com/free-vector/augmented-reality-concept-illustration_114360-3758.jpg",
      date: "May 12, 2023",
      category: "features",
      author: {
        name: "The Innovator",
        position: "Chief Technology Officer",
        image: "https://randomuser.me/api/portraits/men/22.jpg"
      }
    },
    {
      id: 4,
      title: "Post-Pandemic Events Industry: Trends and Insights for 2023",
      excerpt: "Our analysis of the events industry shows significant growth and adaptation following the pandemic, with hybrid events continuing to be popular alongside in-person gatherings.",
      image: "https://img.freepik.com/free-photo/business-people-meeting-office-working_23-2148908922.jpg",
      date: "April 30, 2023",
      category: "events",
      author: {
        name: "The Connector",
        position: "Head of Internal & External Affairs",
        image: "https://randomuser.me/api/portraits/men/35.jpg"
      }
    },
    {
      id: 5,
      title: "Partnership Announcement: Event IP Teams Up with Global Venues Network",
      excerpt: "We're thrilled to announce our strategic partnership with Global Venues Network, bringing 500+ premium venues onto our platform worldwide.",
      image: "https://img.freepik.com/free-photo/two-businessman-shaking-hands_53876-30568.jpg",
      date: "April 15, 2023",
      category: "company",
      author: {
        name: "The Connector",
        position: "Head of Internal & External Affairs",
        image: "https://randomuser.me/api/portraits/men/35.jpg"
      }
    },
    {
      id: 6,
      title: "How to Promote Your Event: 10 Proven Strategies",
      excerpt: "Event promotion can be challenging, but these ten proven strategies will help you maximize attendance and create buzz around your next event.",
      image: "https://img.freepik.com/free-vector/digital-marketing-concept-illustration_114360-6241.jpg",
      date: "April 8, 2023",
      category: "guides",
      author: {
        name: "The Storyteller",
        position: "Chief Marketing Officer",
        image: "https://randomuser.me/api/portraits/women/63.jpg"
      }
    },
    {
      id: 7,
      title: "Event IP Secures $25M in Series B Funding",
      excerpt: "This new round of funding will help us accelerate product development, expand to new markets, and enhance our AI-powered event discovery features.",
      image: "https://img.freepik.com/free-photo/business-man-holding-dollar-bills-investment-concept_53876-104485.jpg",
      date: "March 22, 2023",
      category: "company",
      author: {
        name: "The Visionary",
        position: "Chief Executive Officer",
        image: "https://randomuser.me/api/portraits/men/41.jpg"
      }
    },
    {
      id: 8,
      title: "The Future of Ticketing: Blockchain and NFT Integration",
      excerpt: "We're exploring how blockchain technology and NFTs can revolutionize event ticketing, reducing fraud and creating new possibilities for event memorabilia.",
      image: "https://img.freepik.com/premium-vector/blockchain-background-with-isometric-blocks-connection_116838-901.jpg",
      date: "March 15, 2023",
      category: "features",
      author: {
        name: "The Innovator",
        position: "Chief Technology Officer",
        image: "https://randomuser.me/api/portraits/men/22.jpg"
      }
    },
    {
      id: 9,
      title: "5 Tips for Creating Accessible Events",
      excerpt: "Make your events inclusive for everyone with these essential tips for improving accessibility and accommodating attendees with different needs.",
      image: "https://img.freepik.com/free-photo/diverse-people-sitting-seminar_53876-104321.jpg",
      date: "March 3, 2023",
      category: "guides",
      author: {
        name: "The Protector",
        position: "Head of Legal",
        image: "https://randomuser.me/api/portraits/women/44.jpg"
      }
    }
  ];
  
  // Filter news articles based on active category
  const filteredArticles = activeCategory === 'all' 
    ? newsArticles 
    : newsArticles.filter(article => article.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"
          alt="News & Updates"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-600/60"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            News & Updates
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-2xl text-lg"
          >
            Stay up to date with the latest news, features, and industry insights
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-5 py-2 m-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.id 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Featured News (only show on 'all' or when matches the category) */}
        {(activeCategory === 'all' || activeCategory === featuredNews.category) && (
          <div className="mb-16">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-[300px] lg:h-full">
                  <Image
                    src={featuredNews.image}
                    alt={featuredNews.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Featured
                  </div>
                </div>
                <div className="p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-3">
                      <span className="text-sm text-gray-500">{featuredNews.date}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-amber-600">
                        {categories.find(c => c.id === featuredNews.category)?.name || 'Company Updates'}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{featuredNews.title}</h2>
                    <p className="text-gray-600 mb-6">{featuredNews.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                        <Image 
                          src={featuredNews.author.image}
                          alt={featuredNews.author.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{featuredNews.author.name}</p>
                        <p className="text-sm text-gray-500">{featuredNews.author.position}</p>
                      </div>
                    </div>
                    <button
                      className="inline-block bg-gray-300 text-gray-600 px-5 py-2 rounded-lg font-medium cursor-not-allowed"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* News Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <span className="text-sm text-gray-500">{article.date}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-amber-600">
                    {categories.find(c => c.id === article.category)?.name || 'Company Updates'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{article.title}</h3>
                <p className="text-gray-600 mb-6 line-clamp-3">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mr-2">
                      <Image 
                        src={article.author.image}
                        alt={article.author.name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-700">{article.author.name}</p>
                  </div>
                  <button
                    className="text-gray-400 font-medium cursor-not-allowed"
                  >
                    Read More
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No articles found</h3>
            <p className="text-gray-600">There are no articles in this category yet. Please check back later.</p>
          </div>
        )}
        
        {/* Pagination */}
        {filteredArticles.length > 0 && (
          <div className="flex justify-center mt-16">
            <nav className="flex items-center">
              <button className="px-4 py-2 mr-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1 mx-1 rounded text-white bg-amber-600 font-medium">1</button>
              <button className="px-3 py-1 mx-1 rounded text-gray-700 hover:bg-gray-100">2</button>
              <button className="px-3 py-1 mx-1 rounded text-gray-700 hover:bg-gray-100">3</button>
              <span className="mx-2 text-gray-500">...</span>
              <button className="px-3 py-1 mx-1 rounded text-gray-700 hover:bg-gray-100">8</button>
              <button className="px-4 py-2 ml-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        )}
        
        {/* Newsletter Signup */}
        <div className="mt-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Subscribe to Our Newsletter</h2>
                <p className="text-amber-100 mb-6 max-w-xl">
                  Get the latest news, updates, and event industry insights delivered directly to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row">
                  <input 
                    type="email" 
                    placeholder="Your email address" 
                    className="px-4 py-3 rounded-lg mb-3 sm:mb-0 sm:mr-3 sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-amber-500 flex-grow"
                  />
                  <button 
                    type="button" 
                    className="bg-gray-900 text-white px-6 py-3 rounded-lg sm:rounded-l-none font-medium hover:bg-gray-800 transition-colors shadow-md"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
              <div className="w-full md:w-1/3 max-w-xs">
                <div className="relative aspect-square">
                  <Image
                    src="https://img.freepik.com/free-vector/newsletter-concept-illustration_114360-1529.jpg"
                    alt="Newsletter"
                    width={200}
                    height={200}
                    className="object-contain"
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