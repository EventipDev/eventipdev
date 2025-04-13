'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivateEventPage() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // Create a reference to the file input
  const fileInputRef = useRef(null);
  
  // Load existing data when returning to edit the form
  useEffect(() => {
    const loadExistingEventData = () => {
      if (typeof window !== 'undefined') {
        try {
          const storedData = sessionStorage.getItem('privateEventData');
          if (storedData) {
            const eventData = JSON.parse(storedData);
            
            // Set form values from stored data
            setEventName(eventData.eventName || '');
            setDescription(eventData.description || '');
            setCategory(eventData.category || '');
            setEventStartDate(eventData.eventStartDate || '');
            setEventEndDate(eventData.eventEndDate || '');
            setStartTime(eventData.startTime || '');
            setEndTime(eventData.endTime || '');
            setAddress(eventData.address || '');
            setCity(eventData.city || '');
            setState(eventData.state || '');
            setCountry(eventData.country || '');
            setIsPaid(eventData.isPaid || false);
            setQuantity(eventData.quantity || '');
            setPrice(eventData.price || '');
            
            // Handle cover image if available
            if (eventData.coverImageUrl) {
              // Directly use the base64 image that was stored
              setCoverImageUrl(eventData.coverImageUrl);
              
              // No need to set coverImage since we'll reuse the existing base64 on submit
              // This avoids needing to convert a base64 back to a File object
            }
          }
        } catch (error) {
          console.error('Error loading event data:', error);
        }
      }
    };
    
    loadExistingEventData();
  }, []);
  
  // Handle file selection for cover image
  const handleCoverImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setCoverImageUrl(objectUrl);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  // Convert file to base64 for storage and preview
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/create-event" className="text-slate-500 hover:text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Private Event</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-semibold uppercase text-sm text-slate-500 mb-4">EVENT INFORMATION</h3>
              <ul className="space-y-2">
                <li className="text-indigo-600 font-medium cursor-pointer">
                  Upload cover
                </li>
                <li className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors">
                  General information
                </li>
                <li className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors">
                  Location and time
                </li>
                <li className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors">
                  Ticket
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-semibold uppercase text-sm text-slate-500 mb-4">PUBLISH EVENT</h3>
              <ul className="space-y-2">
                <li className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors">
                  Review and Publish
                </li>
              </ul>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <form className="space-y-8">
              {/* Upload Cover Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-medium text-slate-800">Upload cover</h2>
                  </div>
                  <button type="button" className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Upload the event cover to capture your audience's attention</p>
                
                {/* Hidden file input */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleCoverImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Cover image preview or upload button */}
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex items-center justify-center overflow-hidden relative cursor-pointer"
                  onClick={handleUploadClick}
                >
                  {coverImageUrl ? (
                    <>
                      <Image 
                        src={coverImageUrl} 
                        alt="Cover preview" 
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          className="text-white font-medium bg-gradient-to-r from-indigo-600 to-blue-500 px-3 py-1 rounded-lg shadow-sm hover:from-indigo-700 hover:to-blue-600 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick();
                          }}
                        >
                          Change Image
                        </button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">Upload Image</button>
                  )}
                </div>
                
                <div className="mt-2 text-xs text-slate-500">
                  Click to upload. Recommended size: 1200 x 630 pixels. Max size: 5MB.
                </div>
              </div>

              {/* General Information Section - Hidden by default */}
              {/* Location and Time Section - Hidden by default */}
              
              {/* Public/Private Selection Section - Replaced with Event Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 text-xl">ℹ️</span>
                    <h2 className="text-lg font-medium text-slate-800">Event Details</h2>
                  </div>
                  <button type="button" className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-1">Make it catchy and memorable</p>
                    <input
                      type="text"
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Rock Revolt: A Fusion of Power and Passion"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <p className="text-xs text-slate-500 mb-1">Provide essential event details</p>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter description..."
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Event Street, City"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Country"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-1">
                        Start Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          id="startTime"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-1">
                        End Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="eventStartDate" className="block text-sm font-medium text-slate-700 mb-1">
                      Event Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="eventStartDate"
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="eventEndDate" className="block text-sm font-medium text-slate-700 mb-1">
                      Event End Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="eventEndDate"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Ticket Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 text-xl">🎟️</span>
                    <h2 className="text-lg font-medium text-slate-800">Ticket</h2>
                  </div>
                  <button type="button" className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Ticket Type */}
                  <div>
                    <div className="flex space-x-4 mb-6">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="paid"
                          name="ticketType"
                          checked={isPaid}
                          onChange={() => setIsPaid(true)}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                        />
                        <label htmlFor="paid" className="ml-2 text-sm font-medium text-slate-700">
                          Paid
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="free"
                          name="ticketType"
                          checked={!isPaid}
                          onChange={() => setIsPaid(false)}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                        />
                        <label htmlFor="free" className="ml-2 text-sm font-medium text-slate-700">
                          Free
                        </label>
                      </div>
                    </div>
                    
                    {/* Free Ticket Quantity */}
                    <div className="mb-6">
                      <label htmlFor="freeQuantity" className="block text-sm font-medium text-slate-700 mb-1">
                        {isPaid ? 'Ticket Quantity' : 'Free Ticket Quantity'}
                      </label>
                      <input
                        type="number"
                        id="freeQuantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="200"
                        min="1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    
                    {/* Price field - only visible when Paid is selected */}
                    {isPaid && (
                      <div className="mb-6">
                        <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">
                          Price ₦
                        </label>
                        <input
                          type="number"
                          id="price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="5000"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                    
                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4 mt-8">
                      <button
                        type="button"
                        className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Convert cover image to base64 before storing if it exists
                          const prepareAndNavigate = async () => {
                            let coverImageBase64 = null;
                            
                            if (coverImage) {
                              try {
                                coverImageBase64 = await fileToBase64(coverImage);
                              } catch (error) {
                                console.error('Error converting image to base64:', error);
                              }
                            }
                            
                            // Create an event data object with all input values
                            const eventData = {
                              eventName,
                              description,
                              category,
                              eventStartDate,
                              eventEndDate,
                              startTime,
                              endTime,
                              address,
                              city,
                              state,
                              country,
                              isPaid,
                              quantity,
                              price: isPaid ? price : '0',
                              // Use the newly converted image or keep the existing one
                              coverImageUrl: coverImageBase64 || coverImageUrl || ''
                            };
                            
                            // Store in sessionStorage for the review page to access
                            sessionStorage.setItem('privateEventData', JSON.stringify(eventData));
                            
                            // Navigate to the review page
                            router.push('/private-event-review');
                          };
                          
                          prepareAndNavigate();
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 