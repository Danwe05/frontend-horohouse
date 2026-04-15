// ============================================
// ENUMS - UPDATED TO MATCH BACKEND
// ============================================

export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  LISTING_FEE = 'listing_fee',
  BOOST = 'boost',
  COMMISSION = 'commission',
  DIGITAL_SERVICE = 'digital_service',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  ORANGE_MONEY = 'orange_money',
  MTN_MOMO = 'mtn_momo',
  // MOBILE_MONEY removed — use getMobileMoneyPaymentMethod(provider) instead
}

export enum Currency {
  XAF = 'XAF',
  USD = 'USD',
  EUR = 'EUR',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum BillingCycle {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum BoostType {
  BASIC = 'basic',
  PREMIUM = 'premium',
  FEATURED = 'featured',
}

export enum BoostStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
}

export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ============================================
// HELPER TYPE FOR MOBILE MONEY
// ============================================

export type MobileMoneyProvider = 'ORANGE' | 'MTN';

/**
 * Use this helper wherever you previously used PaymentMethod.MOBILE_MONEY.
 * Resolves to the correct backend-compatible enum value based on the provider.
 */
export const getMobileMoneyPaymentMethod = (provider: MobileMoneyProvider): PaymentMethod => {
  return provider === 'ORANGE' ? PaymentMethod.ORANGE_MONEY : PaymentMethod.MTN_MOMO;
};

// ============================================
// TRANSACTION TYPES
// ============================================

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  description?: string;
  reference: string;
  flutterwaveReference?: string;
  metadata?: Record<string, any>;
  paymentLink?: string;
  propertyId?: string;
  subscriptionId?: string;
  boostId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  type?: TransactionType;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface InitializePaymentRequest {
  type: TransactionType;
  amount: number;
  currency?: Currency;
  paymentMethod: PaymentMethod;
  propertyId?: string;
  subscriptionPlan?: string;
  billingCycle?: BillingCycle;
  boostType?: BoostType;
  boostDuration?: number;
  description?: string;
  metadata?: Record<string, any>;
  redirectUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export interface InitializePaymentResponse {
  transaction: Transaction;
  paymentLink: string;
  reference: string;
}

export interface VerifyPaymentRequest {
  transactionId: string;
  flutterwaveReference?: string;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export interface SubscriptionPlan {
  name: string;
  displayName: string;
  description: string;
  pricing: {
    weekly?: number;
    monthly: number;
    quarterly?: number;
    yearly?: number;
  };
  features: {
    // Generic
    maxListings: number;
    boostsPerMonth: number;
    featuredListings: boolean;
    prioritySupport: boolean;
    analyticsAccess?: boolean;
    analytics?: boolean;
    customBranding?: boolean;
    apiAccess?: boolean;
    // Landlord / Host
    role?: 'landlord' | 'agent' | 'student' | 'user';
    maxProperties?: number;
    bookingCalendar?: boolean;
    shortTermRentalSupport?: boolean;
    smartPricing?: boolean;
    maintenanceTracking?: boolean;
    premiumVisibility?: boolean;
    dedicatedSupport?: boolean;
    [key: string]: any;
  };
  popular?: boolean;
  recommended?: boolean;
  metadata?: {
    role?: string;
    badge?: string;
    [key: string]: any;
  };
}

export interface Subscription {
  _id: string;
  userId: string;
  plan: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  features: {
    maxListings: number;
    boostsPerMonth: number;
    featuredListings: boolean;
    prioritySupport: boolean;
    analyticsAccess: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    [key: string]: any;
  };
  listingsUsed: number;
  boostsUsed: number;
  transactionId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionUsage {
  subscription: {
    plan: string;
    status: SubscriptionStatus;
    endDate: string;
  };
  usage: {
    listings: {
      used: number;
      limit: number;
      remaining: number | 'Unlimited';
    };
    boosts: {
      used: number;
      limit: number;
      remaining: number | 'Unlimited';
    };
  };
}

export interface CreateSubscriptionRequest {
  planName: string;
  billingCycle: BillingCycle;
  discountCode?: string;
  paymentMethod?: PaymentMethod;
}

export interface SubscribeResponse {
  message: string;
  transaction: Transaction;
  paymentLink: string;
  plan: {
    name: string;
    price: number;
    billingCycle: BillingCycle;
  };
}

export interface CancelSubscriptionRequest {
  reason: string;
  feedback?: string;
  cancelImmediately?: boolean;
}

// ============================================
// BOOST TYPES
// ============================================

export interface BoostOption {
  type: BoostType;
  name: string;
  description: string;
  features: string[];
  pricing: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  multiplier: number;
  priority: number;
}

export interface ListingBoost {
  _id: string;
  userId: string;
  propertyId: string;
  transactionId?: string;
  boostType: BoostType;
  status: BoostStatus;
  startDate: string;
  endDate: string;
  duration: number;
  price: number;
  impressions: number;
  clicks: number;
  inquiries: number;
  metadata?: Record<string, any>;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoostRequest {
  propertyId: string;
  boostType: BoostType;
  duration: number;
  metadata?: Record<string, any>;
}

export interface BoostPricingResponse {
  price: number;
}

export interface CancelBoostRequest {
  reason: string;
}

export interface BoostStats {
  impressions: number;
  clicks: number;
  inquiries: number;
  ctr: number;
  conversionRate: number;
}

// ============================================
// WALLET TYPES
// ============================================

export interface Wallet {
  _id: string;
  userId: string;
  balance: number;
  currency: Currency;
  bankAccount?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  };
  mobileMoneyAccount?: {
    phoneNumber: string;
    provider: MobileMoneyProvider;
  };
  autoWithdraw: {
    enabled: boolean;
    threshold: number;
  };
  totalEarnings: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  _id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface WithdrawalRequest {
  _id: string;
  userId: string;
  walletId: string;
  amount: number;
  withdrawalMethod: PaymentMethod;
  accountDetails: {
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
    phoneNumber?: string;
  };
  status: WithdrawalStatus;
  processedAt?: string;
  failureReason?: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletStats {
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  recentTransactions: WalletTransaction[];
}

export interface UpdateBankAccountRequest {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
}

export interface UpdateMobileMoneyRequest {
  phoneNumber: string;
  provider: MobileMoneyProvider;
}

export interface WithdrawFundsRequest {
  amount: number;
  withdrawalMethod: PaymentMethod;
  accountNumber: string;
  accountName?: string;
  bankCode?: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  todayRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageTransactionValue: number;
  revenueByType: {
    subscriptions: number;
    listingFees: number;
    boosts: number;
    commissions: number;
    digitalServices: number;
  };
  mrr: number;
  arr: number;
  arpu: number;
  conversionRate: number;
  revenueGrowth: number;
  paymentMethodsDistribution: Array<{
    method: PaymentMethod;
    count: number;
    revenue: number;
    percentage: number;
  }>;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  transactions: number;
  avgTransactionValue: number;
}

export interface SubscriptionAnalytics {
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  subscriptionsByPlan: Array<{
    _id: string;
    count: number;
  }>;
  churnRate: number;
}

export interface BoostAnalytics {
  totalBoosts: number;
  activeBoosts: number;
  boostsByType: Array<{
    _id: BoostType;
    count: number;
  }>;
  boostRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
}

export interface TopRevenueUser {
  userId: string;
  userName: string;
  userEmail: string;
  totalRevenue: number;
  transactionCount: number;
}

export interface AnalyticsSummary {
  revenue: {
    total: number;
    monthly: number;
    yearly: number;
    today: number;
    mrr: number;
    arr: number;
    growth: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    conversionRate: number;
    averageValue: number;
  };
  subscriptions: {
    active: number;
    expired: number;
    cancelled: number;
    churnRate: number;
    byPlan: Array<{ _id: string; count: number }>;
  };
  boosts: {
    total: number;
    active: number;
    revenue: number;
    impressions: number;
    clicks: number;
    ctr: number;
    byType: Array<{ _id: BoostType; count: number }>;
  };
  revenueBreakdown: {
    subscriptions: number;
    listingFees: number;
    boosts: number;
    commissions: number;
    digitalServices: number;
  };
  paymentMethods: Array<{
    method: PaymentMethod;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  metrics: {
    arpu: number;
    ltv: number;
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    [key: string]: any;
  };
}

// ============================================
// FORM TYPES
// ============================================

export interface PaymentFormData {
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string;
}

export interface SubscriptionFormData {
  planName: string;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  discountCode?: string;
}

export interface BoostFormData {
  propertyId: string;
  boostType: BoostType;
  duration: number;
  paymentMethod: PaymentMethod;
}

export interface WithdrawalFormData {
  amount: number;
  withdrawalMethod: PaymentMethod;
  accountNumber: string;
  accountName?: string;
  bankCode?: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface PaymentState {
  loading: boolean;
  error: string | null;
  transaction: Transaction | null;
  paymentLink: string | null;
}

export interface SubscriptionState {
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  usage: SubscriptionUsage | null;
}

export interface BoostState {
  loading: boolean;
  error: string | null;
  boosts: ListingBoost[];
  activeBoost: ListingBoost | null;
  options: BoostOption[];
}

export interface WalletState {
  loading: boolean;
  error: string | null;
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  stats: WalletStats | null;
  withdrawals: WithdrawalRequest[];
}

// ============================================
// UTILITY TYPES
// ============================================

export type ResourceType = 'listings' | 'boosts';

export interface ResourceLimitCheck {
  canUse: boolean;
  used: number;
  limit: number;
  remaining: number | 'Unlimited';
  requiresUpgrade: boolean;
  message?: string;
}

export interface PaymentConfig {
  flutterwavePublicKey: string;
  currency: Currency;
  supportedPaymentMethods: PaymentMethod[];
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
}

// ============================================
// CONSTANTS
// ============================================

export const SUBSCRIPTION_PLAN_NAMES = {
  // STUDENT
  STUDENT_FREE: 'student_free',

  // USER
  USER_FREE: 'user_free',
  USER_PREMIUM: 'user_premium',

  // AGENT
  AGENT_FREE: 'agent_free',
  AGENT_BASIC: 'agent_basic',
  AGENT_PRO: 'agent_pro',
  AGENT_ELITE: 'agent_elite',

  // LANDLORD
  LANDLORD_FREE: 'landlord_free',
  LANDLORD_BASIC: 'landlord_basic',
  LANDLORD_PRO: 'landlord_pro',

  // HOST
  HOST_FREE: 'host_free',
  HOST_STARTER: 'host_starter',
  HOST_GROWTH: 'host_growth',
  HOST_PRO: 'host_pro',
  HOST_ELITE: 'host_elite',
} as const;

export const BOOST_DURATIONS = {
  ONE_DAY: 24,
  THREE_DAYS: 72,
  ONE_WEEK: 168,
  TWO_WEEKS: 336,
  ONE_MONTH: 720,
} as const;

export const PAYMENT_STATUS_COLORS = {
  [TransactionStatus.PENDING]: 'yellow',
  [TransactionStatus.SUCCESS]: 'green',
  [TransactionStatus.FAILED]: 'red',
  [TransactionStatus.CANCELLED]: 'gray',
} as const;

export const SUBSCRIPTION_STATUS_COLORS = {
  [SubscriptionStatus.ACTIVE]: 'green',
  [SubscriptionStatus.EXPIRED]: 'gray',
  [SubscriptionStatus.CANCELLED]: 'red',
  [SubscriptionStatus.PENDING]: 'yellow',
} as const;

// ============================================
// PAYMENT METHOD DISPLAY HELPERS
// ============================================

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CARD]: 'Credit/Debit Card',
  [PaymentMethod.ORANGE_MONEY]: 'Orange Money',
  [PaymentMethod.MTN_MOMO]: 'MTN Mobile Money',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.WALLET]: 'Wallet Balance',
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  return PAYMENT_METHOD_LABELS[method] || method;
};