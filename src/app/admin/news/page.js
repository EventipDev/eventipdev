'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import supabase from '../../lib/supabase';

export default function NewsManagement() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [admin, setAdmin] = useState(null);
  const pageSize = 10;

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'company', name: 'Company Updates' },
    { id: 'features', name: 'New Features' },
    { id: 'events', name: 'Events Industry' },
    { id: 'guides', name: 'Tips & Guides' }
  ];

  // Status options
  const statusOptions = [
    { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'archived', label: 'Archived', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (admin) {
      fetchPosts();
    }
  }, [filter, searchTerm, currentPage, admin]);

  const checkAdminAuth = async () => {
    try {
      // Check local storage first for admin data
      const storedAdmin = localStorage.getItem('admin');
      if (storedAdmin) {
        setAdmin(JSON.parse(storedAdmin));
        return;
      }

      // Otherwise check auth state
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (data.user) {
        // Fetch admin details from database
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('email', data.user.email)
          .single();
          
        if (adminError) throw adminError;
        
        setAdmin(adminData);
        localStorage.setItem('admin', JSON.stringify(adminData));
      } else {
        // Not authenticated, redirect to login
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Error checking admin authentication:', err);
      setError('You must be logged in as an admin to access this page');
      router.push('/admin/login');
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Base query
      let query = supabase
        .from('news_posts')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filter !== 'all') {
        query = query.eq('category', filter);
      }
      
      // Apply search if present
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%, excerpt.ilike.%${searchTerm}%, author.ilike.%${searchTerm}%`);
      }
      
      // Get count first
      const { count, error: countError } = await query;
      
      if (countError) {
        console.error('Error fetching post count:', countError);
        throw new Error(countError.message || 'Failed to retrieve post count');
      }
      
      setTotalCount(count || 0);
      
      // Then get paginated data
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Fetching posts: page ${currentPage}, range ${from}-${to}, filter: ${filter}, search: ${searchTerm}`);
      
      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (fetchError) {
        console.error('Error fetching posts data:', fetchError);
        throw new Error(fetchError.message || 'Failed to retrieve posts data');
      }
      
      setPosts(data || []);
      console.log(`Retrieved ${data?.length || 0} posts`);
    } catch (err) {
      console.error('Error fetching news posts:', err);
      setError(err.message || 'An unknown error occurred while fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log(`Attempting to delete post with ID: ${postId}`);
      const { error } = await supabase
        .from('news_posts')
        .delete()
        .eq('id', postId);
        
      if (error) {
        console.error('Database delete error:', error);
        throw new Error(error.message || 'Failed to delete post');
      }
      
      console.log(`Post ${postId} deleted successfully`);
      // Refresh posts
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post: ' + (err.message || 'An unknown error occurred'));
    }
  };

  const handleUpdateStatus = async (postId, newStatus) => {
    try {
      console.log(`Updating post ${postId} status to: ${newStatus}`);
      const { data, error } = await supabase
        .from('news_posts')
        .update({ status: newStatus })
        .eq('id', postId);
        
      if (error) {
        console.error('Database update error:', error);
        throw new Error(error.message || 'Failed to update post status');
      }
      
      console.log(`Post ${postId} status updated successfully`);
      // Refresh posts
      fetchPosts();
    } catch (err) {
      console.error('Error updating post status:', err);
      alert('Failed to update post status: ' + (err.message || 'An unknown error occurred'));
    }
  };

  const handleToggleFeatured = async (postId, currentStatus) => {
    try {
      const newFeaturedStatus = !currentStatus;
      console.log(`Toggling featured status for post ${postId} to: ${newFeaturedStatus}`);
      
      const { data, error } = await supabase
        .from('news_posts')
        .update({ is_featured: newFeaturedStatus })
        .eq('id', postId);
        
      if (error) {
        console.error('Database update error:', error);
        throw new Error(error.message || 'Failed to update featured status');
      }
      
      console.log(`Post ${postId} featured status updated successfully`);
      // Refresh posts
      fetchPosts();
    } catch (err) {
      console.error('Error toggling featured status:', err);
      alert('Failed to update featured status: ' + (err.message || 'An unknown error occurred'));
    }
  };

  // Handle pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">News Management</h1>
              <p className="text-sm sm:text-base text-gray-600">Create, edit, and manage news posts</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Link href="/admin/news/create" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Post
                </button>
              </Link>
              <Link href="/admin/dashboard" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Filter</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFilter(category.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        filter === category.id 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Posts</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or excerpt..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Table */}
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Post</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Author</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Featured</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading posts...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-red-500">
                      Error: {error}. Make sure the news_posts table is created.
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No posts found. Create your first post by clicking the "New Post" button.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          {post.image_url ? (
                            <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                              {post.image_url.startsWith('data:image') ? (
                                // For base64 encoded images
                                <img
                                  src={post.image_url}
                                  alt={post.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                // For URL-based images (legacy or external)
                                <Image
                                  src={post.image_url}
                                  alt={post.title}
                                  width={64}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="h-10 w-16 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="ml-4 max-w-xs truncate">
                            <div className="font-medium text-gray-900 line-clamp-1">{post.title}</div>
                            <div className="text-gray-500 line-clamp-1">{post.excerpt}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {categories.find(c => c.id === post.category)?.name || post.category}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {post.author ? (
                          <div className="text-gray-900">{post.author}</div>
                        ) : (
                          <span className="text-gray-500">Unknown</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={post.status}
                          onChange={(e) => handleUpdateStatus(post.id, e.target.value)}
                          className={`rounded-md text-xs font-medium py-1 pl-2 pr-7 border ${
                            post.status === 'published' ? 'border-green-200 bg-green-50 text-green-800' :
                            post.status === 'draft' ? 'border-gray-200 bg-gray-50 text-gray-800' :
                            'border-red-200 bg-red-50 text-red-800'
                          }`}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleToggleFeatured(post.id, post.is_featured)}
                          className={`w-10 h-6 rounded-full flex items-center ${
                            post.is_featured ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'
                          }`}
                        >
                          <span className={`inline-block w-4 h-4 rounded-full mx-1 ${
                            post.is_featured ? 'bg-white' : 'bg-white'
                          }`}></span>
                        </button>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/news/edit/${post.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && !error && posts.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 ${
                    currentPage === 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 ${
                    currentPage === totalPages ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                        currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                        currentPage === totalPages || totalPages === 0 ? 'cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 