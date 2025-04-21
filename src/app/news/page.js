'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';

export default function NewsUpdates() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [newsArticles, setNewsArticles] = useState([]);
  const [featuredNews, setFeaturedNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 9; // Number of articles per page
  
  // News categories
  const categories = [
    { id: 'all', name: 'All News' },
    { id: 'company', name: 'Company Updates' },
    { id: 'features', name: 'New Features' },
    { id: 'events', name: 'Events Industry' },
    { id: 'guides', name: 'Tips & Guides' }
  ];
  
  // Fetch news from database
  useEffect(() => {
    async function fetchNewsData() {
      try {
        setLoading(true);
        console.log('Fetching news data...');
        
        // First, get a featured post
        const { data: featuredData, error: featuredError } = await supabase
          .from('news_posts')
          .select('*')
          .eq('status', 'published')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (featuredError) {
          console.error('Error fetching featured post:', featuredError);
        }
        
        if (featuredData && featuredData.length > 0) {
          console.log('Found featured post:', featuredData[0].id);
          setFeaturedNews(featuredData[0]);
        } else {
          console.log('No featured posts found');
        }
        
        // Build base query for regular posts
        let query = supabase
          .from('news_posts')
          .select('*', { count: 'exact' })
          .eq('status', 'published');
        
        // If we have a featured post, exclude it from regular posts
        if (featuredData && featuredData.length > 0) {
          query = query.not('id', 'eq', featuredData[0].id);
        }

        // Apply category filter if not 'all'
        if (activeCategory !== 'all') {
          query = query.eq('category', activeCategory);
        }
        
        // Get total count first
        const { count, error: countError } = await query;
        
        if (countError) {
          console.error('Error getting post count:', countError);
          throw countError;
        }
        
        setTotalCount(count || 0);
        console.log(`Total posts: ${count}`);
        
        // Calculate pagination range
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Now get the data with pagination
        const { data, error: postsError } = await query
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (postsError) {
          console.error('Error fetching regular posts:', postsError);
          throw postsError;
        }
        
        console.log(`Found ${data?.length || 0} regular posts for page ${currentPage}`);
        setNewsArticles(data || []);
      } catch (err) {
        console.error('Error fetching news posts:', err);
        setError(err?.message || 'An error occurred while fetching news posts');
      } finally {
        setLoading(false);
      }
    }
    
    fetchNewsData();
  }, [activeCategory, currentPage]); // Reload when category or page changes
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Ensure proper URL encoding for news post links
  const getPostUrl = (postSlug, postId) => {
    // Use the ID as fallback if slug is unavailable
    const linkPath = postSlug || postId;
    // Ensure the slug is properly encoded for URLs
    return `/news/${encodeURIComponent(linkPath)}`;
  };

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Get author first initial for avatar
  const getAuthorInitial = (authorName) => {
    return authorName && authorName.length > 0 ? authorName[0].toUpperCase() : 'A';
  };

  // Pagination controls
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };

  // Generate page number buttons
  const getPageButtons = () => {
    let buttons = [];
    const maxVisibleButtons = 5;
    
    if (totalPages <= maxVisibleButtons) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else {
      // Always show first page
      buttons.push(1);
      
      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - Math.floor(maxVisibleButtons / 2) + 1);
      let end = Math.min(totalPages - 1, start + maxVisibleButtons - 3);
      
      // Adjust start if we're near the end
      if (end === totalPages - 1) {
        start = Math.max(2, totalPages - maxVisibleButtons + 2);
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        buttons.push('...');
      }
      
      // Add visible page numbers
      for (let i = start; i <= end; i++) {
        buttons.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        buttons.push('...');
      }
      
      // Always show last page
      buttons.push(totalPages);
    }
    
    return buttons;
  };

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
              onClick={() => {
                setActiveCategory(category.id);
                setCurrentPage(1); // Reset to page 1 when changing category
              }}
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
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading posts...</span>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 p-6 rounded-xl mb-12">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Featured News (only show on 'all' or when matches the category) */}
        {!loading && !error && featuredNews && (activeCategory === 'all' || activeCategory === featuredNews.category) && currentPage === 1 && (
          <div className="mb-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-100"
            >
              <div className="flex flex-col sm:flex-row max-w-3xl mx-auto">
                <div className="relative h-[150px] sm:h-[140px] sm:w-[200px] flex-shrink-0">
                  {featuredNews.image_url ? (
                    featuredNews.image_url.startsWith('data:image') ? (
                      <img
                        src={featuredNews.image_url}
                        alt={featuredNews.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                  <Image
                        src={featuredNews.image_url}
                    alt={featuredNews.title}
                    fill
                    className="object-cover"
                  />
                    )
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-sm text-xs font-medium">
                    Featured
                  </div>
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-1 text-xs">
                      <span className="text-gray-500">{formatDate(featuredNews.created_at)}</span>
                      <span className="mx-1 text-gray-300">•</span>
                      <span className="text-amber-600">
                        {getCategoryName(featuredNews.category)}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-gray-800 mb-1 line-clamp-1">{featuredNews.title}</h2>
                    <p className="text-gray-600 text-xs line-clamp-1 mb-2">{featuredNews.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center text-amber-600 text-xs">
                        {getAuthorInitial(featuredNews.author)}
                      </div>
                      <p className="ml-1 text-xs text-gray-600 line-clamp-1 max-w-[100px]">
                        {featuredNews.author || 'Unknown'}
                      </p>
                    </div>
                    <Link
                      href={getPostUrl(featuredNews.slug, featuredNews.id)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* News Articles Grid */}
        {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                  {article.image_url ? (
                    article.image_url.startsWith('data:image') ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                <Image
                        src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
                    )
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                    <span className="text-sm text-gray-500">{formatDate(article.created_at)}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-amber-600">
                      {getCategoryName(article.category)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{article.title}</h3>
                <p className="text-gray-600 mb-6 line-clamp-3">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-100 overflow-hidden mr-2 flex items-center justify-center text-amber-600">
                        {getAuthorInitial(article.author)}
                      </div>
                      <p className="text-sm text-gray-700">
                        {article.author || 'Unknown Author'}
                      </p>
                    </div>
                    <Link
                      href={getPostUrl(article.slug, article.id)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    Read More
                    </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
        
        {!loading && !error && newsArticles.length === 0 && (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No articles found</h3>
            <p className="text-gray-600">There are no articles in this category yet. Please check back later.</p>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-1" aria-label="Pagination">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {getPageButtons().map((page, idx) => (
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${page}`}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo(0, 0);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-amber-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
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