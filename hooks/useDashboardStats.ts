import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  // Common stats
  totalProperties?: number;
  activeListings?: number;
  totalViews?: number;
  totalInquiries?: number;

  // Admin-specific stats
  totalListings?: number;
  forRent?: number;
  forSale?: number;
  newUsersRegistered?: number;
  pendingApprovals?: number;
  pendingProperties?: number;
  pendingAgents?: number;
  monthlyRevenue?: number;
  commissionRevenue?: number;
  featuredRevenue?: number;
  totalRevenue?: number;
  yearlyRevenue?: number;
  todayRevenue?: number;
  mrr?: number; // Monthly Recurring Revenue
  arr?: number; // Annual Recurring Revenue
  arpu?: number; // Average Revenue Per User
  conversionRate?: number;
  revenueGrowth?: number;

  // Revenue breakdown
  revenueByType?: {
    subscriptions?: number;
    listingFees?: number;
    boosts?: number;
    commissions?: number;
    digitalServices?: number;
  };

  // Transaction stats
  totalTransactions?: number;
  successfulTransactions?: number;
  failedTransactions?: number;
  pendingTransactions?: number;
  averageTransactionValue?: number;

  // User-specific stats
  savedProperties?: number;
  recommendedCount?: number;
  recentSearches?: number;
  unreadMessages?: number;

  // Agent-specific stats
  listingViews?: number;
  listingSaves?: number;
  listingInquiries?: number;
  newLeads?: number;
  totalEarnings?: number;
  monthlyEarnings?: number;
  yearlyEarnings?: number;

  // Landlord-specific stats
  vacantProperties?: number;
  occupancyRate?: number;
  totalRentalIncome?: number;
  activeTenants?: number;
  pendingInquiries?: number;

  // History arrays for charts
  viewsHistory?: number[];
  searchesHistory?: number[];
  favoritesHistory?: number[];
  inquiriesHistory?: number[];
  listingsHistory?: number[];
  revenueHistory?: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
}

export interface StatsTrend {
  totalProperties: number;
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
}

interface Property {
  status?: string;
  availability?: string;
  isActive?: boolean;
  viewsCount?: number;
  viewCount?: number;
  views?: number;
  inquiries?: number;
  type?: string;
  isVerified?: boolean;
  favoriteCount?: number;
  favorites?: number;
}

const TREND_DAYS = 30;

export const useDashboardStats = (userRole: 'user' | 'agent' | 'landlord' | 'admin') => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [statsTrend, setStatsTrend] = useState<StatsTrend>({
    totalProperties: 0,
    activeListings: 0,
    totalViews: 0,
    totalInquiries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        switch (userRole) {
          case 'admin':
            await fetchAdminStats();
            break;
          case 'agent':
            await fetchAgentStats();
            break;
          case 'landlord':
            await fetchLandlordStats();
            break;
          case 'user':
          default:
            await fetchUserStats();
            break;
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
        setStats({});
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, userRole]);

  const fetchAdminStats = async () => {
    try {
      // Fetch all properties for admin
      const [allPropertiesResponse, usersResponse, notificationsResponse] = await Promise.all([
        apiClient.searchProperties({ limit: 1000 }).catch(() => ({ data: [] })),
        apiClient.getAllUsers({ limit: 1000 }).catch(() => ({ data: [] })),
        apiClient.getNotifications({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      const allProperties = extractPropertiesArray(allPropertiesResponse);
      const users = extractArrayFromResponse(usersResponse, ['data', 'users']);

      // Calculate admin-specific stats
      const totalListings = allProperties.length;
      const forRent = allProperties.filter(p => p.type?.toLowerCase().includes('rent')).length;
      const forSale = allProperties.filter(p =>
        p.type?.toLowerCase().includes('sale') ||
        p.type?.toLowerCase().includes('sell')
      ).length;

      // Get new users from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersRegistered = users.filter((u: any) =>
        new Date(u.createdAt) > thirtyDaysAgo
      ).length;

      // Pending approvals
      const pendingProperties = allProperties.filter(p =>
        p.status === 'pending' || !p.isVerified
      ).length;
      const pendingAgents = users.filter((u: any) =>
        u.role === 'agent' && !u.isVerified
      ).length;
      const pendingApprovals = pendingProperties + pendingAgents;

      // Fetch actual revenue data from analytics
      let revenueData: DashboardStats = {
        monthlyRevenue: 0,
        totalRevenue: 0,
        yearlyRevenue: 0,
        todayRevenue: 0,
        commissionRevenue: 0,
        featuredRevenue: 0,
        mrr: 0,
        arr: 0,
        arpu: 0,
        conversionRate: 0,
        revenueGrowth: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        averageTransactionValue: 0,
        revenueByType: {
          subscriptions: 0,
          listingFees: 0,
          boosts: 0,
          commissions: 0,
          digitalServices: 0,
        }
      };

      try {
        const revenueAnalytics = await apiClient.getRevenueAnalytics();

        if (revenueAnalytics) {
          revenueData = {
            totalRevenue: revenueAnalytics.totalRevenue || 0,
            monthlyRevenue: revenueAnalytics.monthlyRevenue || 0,
            yearlyRevenue: revenueAnalytics.yearlyRevenue || 0,
            todayRevenue: revenueAnalytics.todayRevenue || 0,
            mrr: revenueAnalytics.mrr || 0,
            arr: revenueAnalytics.arr || 0,
            arpu: revenueAnalytics.arpu || 0,
            conversionRate: revenueAnalytics.conversionRate || 0,
            revenueGrowth: revenueAnalytics.revenueGrowth || 0,
            totalTransactions: revenueAnalytics.totalTransactions || 0,
            successfulTransactions: revenueAnalytics.successfulTransactions || 0,
            failedTransactions: revenueAnalytics.failedTransactions || 0,
            pendingTransactions: revenueAnalytics.pendingTransactions || 0,
            averageTransactionValue: revenueAnalytics.averageTransactionValue || 0,
            revenueByType: revenueAnalytics.revenueByType || {
              subscriptions: 0,
              listingFees: 0,
              boosts: 0,
              commissions: 0,
              digitalServices: 0,
            }
          };

          // Calculate commission and featured revenue from breakdown
          revenueData.commissionRevenue = revenueAnalytics.revenueByType?.commissions || 0;
          revenueData.featuredRevenue =
            (revenueAnalytics.revenueByType?.boosts || 0) +
            (revenueAnalytics.revenueByType?.listingFees || 0);
        }

        // Fetch monthly revenue chart for history
        try {
          const monthlyChart = await apiClient.getMonthlyRevenueChart(12);
          if (monthlyChart && Array.isArray(monthlyChart)) {
            revenueData.revenueHistory = monthlyChart;
          }
        } catch (chartError) {
          console.error('Error fetching monthly revenue chart:', chartError);
        }

      } catch (revenueError) {
        console.error('Error fetching revenue analytics:', revenueError);
        // Continue with default values
      }

      setStats({
        totalListings,
        forRent,
        forSale,
        newUsersRegistered,
        pendingApprovals,
        pendingProperties,
        pendingAgents,
        ...revenueData,
      });

      await fetchTrendData([
        'listings.changePercent',
        'users.changePercent',
        'approvals.changePercent',
        'revenue.changePercent'
      ]);
    } catch (error) {
      console.error('Error in fetchAdminStats:', error);
      throw error;
    }
  };

  const fetchAgentStats = async () => {
    try {
      const propertiesResponse = await apiClient.getMyProperties();
      const agentProperties = extractPropertiesArray(propertiesResponse);

      const activeListings = countActiveListings(agentProperties);
      const listingViews = calculateTotalViews(agentProperties);
      const listingSaves = agentProperties.reduce(
        (sum, p) => sum + (p.favoriteCount || p.favorites || 0),
        0
      );

      // Get inquiries
      let listingInquiries = 0;
      let newLeads = 0;
      try {
        const inquiryStats = await apiClient.getInquiryStats();
        listingInquiries = inquiryStats?.total || inquiryStats?.data?.total || 0;

        // Get inquiries from last 30 days for "new leads"
        const inquiries = await apiClient.getMyInquiries({ limit: 1000 });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const inquiryList = extractArrayFromResponse(inquiries, ['data', 'inquiries']);
        newLeads = inquiryList.filter((inq: any) =>
          new Date(inq.createdAt) > thirtyDaysAgo
        ).length;
      } catch (inquiryError) {
        console.error('Error fetching inquiries:', inquiryError);
        listingInquiries = agentProperties.reduce((sum, p) => sum + (p.inquiries || 0), 0);
      }

      // Get actual earnings from agent's commission transactions
      let totalEarnings = 0;
      let monthlyEarnings = 0;
      let yearlyEarnings = 0;

      try {
        // Fetch all commission transactions
        const transactionsResponse = await apiClient.getUserTransactions({
          type: 'commission',
          status: 'success',
          limit: 1000
        });

        const transactions = extractArrayFromResponse(
          transactionsResponse,
          ['data', 'transactions', 'transactions']
        );

        if (transactions && transactions.length > 0) {
          // Calculate total earnings
          totalEarnings = transactions.reduce(
            (sum: number, tx: any) => sum + (tx.amount || 0),
            0
          );

          // Calculate monthly earnings (current month)
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);

          monthlyEarnings = transactions
            .filter((tx: any) => {
              const txDate = new Date(tx.completedAt || tx.createdAt);
              return txDate >= startOfMonth;
            })
            .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

          // Calculate yearly earnings (current year)
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          startOfYear.setHours(0, 0, 0, 0);

          yearlyEarnings = transactions
            .filter((tx: any) => {
              const txDate = new Date(tx.completedAt || tx.createdAt);
              return txDate >= startOfYear;
            })
            .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
        }
      } catch (earningsError) {
        console.error('Error fetching agent earnings:', earningsError);
        // Continue with default values of 0
      }

      setStats({
        activeListings,
        listingViews,
        listingSaves,
        listingInquiries,
        newLeads,
        totalEarnings,
        monthlyEarnings,
        yearlyEarnings,
      });

      await fetchTrendData([
        'activeListings.changePercent',
        'views.changePercent',
        'inquiries.changePercent',
        'leads.changePercent'
      ]);
    } catch (error) {
      console.error('Error in fetchAgentStats:', error);
      throw error;
    }
  };

  const fetchLandlordStats = async () => {
    try {
      const propertiesResponse = await apiClient.getMyProperties();
      const landlordProperties = extractPropertiesArray(propertiesResponse);

      const activeListings = countActiveListings(landlordProperties);
      const totalProperties = landlordProperties.length;
      const vacantProperties = landlordProperties.filter(p => {
        const status = p.status || p.availability;
        return status !== 'rented' && status !== 'sold';
      }).length;

      // Get landlord-specific stats from user object (tenants, income)
      let activeTenants = 0;
      let totalRentalIncome = 0;
      let occupancyRate = 0;
      let pendingInquiries = 0;

      try {
        const userProfile = await apiClient.getCurrentUser();
        activeTenants = (userProfile?.tenants || []).filter((t: any) => t.status === 'active').length;
        totalRentalIncome = userProfile?.totalRentalIncome || 0;
        occupancyRate = userProfile?.occupancyRate || 0;
      } catch (profileError) {
        console.error('Error fetching landlord profile:', profileError);
      }

      // Get inquiries
      try {
        const inquiryStats = await apiClient.getInquiryStats();
        pendingInquiries = inquiryStats?.pending || inquiryStats?.data?.pending || 0;
      } catch (inquiryError) {
        console.error('Error fetching landlord inquiries:', inquiryError);
      }

      // Calculate occupancy from properties if not stored
      if (occupancyRate === 0 && totalProperties > 0) {
        const rentedProperties = landlordProperties.filter(p => {
          const status = p.status || p.availability;
          return status === 'rented';
        }).length;
        occupancyRate = Math.round((rentedProperties / totalProperties) * 100);
      }

      setStats({
        totalProperties,
        activeListings,
        vacantProperties,
        activeTenants,
        totalRentalIncome,
        occupancyRate,
        pendingInquiries,
      });

      await fetchTrendData([
        'properties.changePercent',
        'occupancy.changePercent',
        'income.changePercent',
        'tenants.changePercent'
      ]);
    } catch (error) {
      console.error('Error in fetchLandlordStats:', error);
      throw error;
    }
  };

  const fetchUserStats = async () => {
    try {
      const [
        favoritesResponse,
        recommendationsResponse,
        searchResponse,
        notificationsResponse
      ] = await Promise.all([
        apiClient.getFavorites().catch(() => null),
        apiClient.getRecommendations({ limit: 10 }).catch(() => null),
        apiClient.getSearchHistory(20).catch(() => null),
        apiClient.getUnreadNotificationCount().catch(() => ({ count: 0 })),
      ]);

      const favorites = extractArrayFromResponse(
        favoritesResponse,
        ['favorites', 'data.favorites', 'data']
      );
      const recommendations = extractArrayFromResponse(
        recommendationsResponse,
        ['recommendations', 'data.recommendations', 'data']
      );
      const searchHistory = extractArrayFromResponse(
        searchResponse,
        ['data', 'searchHistory', 'searches']
      );

      const unreadMessages = notificationsResponse?.count ||
        notificationsResponse?.data?.count ||
        notificationsResponse?.unreadCount || 0;

      setStats({
        savedProperties: favorites.length,
        recommendedCount: recommendations.length,
        recentSearches: searchHistory.length,
        unreadMessages,
      });

      await fetchTrendData([
        'favorites.changePercent',
        'recommendations.changePercent',
        'searches.changePercent',
        'messages.changePercent'
      ]);
    } catch (error) {
      console.error('Error in fetchUserStats:', error);
      throw error;
    }
  };

  const fetchTrendData = async (trendKeys: string[]) => {
    try {
      const dashboardResp = await apiClient.getDashboardStats(TREND_DAYS).catch(() => null);
      if (!dashboardResp) return;

      const findTrendValue = (paths: string[]) => {
        for (const path of paths) {
          const value = getNestedValue(dashboardResp, path);
          if (typeof value === 'number' && Number.isFinite(value)) return value;
          if (typeof value === 'string') {
            const match = value.match(/-?\d+(?:[\.,]\d+)?/);
            if (match) return Number(match[0].replace(',', '.'));
          }
        }
        return searchForPercentage(dashboardResp);
      };

      setStatsTrend({
        totalProperties: findTrendValue([trendKeys[0], 'properties.changePercent']) ?? 0,
        activeListings: findTrendValue([trendKeys[1], 'activeListings.changePercent']) ?? 0,
        totalViews: findTrendValue([trendKeys[2], 'views.changePercent']) ?? 0,
        totalInquiries: findTrendValue([trendKeys[3], 'inquiries.changePercent']) ?? 0,
      });

      // Extract history arrays from response
      const history = dashboardResp?.history || dashboardResp?.data?.history;
      if (history) {
        setStats(prev => ({
          ...prev,
          viewsHistory: history.views || [],
          searchesHistory: history.searches || [],
          favoritesHistory: history.favorites || [],
          inquiriesHistory: history.inquiries || [],
          listingsHistory: history.listings || [],
        }));
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
      // Silently fail - trends are not critical
    }
  };

  return { stats, statsTrend, loading, error };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function extractPropertiesArray(response: any): Property[] {
  if (Array.isArray(response)) return response;
  if (response?.properties && Array.isArray(response.properties)) return response.properties;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
}

function extractArrayFromResponse(response: any, paths: string[]): any[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  for (const path of paths) {
    const value = getNestedValue(response, path);
    if (Array.isArray(value)) return value;
  }

  return [];
}

function countActiveListings(properties: Property[]): number {
  return properties.filter(p => {
    const status = p.status || p.availability;
    const isActive = p.isActive !== false;
    return (status === 'active' || status === 'available') && isActive;
  }).length;
}

function calculateTotalViews(properties: Property[]): number {
  return properties.reduce((sum, p) => {
    const views = p.viewsCount || p.viewCount || p.views || 0;
    return sum + views;
  }, 0);
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return null;
    current = current[part];
  }
  return current;
}

function searchForPercentage(obj: any, seen = new Set(), depth = 0): number | null {
  if (!obj || typeof obj !== 'object' || seen.has(obj) || depth > 6) return null;
  seen.add(obj);

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('percent') || lowerKey.includes('change') || lowerKey.includes('delta')) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const match = value.match(/-?\d+(?:[\.,]\d+)?/);
        if (match) return Number(match[0].replace(',', '.'));
      }
    }
    if (typeof value === 'object') {
      const found = searchForPercentage(value, seen, depth + 1);
      if (found != null) return found;
    }
  }

  return null;
}

export default useDashboardStats;