/**
 * Discount Calculator utility functions for event tickets
 */

/**
 * Calculate early bird discount (whole numbers only, no decimals)
 * @param {number} price - The original ticket price
 * @param {number} discountPercentage - The discount percentage (e.g., 10, 20, 30)
 * @param {string} startDate - Early bird discount start date (ISO string)
 * @param {string} endDate - Early bird discount end date (ISO string)
 * @returns {number} - The discount amount as a whole number (no decimals)
 */
export function calculateEarlyBirdDiscount(price, discountPercentage, startDate, endDate) {
  if (!price || !discountPercentage || !startDate || !endDate) {
    return 0;
  }

  const today = new Date();
  const earlyBirdStartDate = new Date(startDate);
  const earlyBirdEndDate = new Date(endDate);
  
  // Set time to end of day for end date
  earlyBirdEndDate.setHours(23, 59, 59, 999);
  
  // Check if current date is within early bird period
  if (today >= earlyBirdStartDate && today <= earlyBirdEndDate) {
    // Calculate discount as whole number (integer, no decimals)
    return Math.floor((price * discountPercentage) / 100);
  }
  
  return 0;
}

/**
 * Calculate multiple buys discount (whole numbers only, no decimals)
 * @param {number} price - The original ticket price
 * @param {number} quantity - Number of tickets being purchased
 * @param {number} minTickets - Minimum number of tickets required for discount
 * @param {number} discountPercentage - The discount percentage (e.g., 10, 20, 30)
 * @returns {number} - The discount amount as a whole number (no decimals)
 */
export function calculateMultipleBuysDiscount(price, quantity, minTickets, discountPercentage) {
  if (!price || !quantity || !minTickets || !discountPercentage) {
    return 0;
  }
  
  // Check if quantity meets the minimum requirement
  if (quantity >= minTickets) {
    // Calculate discount as whole number (integer, no decimals)
    return Math.floor((price * discountPercentage) / 100);
  }
  
  return 0;
}

/**
 * Calculate the final price after applying discounts
 * @param {number} originalPrice - The original ticket price
 * @param {number} earlyBirdDiscount - Early bird discount amount
 * @param {number} multipleBuysDiscount - Multiple buys discount amount
 * @returns {number} - The final price after discounts
 */
export function calculateFinalPrice(originalPrice, earlyBirdDiscount, multipleBuysDiscount) {
  // Apply the larger discount of the two
  const largerDiscount = Math.max(earlyBirdDiscount, multipleBuysDiscount);
  
  // Ensure the final price doesn't go below zero
  return Math.max(originalPrice - largerDiscount, 0);
}

/**
 * Get the applicable discount for display
 * @param {Object} event - The event object containing discount settings
 * @param {number} quantity - Number of tickets being purchased
 * @returns {Object} - Object containing discount type, percentage, and amount
 */
export function getApplicableDiscount(event, price, quantity = 1) {
  if (!event || !price) {
    return { type: 'none', percentage: 0, amount: 0 };
  }
  
  let earlyBirdDiscount = 0;
  let multipleBuysDiscount = 0;
  
  // Check for early bird discount
  if (event.has_early_bird && event.early_bird_discount > 0 && 
      event.early_bird_start_date && event.early_bird_end_date) {
    earlyBirdDiscount = calculateEarlyBirdDiscount(
      price,
      event.early_bird_discount,
      event.early_bird_start_date,
      event.early_bird_end_date
    );
  }
  
  // Check for multiple buys discount
  if (event.has_multiple_buys && event.multiple_buys_discount > 0 && 
      event.multiple_buys_min_tickets > 0 && quantity >= event.multiple_buys_min_tickets) {
    multipleBuysDiscount = calculateMultipleBuysDiscount(
      price,
      quantity,
      event.multiple_buys_min_tickets,
      event.multiple_buys_discount
    );
  }
  
  // Determine which discount to apply (the larger one)
  if (earlyBirdDiscount > multipleBuysDiscount && earlyBirdDiscount > 0) {
    return {
      type: 'early_bird',
      percentage: event.early_bird_discount,
      amount: earlyBirdDiscount
    };
  } else if (multipleBuysDiscount > 0) {
    return {
      type: 'multiple_buys',
      percentage: event.multiple_buys_discount,
      amount: multipleBuysDiscount
    };
  }
  
  return { type: 'none', percentage: 0, amount: 0 };
} 