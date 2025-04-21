'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import supabase from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function NewsPostDetail({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  // Decode the slug parameter in case it contains URL-encoded characters
  const encodedSlug = unwrappedParams.slug;
  const slug = decodeURIComponent(encodedSlug);
  
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        console.log(`Fetching post with slug or id: ${slug}`);
        
        // Try to fetch post by slug first
        let { data, error: slugError } = await supabase
          .from('news_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();
        
        // If not found by slug, try by ID (UUID)
        if (slugError) {
          console.log('Post not found by slug, trying by ID');
          const { data: idData, error: idError } = await supabase
            .from('news_posts')
            .select('*')
            .eq('id', slug)
            .eq('status', 'published')
            .single();
            
          if (idError) {
            console.log('Error fetching post by ID:', idError.message || 'Unknown error');
            throw new Error(idError.message || 'Post not found');
          }
          
          data = idData;
        }
        
        if (!data) {
          console.log('No post data returned');
          setError('Post not found');
          return;
        }
        
        console.log(`Found post: ${data.title}`);
        setPost(data);
        
        // Fetch related posts in the same category
        if (data.category) {
          console.log(`Fetching related posts in category: ${data.category}`);
          const { data: relatedData, error: relatedError } = await supabase
            .from('news_posts')
            .select('id, title, slug, excerpt, created_at, image_url, author')
            .eq('category', data.category)
            .eq('status', 'published')
            .not('id', 'eq', data.id)
            .order('created_at', { ascending: false })
            .limit(3);
            
          if (relatedError) {
            console.log('Error fetching related posts:', relatedError.message || 'Unknown error');
          } else {
            console.log(`Found ${relatedData?.length || 0} related posts`);
            setRelatedPosts(relatedData || []);
          }
        }
      } catch (err) {
        console.log('Error in post fetch process:', err?.message || 'Unknown error');
        setError(err?.message || 'An error occurred while loading the post');
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Categories for display
  const categories = [
    { id: 'company', name: 'Company Updates' },
    { id: 'features', name: 'New Features' },
    { id: 'events', name: 'Events Industry' },
    { id: 'guides', name: 'Tips & Guides' }
  ];

  // Get category name from id
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Get author first initial for avatar
  const getAuthorInitial = (authorName) => {
    return authorName && authorName.length > 0 ? authorName[0].toUpperCase() : 'A';
  };

  // For related posts, ensure we encode the slugs properly
  const getPostUrl = (postSlug, postId) => {
    // Use the ID as fallback if slug is unavailable
    const linkPath = postSlug || postId;
    // Ensure the slug is properly encoded for URLs
    return `/news/${encodeURIComponent(linkPath)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white shadow-md rounded-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || "The post you're looking for doesn't exist or has been removed."}
            </p>
            <Link
              href="/news"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to News
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-10 pb-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-8">
            <Link
              href="/news"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all posts
            </Link>
          </div>
          
          {/* Category */}
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {getCategoryName(post.category)}
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-6">
            {post.title}
          </h1>
          
          {/* Author and date */}
          <div className="mb-8 flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-500">
                {getAuthorInitial(post.author)}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {post.author || 'Unknown Author'}
              </p>
              <div className="flex space-x-1 text-sm text-gray-500">
                <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
              </div>
            </div>
          </div>
          
          {/* Featured image */}
          {post.image_url && (
            <div className="mb-10 rounded-lg overflow-hidden">
              <div className="relative h-64 sm:h-96 w-full">
                {post.image_url.startsWith('data:image') ? (
                  // For base64 encoded images
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // For URL-based images (legacy or external)
                  <Image
                    src={post.image_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="prose prose-indigo prose-lg max-w-none mb-12">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
        
        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <div key={relatedPost.id} className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                  <div className="flex-shrink-0">
                    {relatedPost.image_url ? (
                      <div className="h-48 w-full relative">
                        {relatedPost.image_url.startsWith('data:image') ? (
                          // For base64 encoded images
                          <img
                            src={relatedPost.image_url}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          // For URL-based images (legacy or external)
                          <Image
                            src={relatedPost.image_url}
                            alt={relatedPost.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                    <div className="flex-1">
                      <Link href={getPostUrl(relatedPost.slug, relatedPost.id)}>
                        <h3 className="text-xl font-semibold text-gray-900 hover:underline">{relatedPost.title}</h3>
                      </Link>
                      <p className="mt-3 text-base text-gray-500 line-clamp-3">{relatedPost.excerpt}</p>
                    </div>
                    <div className="mt-4">
                      <time dateTime={relatedPost.created_at} className="text-sm text-gray-500">
                        {formatDate(relatedPost.created_at)}
                      </time>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
} 