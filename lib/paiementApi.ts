import { apiClient } from './api';
import {
  PaymentMethod,
  Currency,
  TransactionStatus,
  TransactionType,
  BoostType,
  BoostStatus,
} from '@/types/paiement';

// ============================================
// PAYMENT API METHODS
// ============================================

export async function initializePayment(data: {
  type: TransactionType;
  amount: number;
  currency?: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/payments/initialize',
    data: { ...data, currency: data.currency ?? Currency.XAF },
  });
  return response;
}

export async function verifyPayment(data: {
  transactionId: string;
  flutterwaveReference?: string;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/payments/verify',
    data,
  });
  return response;
}

export async function getUserTransactions(params?: {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  type?: TransactionType;
  paymentMethod?: PaymentMethod;
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

export async function getSubscriptionPlans() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/subscriptions/plans',
    skipAuth: true,
  } as any);
  return response;
}

export async function getMySubscription() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/subscriptions/my-subscription',
  });
  return response;
}

export async function subscribeToPlan(data: {
  planName: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  paymentMethod?: PaymentMethod;
  discountCode?: string;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/subscriptions/subscribe',
    data,
  });
  return response;
}

export async function activateSubscription(transactionId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/subscriptions/activate/${transactionId}`,
  });
  return response;
}

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

export async function getSubscriptionUsage() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/subscriptions/usage',
  });
  return response;
}

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

export async function getBoostOptions() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/boosts/options',
    skipAuth: true,
  } as any);
  return response;
}

export async function getBoostPricing(params: {
  boostType: BoostType;
  duration: number;
}) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/boosts/pricing',
    params,
  });
  return response;
}

export async function createBoostRequest(data: {
  propertyId: string;
  boostType: BoostType;
  duration: number;
  paymentMethod?: PaymentMethod;
}) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/boosts',
    data,
  });
  return response;
}

export async function activateBoost(transactionId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/activate/${transactionId}`,
  });
  return response;
}

export async function getUserBoosts(params?: {
  status?: BoostStatus;
}) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/boosts/user',
    params,
  });
  return response;
}

export async function getPropertyBoosts(propertyId: string) {
  const response = await apiClient.request({
    method: 'GET',
    url: `/boosts/property/${propertyId}`,
  });
  return response;
}

export async function getActiveBoostedProperties(params?: {
  boostType?: BoostType;
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

export async function trackBoostImpression(boostId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/track/${boostId}/impression`,
    skipAuth: true,
  } as any);
  return response;
}

export async function trackBoostClick(boostId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/track/${boostId}/click`,
    skipAuth: true,
  } as any);
  return response;
}

export async function trackBoostInquiry(boostId: string) {
  const response = await apiClient.request({
    method: 'POST',
    url: `/boosts/track/${boostId}/inquiry`,
    skipAuth: true,
  } as any);
  return response;
}

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

export async function getWallet() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/wallet',
  });
  return response;
}

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

export async function requestWithdrawal(data: {
  amount: number;
  withdrawalMethod: PaymentMethod; // matches WithdrawFundsDto & WithdrawFundsRequest
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

export async function enableAutoWithdrawal(threshold: number) {
  const response = await apiClient.request({
    method: 'POST',
    url: '/wallet/auto-withdraw',
    data: { threshold },
  });
  return response;
}

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

export async function getRevenueOverview() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/overview',
  });
  return response;
}

export async function getMonthlyRevenueChart(months: number = 12) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/monthly-chart',
    params: { months },
  });
  return response;
}

export async function getSubscriptionAnalytics() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/subscriptions',
  });
  return response;
}

export async function getBoostAnalytics() {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/boosts',
  });
  return response;
}

export async function getTopRevenueUsers(limit: number = 10) {
  const response = await apiClient.request({
    method: 'GET',
    url: '/analytics/revenue/top-users',
    params: { limit },
  });
  return response;
}

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

export async function getTransactionByReference(txRef: string) {
  const response = await apiClient.request({
    method: 'GET',
    url: `/payments/transactions/reference/${txRef}`,
  });
  return response;
}

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