'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaystackButton from './PaystackButton';
import { useRouter } from 'next/navigation';

export default function TicketModal({ event, isOpen, onClose }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [discountedAmount, setDiscountedAmount] = useState(0);
  const [discounts, setDiscounts] = useState({ earlyBird: 0, multipleBuys: 0 });
  const [showDiscount, setShowDiscount] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [isFreeEvent, setIsFreeEvent] = useState(false);
  const [ticketTiers, setTicketTiers] = useState([]);
  const [serviceFee, setServiceFee] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    console.log('Formatting date:', dateString, 'Type:', typeof dateString);
    
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        console.error('Unknown date format:', dateString);
        return 'Invalid date';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date object created from:', dateString);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e, dateString);
      return 'Invalid date';
    }
  };

  // Generate ticket tiers based on the event
  useEffect(() => {
    if (event) {
      // Use event's ticket_tiers if available, otherwise create a single default tier
      let tiers = [];
      
      if (event.ticket_tiers?.length > 0) {
        tiers = event.ticket_tiers.map(tier => {
          // Check if this is a premium tier (has tier_title)
          if (tier.tier_title) {
            // Use tier-specific fields for premium tiers
            // Calculate available tickets
            const totalQuantity = parseInt(tier.quantity) || 0;
            const soldQuantity = parseInt(tier.paid_quantity_sold) || 0;
            const availableQuantity = Math.max(0, totalQuantity - soldQuantity);
            
            return {
              ...tier,
              id: tier.id,
              name: tier.tier_title,
              description: tier.tier_description,
              price: parseFloat(tier.tier_price) || 0,
              quantity: totalQuantity,
              availableQuantity: availableQuantity,
              soldOut: availableQuantity <= 0,
              isPremium: true
            };
          } else {
            // For standard tickets, use original columns
            // Calculate available tickets
            const totalQuantity = parseInt(tier.quantity) || 0;
            const soldQuantity = parseInt(tier.paid_quantity_sold) || 0;
            const availableQuantity = Math.max(0, totalQuantity - soldQuantity);
            
            const price = typeof tier.price === 'string' ? 
              parseFloat(tier.price.replace(/[^\d.]/g, '')) : 
              parseFloat(tier.price) || 0;
            
            return {
              ...tier,
              price: price,
              availableQuantity: availableQuantity,
              soldOut: availableQuantity <= 0,
              isPremium: false
            };
          }
        });
      } else {
        // Extract price from event.price if it's a string with currency symbol
        let price = 0;
        if (event.price) {
          price = typeof event.price === 'string' ? 
            parseFloat(event.price.replace(/[^\d.]/g, '')) :
            parseFloat(event.price) || 0;
        }
        
        tiers = [{ 
          id: 'default', 
          name: 'Standard Ticket', 
          price: price,
          quantity: event.quantity || 0,
          availableQuantity: event.quantity || 0,
          soldOut: false,
          isPremium: false
        }];
      }
      
      setTicketTiers(tiers);
      
      // Check if this is a free event - only if all tiers are exactly 0
      const allTiersAreFree = tiers.every(tier => tier.price === 0);
      setIsFreeEvent(allTiersAreFree);
    }
  }, [event]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setStep(1);
      setSelectedTickets({});
      setTotalAmount(0);
      setDiscountedAmount(0);
      setDiscounts({ earlyBird: 0, multipleBuys: 0 });
      setShowDiscount(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
      
      // Log early bird dates for debugging
      if (event.has_early_bird) {
        console.log('Early bird start date:', event.early_bird_start_date);
        console.log('Early bird start date type:', typeof event.early_bird_start_date);
        console.log('Early bird end date:', event.early_bird_end_date);
        console.log('Early bird end date type:', typeof event.early_bird_end_date);
      }
      
      // Store event details in localStorage for the ticket generation
      if (typeof window !== 'undefined') {
        try {
          // Ensure we have a valid date string or timestamp
          const eventDate = event.date 
            ? (typeof event.date === 'object' ? event.date.toISOString() : event.date) 
            : new Date().toISOString();

          const eventDetails = {
            title: event.title || 'Event',
            date: eventDate,
            time: event.time || 'Time not available',
            location: event.location || 'Location not available',
            id: event.id,
            price: event.price,
            has_early_bird: event.has_early_bird || false,
            early_bird_discount: event.early_bird_discount || 0,
            early_bird_start_date: event.early_bird_start_date || null,
            early_bird_end_date: event.early_bird_end_date || null,
            has_multiple_buys: event.has_multiple_buys || false,
            multiple_buys_discount: event.multiple_buys_discount || 0,
            multiple_buys_min_tickets: event.multiple_buys_min_tickets || 2
          };
          
          console.log('Storing event details in localStorage:', eventDetails);
          localStorage.setItem('currentEventDetails', JSON.stringify(eventDetails));
        } catch (err) {
          console.error('Error storing event details:', err);
        }
      }
    }
  }, [isOpen, event]);

  // Calculate total when selected tickets change
  useEffect(() => {
    if (!event) return;

    const totalTickets = Object.values(selectedTickets).reduce((total, count) => total + count, 0);
    let subtotal = 0;
    let serviceFee = 0;
    
    // Calculate subtotal based on selected ticket tiers
    Object.entries(selectedTickets).forEach(([tierId, quantity]) => {
      if (quantity > 0) {
        const tier = ticketTiers.find(t => t.id === tierId);
        if (tier) {
          subtotal += tier.price * quantity;
          
          // Calculate service fee based on single ticket price (not quantity)
          // Only apply the fee once if this tier is selected, regardless of quantity
          serviceFee = Math.max(serviceFee, tier.price * 0.03); // Take the highest fee if multiple tiers
        }
      }
    });
    
    // Apply discounts
    let earlyBirdDiscount = 0;
    let multipleBuysDiscount = 0;
    
    // Check for early bird discount
    if (event.has_early_bird && event.early_bird_discount > 0) {
      const today = new Date();
      const startDate = event.early_bird_start_date ? new Date(event.early_bird_start_date) : null;
      const endDate = event.early_bird_end_date ? new Date(event.early_bird_end_date) : null;
      
      if ((!startDate || today >= startDate) && (!endDate || today <= endDate)) {
        earlyBirdDiscount = (subtotal * event.early_bird_discount) / 100;
      }
    }
    
    // Check for multiple buys discount
    if (event.has_multiple_buys && event.multiple_buys_discount > 0) {
      const minTickets = event.multiple_buys_min_tickets || 2;
      if (totalTickets >= minTickets) {
        multipleBuysDiscount = (subtotal * event.multiple_buys_discount) / 100;
      }
    }
    
    // Apply both discounts (don't stack, take the better one)
    const totalDiscount = Math.max(earlyBirdDiscount, multipleBuysDiscount);
    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
    
    // Final total is the discounted subtotal plus the flat service fee
    const finalTotal = discountedSubtotal + serviceFee;
    
    // Save service fee for use in the UI
    setServiceFee(serviceFee);
    
    // Log payment values for debugging
    console.log(`[TicketModal] Payment calculation: ${subtotal} - ${totalDiscount} + ${serviceFee} = ${finalTotal}`);
    
    setTotalAmount(subtotal);
    setDiscountedAmount(discountedSubtotal);
    setDiscounts({
      earlyBird: earlyBirdDiscount,
      multipleBuys: multipleBuysDiscount
    });
    setShowDiscount(totalDiscount > 0);
    setIsFreeEvent(discountedSubtotal === 0);
    
    // Store the final total with fee for payment purposes
    setFinalAmount(finalTotal);
    
    // Save the selected quantity to localStorage for the payment process
    localStorage.setItem('selectedTicketQuantity', totalTickets.toString());
  }, [selectedTickets, event, ticketTiers]);

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setStep(1);
    setSelectedTickets({});
    onClose();
  };

  const handleContinue = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (getTotalTickets() > 0) {
      // Save the selected quantity to localStorage for the payment process
      const totalTickets = getTotalTickets();
      localStorage.setItem('selectedTicketQuantity', totalTickets.toString());
      console.log('Saved selected ticket quantity to localStorage:', totalTickets);
      
      setStep(2);
    }
  };

  const handleBack = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setStep(1);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTicketChange = (tierId, newCount, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Ensure newCount is not negative
    const validCount = Math.max(0, newCount);
    
    setSelectedTickets(prev => ({
      ...prev,
      [tierId]: validCount
    }));
  };

  const handleAddTicket = (tierId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const tier = ticketTiers.find(t => t.id === tierId);
    // Prevent adding tickets if sold out
    if (tier && tier.soldOut) {
      return;
    }
    
    const currentCount = selectedTickets[tierId] || 0;
    const availableCount = tier?.availableQuantity || 0;
    
    // Only allow adding tickets if there are available ones
    if (currentCount < availableCount) {
      handleTicketChange(tierId, currentCount + 1, event);
    }
  };

  const handleRemoveTicket = (tierId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const currentCount = selectedTickets[tierId] || 0;
    if (currentCount > 0) {
      handleTicketChange(tierId, currentCount - 1, event);
    }
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((acc, count) => acc + count, 0);
  };

  const getTicketNames = () => {
    return Object.keys(selectedTickets).map(tierId => {
      const tier = ticketTiers.find(t => t.id === tierId);
      return `${tier?.name || 'Ticket'} x${selectedTickets[tierId]}`;
    }).join(', ');
  };

  // Function to get the selected ticket tier ID
  const getSelectedTicketTierId = () => {
    // If there's only one tier selected, return that tier's ID
    const tierIds = Object.keys(selectedTickets);
    if (tierIds.length === 1) {
      const tierId = tierIds[0];
      // If the ID is 'default', look up the actual tier ID from the ticketTiers array
      if (tierId === 'default') {
        // Try to find the first ticket tier for this event that has a valid UUID
        const validTier = ticketTiers.find(t => t.id !== 'default');
        if (validTier) {
          return validTier.id;
        }
        // If no valid tier found, return null - the API will handle finding a tier
        return null;
      }
      return tierId;
    }
    
    // If multiple tiers are selected, return the first one for now
    // In the future, you might want to handle multiple ticket tiers differently
    if (tierIds.length > 0) {
      const tierId = tierIds[0];
      // Handle 'default' ID
      if (tierId === 'default') {
        // Try to find the first ticket tier with a valid ID
        const validTier = ticketTiers.find(t => t.id !== 'default');
        if (validTier) {
          return validTier.id;
        }
        return null;
      }
      return tierId;
    }
    
    return null;
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return false;
    if (!formData.lastName.trim()) return false;
    if (!formData.email.trim() || !formData.email.includes('@')) return false;
    return true;
  };

  const handlePaymentSuccess = (reference) => {
    // Redirect to the success page with the reference
    router.push(`/payment/success?reference=${reference}`);
    onClose();
  };

  const handleFreeTicketSuccess = (reference) => {
    // Store the event title and details in localStorage before redirecting
    if (event) {
      const ticketData = JSON.parse(localStorage.getItem('tempTicketData') || '{}');
      ticketData.event_title = event.title || 'Event';
      ticketData.event_date = event.date;
      ticketData.event_time = event.time;
      ticketData.event_location = event.location;
      localStorage.setItem('tempTicketData', JSON.stringify(ticketData));
    }
    
    // Redirect to the ticket page directly
    router.push(`/tickets/${reference}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={handleClose} />

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative inline-block transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    {step === 1 ? 'Select Tickets' : 'Complete Your Purchase'}
                  </h3>
                  <button
                    onClick={(e) => handleClose(e)}
                    className="rounded-full p-1 text-white hover:bg-white/20 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-sm text-white/80">{event?.title}</p>
              </div>

              {step === 1 ? (
                // Step 1: Select Tickets
                <div className="px-6 py-4">
                  <div className="space-y-6">
                    {/* Available Tickets */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Tickets</h4>
                      <div className="space-y-4">
                        {ticketTiers.map(tier => (
                          <div 
                            key={tier.id} 
                            className={`border rounded-lg p-4 mb-4 ${
                              tier.soldOut
                                ? 'border-gray-200 bg-gray-50 opacity-75'
                                : tier.isPremium 
                                  ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm' 
                                  : 'border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between mb-2">
                              <div>
                                {tier.isPremium && (
                                  <span className="inline-block px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full mb-1">
                                    Premium Tier
                                  </span>
                                )}
                                <h5 className={`font-medium ${tier.isPremium ? 'text-amber-800' : 'text-gray-900'}`}>
                                  {tier.name}
                                </h5>
                                <p className={`text-sm ${tier.isPremium ? 'text-amber-700' : 'text-gray-500'}`}>
                                  From ₦{tier.price.toLocaleString()}
                                </p>
                                {tier.description && (
                                  <p className={`text-xs mt-1 ${tier.isPremium ? 'text-amber-600' : 'text-gray-600'}`}>
                                    {tier.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center">
                                {tier.soldOut ? (
                                  <span className="text-red-500 font-medium text-sm">Sold Out</span>
                                ) : (
                                  <>
                                    <button 
                                      onClick={(e) => handleRemoveTicket(tier.id, e)}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-opacity-80 ${
                                        tier.isPremium ? 'bg-amber-200 hover:bg-amber-300' : 'bg-gray-100 hover:bg-gray-200'
                                      }`}
                                    >
                                      <span>-</span>
                                    </button>
                                    <span className="w-10 text-center font-medium">
                                      {selectedTickets[tier.id] || 0}
                                    </span>
                                    <button 
                                      onClick={(e) => handleAddTicket(tier.id, e)}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-opacity-80 ${
                                        tier.isPremium ? 'bg-amber-200 hover:bg-amber-300' : 'bg-gray-100 hover:bg-gray-200'
                                      }`}
                                    >
                                      <span>+</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className={`text-xs ${tier.soldOut ? 'text-red-500' : tier.isPremium ? 'text-amber-600' : 'text-gray-500'}`}>
                              {tier.soldOut 
                                ? 'No tickets available.' 
                                : tier.isPremium 
                                  ? `Limited availability. ${tier.availableQuantity} of ${tier.quantity} tickets remaining.` 
                                  : `${tier.availableQuantity} of ${tier.quantity} tickets remaining.`}
                            </div>
                          </div>
                        ))}
                        
                        {/* Available Discounts */}
                        {(event?.has_early_bird || event?.has_multiple_buys) && (
                          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mt-2">
                            <h5 className="font-medium text-orange-700 mb-2">Available Discounts</h5>
                            
                            {event?.has_early_bird && (
                              <div className="flex items-start space-x-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm">
                                  <p className="text-gray-700">Early Bird: <span className="font-medium">{event.early_bird_discount}% off</span></p>
                                  <p className="text-xs text-gray-500">
                                    Book early and save! Valid 
                                  
                                  </p>
                                  {/* Debug info - will remove after fixing */}
                                  <p className="text-xs text-red-500">
                                    Start: {String(event.early_bird_start_date)} | 
                                    End: {String(event.early_bird_end_date)}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {event?.has_multiple_buys && (
                              <div className="flex items-start space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                                <div className="text-sm">
                                  <p className="text-gray-700">Volume Discount: <span className="font-medium">{event.multiple_buys_discount}% off</span></p>
                                  <p className="text-xs text-gray-500">
                                    Buy {event.multiple_buys_min_tickets || 2}+ tickets and save!
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Total */}
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total tickets:</span>
                      <span>{getTotalTickets()}</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-gray-800">
                        <span>Subtotal:</span>
                        <span>₦{totalAmount.toLocaleString()}</span>
                      </div>
                      
                      {showDiscount && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-₦{Math.max(discounts.earlyBird, discounts.multipleBuys).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {!isFreeEvent && (
                        <div className="flex justify-between text-gray-700 mt-1">
                          <span>Service Charge:</span>
                          <span>₦{serviceFee.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span className={showDiscount ? "font-medium text-green-600" : ""}>
                          ₦{(finalAmount).toLocaleString()}
                        </span>
                      </div>
                      
                      {!isFreeEvent && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          * 3% service charge is added once per order regardless of quantity.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={(e) => handleClose(e)}
                      className="px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={(e) => handleContinue(e)}
                      disabled={getTotalTickets() === 0}
                      className={`px-6 py-2 rounded-md text-white ${
                        getTotalTickets() === 0
                          ? 'bg-gray-100 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-orange-400 hover:bg-amber-600'
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                // Step 2: Purchase Form
                <div className="px-6 py-4">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 mb-6">
                    <h5 className="font-medium text-gray-900 mb-2">Order Summary</h5>
                    {Object.entries(selectedTickets).map(([tierId, quantity]) => {
                      if (quantity > 0) {
                        const tier = ticketTiers.find(t => t.id === tierId);
                        return (
                          <div key={tierId} className={`flex justify-between items-center text-sm mb-1 ${
                            tier?.isPremium ? 'text-amber-700 font-medium' : 'text-gray-600'
                          }`}>
                            <span>{tier?.name || 'Ticket'} x{quantity}</span>
                            <span>₦{((tier?.price || 0) * quantity).toLocaleString()}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                    <div className="text-xs text-gray-500 mt-2">For: {event?.title}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={(e) => handleBack(e)}
                      className="flex-1 rounded-xl py-3 px-4 text-center font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <PaystackButton
                      amount={finalAmount}
                      originalAmount={totalAmount}
                      discountedAmount={null}
                      discounts={{
                        earlyBird: discounts.earlyBird,
                        multipleBuys: discounts.multipleBuys
                      }}
                      email={formData.email}
                      firstName={formData.firstName}
                      lastName={formData.lastName}
                      phone={formData.phone}
                      ticketType={getTicketNames()}
                      eventId={event?.id}
                      ticketTierId={getSelectedTicketTierId()}
                      disabled={!validateForm()}
                      onSuccess={handlePaymentSuccess}
                      isFree={isFreeEvent}
                      onFreeSuccess={handleFreeTicketSuccess}
                      serviceFee={0}
                    />
                    {/* Debug info for payment amounts */}
                    <div className="mt-2 text-xs text-gray-400">
                      Amount: ₦{finalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 