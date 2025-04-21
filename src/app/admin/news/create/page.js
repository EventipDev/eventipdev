'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function CreateNewsPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'company',
    status: 'draft',
    is_featured: false,
    author: ''
  });

  // Categories for selection
  const categories = [
    { id: 'company', name: 'Company Updates' },
    { id: 'features', name: 'New Features' },
    { id: 'events', name: 'Events Industry' },
    { id: 'guides', name: 'Tips & Guides' }
  ];

  // Status options
  const statusOptions = [
    { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' }
  ];

  // Get current admin on component mount
  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Check if the user is authenticated as an admin
  const checkAdminAuth = async () => {
    try {
      // Check local storage first for admin data
      const storedAdmin = localStorage.getItem('admin');
      if (storedAdmin) {
        const adminData = JSON.parse(storedAdmin);
        setAdmin(adminData);
        // Set the current admin's name as the default author if needed
        const authorName = `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim();
        if (authorName) {
          setFormData(prev => ({ ...prev, author: authorName }));
        }
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
          
        if (adminError) {
          console.error('Error fetching admin:', adminError);
          throw new Error('You must be logged in as an admin to create news posts');
        }
        
        setAdmin(adminData);
        // Set the current admin's name as the default author if needed
        const authorName = `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim();
        if (authorName) {
          setFormData(prev => ({ ...prev, author: authorName }));
        }
        localStorage.setItem('admin', JSON.stringify(adminData));
      } else {
        // Not authenticated, redirect to login
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Error checking admin authentication:', err);
      setError(err.message || 'You must be logged in as an admin to create news posts');
      router.push('/admin/login');
    }
  };

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug when title changes
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Clear image selection
  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('image_upload');
    if (fileInput) fileInput.value = '';
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!admin) {
      setError('You must be logged in as an admin to create a post');
      return;
    }

    if (!formData.title || !formData.content || !formData.excerpt) {
      setError('Please fill in all required fields: title, excerpt, and content');
      return;
    }

    // Ensure an author is provided
    if (!formData.author) {
      setError('Please provide an author name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = null;

      // Convert image to base64 string if selected
      if (imageFile) {
        // Use the already generated preview as the base64 string
        imageUrl = imagePreview;
      }

      // Create a new post record
      const postData = {
        id: uuidv4(),
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(),
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        status: formData.status,
        is_featured: formData.is_featured,
        author: formData.author,
        image_url: imageUrl,
        created_at: new Date().toISOString()
      };

      console.log('Attempting to insert post data:', { ...postData, content: postData.content.length + ' chars', image_url: imageUrl ? 'Base64 image string (truncated)' : null });
      
      const { data, error: insertError } = await supabase
        .from('news_posts')
        .insert([postData])
        .select();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(insertError.message || 'Failed to create news post');
      }

      if (!data || data.length === 0) {
        console.error('No data returned after insert');
        throw new Error('Failed to create post: No data returned from database');
      }

      console.log('Post created successfully:', data[0].id);
      
      // Navigate back to the news management page
      router.push('/admin/news');
    } catch (err) {
      console.error('Error creating news post:', err);
      setError(err.message || 'An unknown error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create News Post</h1>
                <p className="text-sm sm:text-base text-gray-600">Create a new news post to share with your audience</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/admin/news')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to All Posts
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
            <div className="space-y-8 divide-y divide-gray-200">
              <div>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Title */}
                  <div className="sm:col-span-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  {/* Author Input */}
                  <div className="sm:col-span-4">
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="author"
                        id="author"
                        value={formData.author}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter the name of the author for this post.
                    </p>
                  </div>

                  {/* Slug */}
                  <div className="sm:col-span-4">
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                      Slug
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="slug"
                        id="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">URL-friendly version of the title. Will be auto-generated if left blank.</p>
                  </div>

                  {/* Category */}
                  <div className="sm:col-span-3">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <div className="mt-1">
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-3">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <div className="mt-1">
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Featured */}
                  <div className="sm:col-span-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_featured"
                          name="is_featured"
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={handleChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="is_featured" className="font-medium text-gray-700">Feature this post</label>
                        <p className="text-gray-500">Featured posts will be displayed prominently on the news page.</p>
                      </div>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="sm:col-span-6">
                    <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
                      Excerpt <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="excerpt"
                        name="excerpt"
                        rows={3}
                        value={formData.excerpt}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Brief summary of the post. This will be displayed in post listings.
                    </p>
                  </div>

                  {/* Featured Image */}
                  <div className="sm:col-span-6">
                    <label htmlFor="image_upload" className="block text-sm font-medium text-gray-700">
                      Featured Image
                    </label>
                    <div className="mt-1 flex items-center">
                      <div className="space-y-1 text-center">
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="image_upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <span>Upload a file</span>
                            <input id="image_upload" name="image_upload" type="file" className="sr-only" accept="image/*" onChange={handleImageSelect} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                    {imagePreview && (
                      <div className="mt-4">
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="h-32 w-auto object-cover rounded-md" />
                          <button
                            type="button"
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 rounded-full p-1 text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            onClick={handleClearImage}
                          >
                            <span className="sr-only">Remove image</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="sm:col-span-6">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="content"
                        name="content"
                        rows={12}
                        value={formData.content}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Enter your post content here..."
                        required
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        <strong>Note:</strong> HTML formatting is supported. You can use tags like &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, etc.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/admin/news')}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Publish Post'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 