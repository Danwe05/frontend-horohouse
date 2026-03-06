import { apiClient } from './api';

// ============================================
// PAYMENT API METHODS
// ============================================

/**
 * Initialize a new payment
 */
export async function initializePayment(data: {
  type: 'subscription' | 'listing_fee' | 'boost' | 'commission' | 'digital_service';
  amount: number;
  currency: 'XAF' | 'USD' | 'EUR';
  paymentMethod: 'wallet' | 'bank_transfer' | 'card' | 'orange_money' | 'mtn_momo';
  description?: string;
  metadata?: Record<string, any>;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/payments/initialize',
    data,
  });
  return response;
}

/**
 * Verify payment status
 */
export async function verifyPayment(data: {
  transactionId: string;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/payments/verify',
    data,
  });
  return response;
}

/**
 * Get user transactions
 */
export async function getUserTransactions(params?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'success' | 'failed' | 'cancelled';
  type?: 'subscription' | 'listing_fee' | 'boost' | 'commission' | 'digital_service';
  paymentMethod?: 'wallet' | 'bank_transfer' | 'card' | 'orange_money' | 'mtn_momo';
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/payments/transactions',
    params,
  });
  return response;
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id: string) {
  const response = await apiClient.request({
    method: 'GET',
    url: `/payments/transactions/${id}`,
  });
  return response;
}

// ============================================
// SUBSCRIPTION API METHODS
// ============================================

/**
 * Get all available subscription plans (public)
 */
export async function getSubscriptionPlans() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/subscriptions/plans',
    skipAuth: true,
  } as any);
  return response;
}

/**
 * Get current user's subscription
 */
export async function getMySubscription() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/subscriptions/my-subscription',
  });
  return response;
}

/**
 * Subscribe to a plan - FIXED to match backend enum
 */
export async function subscribeToPlan(data: {
  planName: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  paymentMethod?: 'wallet' | 'bank_transfer' | 'card' | 'orange_money' | 'mtn_momo';
  discountCode?: string;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/subscriptions/subscribe',
    data,
  });
  return response;
}

/**
 * Activate subscription after payment
 */
export async function activateSubscription(transactionId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/subscriptions/activate/${transactionId}`,
  });
  return response;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(data: {
  reason?: string;
  feedback?: string;
}) {
  const response = await apiClient.request({
    method: 'PATCH',
    url: '/subscriptions/cancel',
    data,
  });
  return response;
}

/**
 * Get subscription usage statistics
 */
export async function getSubscriptionUsage() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/subscriptions/usage',
  });
  return response;
}

/**
 * Check if user can use a resource (listings/boosts)
 */
export async function checkResourceLimit(resourceType: 'listings' | 'boosts') {
  const response = await apiClient.request({
    method: 'GET',
    url: `/subscriptions/check-limit/${resourceType}`,
  });
  return response;
}

// ============================================
// LISTING BOOST API METHODS
// ============================================

/**
 * Get available boost options and pricing (public)
 */
export async function getBoostOptions() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/boosts/options',
    skipAuth: true,
  } as any);
  return response;
}

/**
 * Get price for a boost type and duration
 */
export async function getBoostPricing(params: {
  boostType: 'basic' | 'premium' | 'featured';
  duration: number;
}) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/boosts/pricing',
    params,
  });
  return response;
}

/**
 * Create a boost request for a property
 */
export async function createBoostRequest(data: {
  propertyId: string;
  boostType: 'basic' | 'premium' | 'featured';
  duration: number;
  paymentMethod?: 'wallet' | 'bank_transfer' | 'card' | 'orange_money' | 'mtn_momo';
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/boosts',
    data,
  });
  return response;
}

/**
 * Activate boost after payment (admin)
 */
export async function activateBoost(transactionId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/activate/${transactionId}`,
  });
  return response;
}

/**
 * Get current user's boosts
 */
export async function getUserBoosts(params?: {
  status?: 'pending' | 'active' | 'expired' | 'cancelled';
}) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/boosts/user',
    params,
  });
  return response;
}

/**
 * Get boost history for a property
 */
export async function getPropertyBoosts(propertyId: string) {
  const response = await apiClient.request({
    method: 'GET',
    url: `/boosts/property/${propertyId}`,
  });
  return response;
}

/**
 * Get active boosted properties (public)
 */
export async function getActiveBoostedProperties(params?: {
  boostType?: 'basic' | 'premium' | 'featured';
  limit?: number;
}) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/boosts/active',
    params,
    skipAuth: true,
  } as any);
  return response;
}

/**
 * Track a boost impression
 */
export async function trackBoostImpression(boostId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/track/${boostId}/impression`,
    skipAuth: true,
  } as any);
  return response;
}

/**
 * Track a boost click
 */
export async function trackBoostClick(boostId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/track/${boostId}/click`,
    skipAuth: true,
  } as any);
  return response;
}

/**
 * Track a boost inquiry
 */
export async function trackBoostInquiry(boostId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/track/${boostId}/inquiry`,
    skipAuth: true,
  } as any);
  return response;
}

/**
 * Cancel a boost
 */
export async function cancelBoost(boostId: string, reason: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/${boostId}/cancel`,
    data: { reason },
  });
  return response;
}

// ============================================
// WALLET API METHODS
// ============================================

/**
 * Get or create wallet for current user
 */
export async function getWallet() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/wallet',
  });
  return response;
}

/**
 * Credit a user wallet (admin only)
 */
export async function creditWallet(data: {
  userId?: string;
  amount: number;
  description: string;
  reference?: string;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/wallet/credit',
    data,
  });
  return response;
}

/**
 * Debit a user wallet (admin only)
 */
export async function debitWallet(data: {
  userId?: string;
  amount: number;
  description: string;
  reference?: string;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/wallet/debit',
    data,
  });
  return response;
}

/**
 * Request a wallet withdrawal
 */
export async function requestWithdrawal(data: {
  amount: number;
  withdrawalMethod: 'bank_transfer' | 'orange_money' | 'mtn_momo';
  accountNumber: string;
  accountName?: string;
  bankCode?: string;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/wallet/withdraw',
    data,
  });
  return response;
}

/**
 * Update user's bank account details
 */
export async function updateBankAccount(data: {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/wallet/bank',
    data,
  });
  return response;
}

/**
 * Update user's mobile money details
 */
export async function updateMobileMoneyAccount(data: {
  phoneNumber: string;
  provider: 'MTN' | 'ORANGE';
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/wallet/mobile',
    data,
  });
  return response;
}

/**
 * Enable auto-withdrawal with threshold
 */
export async function enableAutoWithdrawal(threshold: number) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/wallet/auto-withdraw',
    data: { threshold },
  });
  return response;
}

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(params?: {
  limit?: number;
}) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/wallet/transactions',
    params,
  });
  return response;
}

/**
 * Get wallet statistics
 */
export async function getWalletStats() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/wallet/stats',
  });
  return response;
}

// ============================================
// REVENUE ANALYTICS API METHODS (Admin Only)
// ============================================

/**
 * Get comprehensive revenue analytics overview
 */
export async function getRevenueOverview() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/overview',
  });
  return response;
}

/**
 * Get monthly revenue chart data
 */
export async function getMonthlyRevenueChart(months: number = 12) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/monthly-chart',
    params: { months },
  });
  return response;
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/subscriptions',
  });
  return response;
}

/**
 * Get listing boost analytics
 */
export async function getBoostAnalytics() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/boosts',
  });
  return response;
}

/**
 * Get top revenue generating users
 */
export async function getTopRevenueUsers(limit: number = 10) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/top-users',
    params: { limit },
  });
  return response;
}

/**
 * Get consolidated analytics summary
 */
export async function getAnalyticsSummary() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/summary',
  });
  return response;
}

// ============================================
// ADMIN PAYMENT ENDPOINTS
// ============================================

/**
 * Get all transactions (admin only)
 */
export async function getAllTransactions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/payments/admin/transactions',
    params,
  });
  return response;
}

/**
 * Get transaction by Flutterwave reference
 */
export async function getTransactionByReference(txRef: string) {
  const response = await apiClient.request({
    method: 'GET',
    url: `/payments/transactions/reference/${txRef}`,
  });
  return response;
}

/**
 * Get payment analytics (admin only)
 */
export async function getPaymentAnalytics() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/payments/admin/analytics',
  });
  return response;
}

// ============================================
// EXPORT ALL
// ============================================

export const paiementApi = {
  // Payments
  initializePayment,
  verifyPayment,
  getUserTransactions,
  getTransactionById,
  getAllTransactions,
  getPaymentAnalytics,
  getTransactionByReference,
  
  // Subscriptions
  getSubscriptionPlans,
  getMySubscription,
  subscribeToPlan,
  activateSubscription,
  cancelSubscription,
  getSubscriptionUsage,
  checkResourceLimit,
  
  // Boosts
  getBoostOptions,
  getBoostPricing,
  createBoostRequest,
  activateBoost,
  getUserBoosts,
  getPropertyBoosts,
  getActiveBoostedProperties,
  trackBoostImpression,
  trackBoostClick,
  trackBoostInquiry,
  cancelBoost,
  
  // Wallet
  getWallet,
  creditWallet,
  debitWallet,
  requestWithdrawal,
  updateBankAccount,
  updateMobileMoneyAccount,
  enableAutoWithdrawal,
  getWalletTransactions,
  getWalletStats,
  
  // Revenue Analytics
  getRevenueOverview,
  getMonthlyRevenueChart,
  getSubscriptionAnalytics,
  getBoostAnalytics,
  getTopRevenueUsers,
  getAnalyticsSummary,
};

export default paiementApi;