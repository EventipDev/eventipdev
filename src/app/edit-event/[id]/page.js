'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabase';

export default function EditEvent({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    city: '',
    state: '',
    quantity: 0,
    price: 0,
    is_paid: false,
    status: 'draft'
  });
  const [coverImage, setCoverImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!user) return;

      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            event_images(*)
          `)
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (eventError) throw eventError;

        if (!eventData) {
          router.push('/my-events');
          return;
        }

        // Set form data
        setFormData({
          name: eventData.name || '',
          description: eventData.description || '',
          event_date: eventData.event_date || '',
          start_time: eventData.start_time || '',
          end_time: eventData.end_time || '',
          location: eventData.location || '',
          city: eventData.city || '',
          state: eventData.state || '',
          quantity: eventData.quantity || 0,
          price: eventData.price || 0,
          is_paid: eventData.is_paid || false,
          status: eventData.status || 'draft'
        });

        // Set cover image
        const coverImage = eventData.event_images?.find(img => img.is_cover);
        if (coverImage) {
          setCoverImage(coverImage.image_url);
        }

        setEvent(eventData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching event:', error);
        router.push('/my-events');
      }
    };

    fetchEvent();
  }, [user, params.id, router]);

  // Display loading message if we're waiting for the event data
  useEffect(() => {
    if (event) {
      console.log('Event data loaded:', event.id);
      setIsLoading(false);
    }
  }, [event]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({
          name: formData.name,
          description: formData.description,
          event_date: formData.event_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location,
          city: formData.city,
          state: formData.state,
          quantity: formData.quantity,
          price: formData.price,
          is_paid: formData.is_paid,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', user.id);

      if (error) throw error;

      router.push('/my-events?updated=true');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 text-pink-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1">
        <header className="bg-white border-b border-gray-200">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Edit Event</div>
              <h1 className="text-2xl font-semibold">{formData.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/my-events"
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className={`px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* Event Cover Image */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Event Cover Image</h2>
              <div className="h-64 bg-gray-200 rounded-lg relative overflow-hidden">
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt="Event cover"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Event Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Date and Time</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">
                    Event Date
                  </label>
                  <input
                    type="date"
                    id="event_date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tickets</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_paid"
                    name="is_paid"
                    checked={formData.is_paid}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_paid" className="ml-2 block text-sm text-gray-700">
                    This is a paid event
                  </label>
                </div>

                {formData.is_paid && (
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Ticket Price ($)
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Number of Tickets Available
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Event Status</h2>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 