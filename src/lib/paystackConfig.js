/**
 * Paystack configuration settings
 */

// API Keys are set in .env.local file
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

// Currency
export const CURRENCY = 'NGN';

// Format price display
export const formatPrice = (amount) => {
  return `₦${Number(amount).toLocaleString()}`;
};

// Generate ticket reference
export const generateReference = () => {
  return `tx_${Math.floor(Math.random() * 1000000000)}_${Date.now()}`;
};

// Payment verification endpoints
export const VERIFICATION_ENDPOINT = '/api/verify-payment';

// Redirect URLs after payment
export const SUCCESS_URL = '/payment/success';
export const CANCEL_URL = '/payment/cancel';

// Main Paystack endpoints (using client-side integration)
export const PAYSTACK_ENDPOINTS = {
  initialize: 'https://js.paystack.co/v1/inline.js',
  verify: 'https://api.paystack.co/transaction/verify',
}; 