import { useState, useEffect, useCallback } from 'react';
import { paiementApi } from '@/lib/paiementApi';
import {
  Transaction,
  TransactionQueryParams,
  InitializePaymentRequest,
  InitializePaymentResponse,
  Subscription,
  SubscriptionPlan,
  SubscriptionUsage,
  CreateSubscriptionRequest,
  CancelSubscriptionRequest,
  ListingBoost,
  BoostOption,
  CreateBoostRequest,
  BoostType,
  BoostStatus,
  Wallet,
  WalletTransaction,
  WalletStats,
  UpdateBankAccountRequest,
  UpdateMobileMoneyRequest,
  WithdrawFundsRequest,
  WithdrawalRequest,
  RevenueAnalytics,
  SubscriptionAnalytics,
  BoostAnalytics,
  AnalyticsSummary,
  ResourceType,
  ResourceLimitCheck,
} from '@/types/paiement';

// ============================================
// PAYMENT HOOKS
// ============================================

/**
 * Hook for managing payment transactions
 */
export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  const initializePayment = useCallback(async (data: InitializePaymentRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.initializePayment(data);
      setTransaction(response.transaction);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to initialize payment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.verifyPayment({ transactionId });
      setTransaction(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify payment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (params?: TransactionQueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getUserTransactions(params);
      setTransactions(response.transactions);
      setPagination(response.pagination);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch transactions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getTransactionById(id);
      setTransaction(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch transaction';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    transaction,
    transactions,
    pagination,
    initializePayment,
    verifyPayment,
    fetchTransactions,
    getTransactionById,
  };
}

// ============================================
// SUBSCRIPTION HOOKS
// ============================================

/**
 * Hook for managing user subscriptions
 */
export function useSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);

  // Fetch subscription plans
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getSubscriptionPlans();
      setPlans(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch plans';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current subscription
  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getMySubscription();
      setSubscription(response.subscription);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to a plan
 // In usePayment.ts - useSubscription hook
const subscribe = useCallback(async (data: CreateSubscriptionRequest) => {
  setLoading(true);
  setError(null);
  try {
    const response = await paiementApi.subscribeToPlan(data as any);
    // ✅ Return the response so the component can access paymentLink
    return response;
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || 'Failed to subscribe';
    setError(errorMessage);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  // Activate subscription
  const activateSubscription = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.activateSubscription(transactionId);
      setSubscription(response.subscription);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to activate subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async (data: CancelSubscriptionRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.cancelSubscription(data);
      setSubscription(response.subscription);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch usage statistics
  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getSubscriptionUsage();
      setUsage(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch usage';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check resource limit
  const checkLimit = useCallback(async (resourceType: ResourceType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.checkResourceLimit(resourceType);
      return response as ResourceLimitCheck;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to check limit';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchPlans();
    fetchSubscription();
  }, [fetchPlans, fetchSubscription]);

  return {
    loading,
    error,
    subscription,
    plans,
    usage,
    fetchPlans,
    fetchSubscription,
    subscribe,
    activateSubscription,
    cancelSubscription,
    fetchUsage,
    checkLimit,
  };
}

// ============================================
// BOOST HOOKS
// ============================================

/**
 * Hook for managing property boosts
 */
export function useBoost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boosts, setBoosts] = useState<ListingBoost[]>([]);
  const [activeBoost, setActiveBoost] = useState<ListingBoost | null>(null);
  const [options, setOptions] = useState<BoostOption[]>([]);

  // Fetch boost options
  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getBoostOptions();
      setOptions(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch boost options';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get boost pricing
  const getPricing = useCallback(async (boostType: BoostType, duration: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getBoostPricing({ boostType, duration });
      return response.price;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch pricing';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create boost request
  const createBoost = useCallback(async (data: CreateBoostRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.createBoostRequest(data);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create boost';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user boosts
  const fetchUserBoosts = useCallback(async (status?: BoostStatus) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getUserBoosts({ status });
      setBoosts(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch boosts';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch property boosts
  const fetchPropertyBoosts = useCallback(async (propertyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getPropertyBoosts(propertyId);
      setBoosts(response);
      if (response.length > 0) {
        const active = response.find((b: ListingBoost) => b.status === 'active');
        setActiveBoost(active || null);
      }
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch property boosts';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel boost
  const cancelBoost = useCallback(async (boostId: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.cancelBoost(boostId, reason);
      // Refresh boosts after cancellation
      await fetchUserBoosts();
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel boost';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserBoosts]);

  // Track boost events
  const trackImpression = useCallback(async (boostId: string) => {
    try {
      await paiementApi.trackBoostImpression(boostId);
    } catch (err) {
      console.error('Failed to track impression:', err);
    }
  }, []);

  const trackClick = useCallback(async (boostId: string) => {
    try {
      await paiementApi.trackBoostClick(boostId);
    } catch (err) {
      console.error('Failed to track click:', err);
    }
  }, []);

  const trackInquiry = useCallback(async (boostId: string) => {
    try {
      await paiementApi.trackBoostInquiry(boostId);
    } catch (err) {
      console.error('Failed to track inquiry:', err);
    }
  }, []);

  // Auto-fetch options on mount
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    loading,
    error,
    boosts,
    activeBoost,
    options,
    fetchOptions,
    getPricing,
    createBoost,
    fetchUserBoosts,
    fetchPropertyBoosts,
    cancelBoost,
    trackImpression,
    trackClick,
    trackInquiry,
  };
}

// ============================================
// WALLET HOOKS
// ============================================

/**
 * Hook for managing user wallet
 */
export function useWallet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);

  // Fetch wallet
  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getWallet();
      setWallet(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Request withdrawal
  const requestWithdrawal = useCallback(async (data: WithdrawFundsRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.requestWithdrawal(data);
      // Refresh wallet after withdrawal
      await fetchWallet();
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to request withdrawal';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWallet]);

  // Update bank account
  const updateBankAccount = useCallback(async (data: UpdateBankAccountRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.updateBankAccount(data);
      setWallet(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update bank account';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update mobile money account
  const updateMobileMoneyAccount = useCallback(async (data: UpdateMobileMoneyRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.updateMobileMoneyAccount(data);
      setWallet(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update mobile money account';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enable auto-withdrawal
  const enableAutoWithdrawal = useCallback(async (threshold: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.enableAutoWithdrawal(threshold);
      setWallet(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to enable auto-withdrawal';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch wallet transactions
  const fetchTransactions = useCallback(async (limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getWalletTransactions({ limit });
      setTransactions(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch transactions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch wallet stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getWalletStats();
      setStats(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch wallet on mount
  useEffect(() => {
    fetchWallet();
    fetchStats();
  }, [fetchWallet, fetchStats]);

  return {
    loading,
    error,
    wallet,
    transactions,
    stats,
    fetchWallet,
    requestWithdrawal,
    updateBankAccount,
    updateMobileMoneyAccount,
    enableAutoWithdrawal,
    fetchTransactions,
    fetchStats,
  };
}

// ============================================
// ANALYTICS HOOKS (Admin)
// ============================================

/**
 * Hook for revenue analytics (admin only)
 */
export function useRevenueAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<RevenueAnalytics | null>(null);
  const [monthlyChart, setMonthlyChart] = useState<any[]>([]);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [boostAnalytics, setBoostAnalytics] = useState<BoostAnalytics | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getRevenueOverview();
      setOverview(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch revenue overview';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyChart = useCallback(async (months: number = 12) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getMonthlyRevenueChart(months);
      setMonthlyChart(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch monthly chart';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscriptionAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getSubscriptionAnalytics();
      setSubscriptionAnalytics(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch subscription analytics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBoostAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getBoostAnalytics();
      setBoostAnalytics(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch boost analytics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paiementApi.getAnalyticsSummary();
      setSummary(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch summary';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    overview,
    monthlyChart,
    subscriptionAnalytics,
    boostAnalytics,
    summary,
    fetchOverview,
    fetchMonthlyChart,
    fetchSubscriptionAnalytics,
    fetchBoostAnalytics,
    fetchSummary,
  };
}