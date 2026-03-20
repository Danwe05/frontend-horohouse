import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  // Admin
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
  grossRevenue?: number;
  platformFeeRevenue?: number;
  averageBookingValue?: number;
  totalBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  cancellationRate?: number;
  averageOccupancyRate?: number;
  totalGuests?: number;
  newGuestsThisPeriod?: number;
  averageRating?: number;
  // Agent
  activeListings?: number;
  listingViews?: number;
  listingSaves?: number;
  listingInquiries?: number;
  newLeads?: number;
  totalEarnings?: number;
  monthlyEarnings?: number;
  yearlyEarnings?: number;
  // Landlord
  totalProperties?: number;
  vacantProperties?: number;
  activeTenants?: number;
  totalRentalIncome?: number;
  occupancyRate?: number;
  pendingInquiries?: number;
  // User
  savedProperties?: number;
  recommendedCount?: number;
  recentSearches?: number;
  unreadMessages?: number;
  // History sparklines
  viewsHistory?: number[];
  searchesHistory?: number[];
  favoritesHistory?: number[];
  inquiriesHistory?: number[];
  listingsHistory?: number[];
  revenueHistory?: Array<{ month: string; revenue: number; transactions: number }>;
  // Raw admin KPIs (passed through for charts to use if needed)
  _adminKPIs?: Record<string, any>;
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

// ── Build ISO date-range strings for the last N days ──────────────────────────
function buildDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export const useDashboardStats = (
  userRole: 'user' | 'agent' | 'landlord' | 'admin' | 'student',
) => {
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
          case 'student':
            setStats({});
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

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — uses real /analytics/admin/dashboard + /analytics/admin/kpis
  // Response shape: AdminDashboardAnalytics from admin-analytics.dto.ts
  // ════════════════════════════════════════════════════════════════════════
  const fetchAdminStats = async () => {
    const { startDate, endDate } = buildDateRange(TREND_DAYS);
    const prevRange = buildDateRange(TREND_DAYS * 2);    // for trend comparison

    // Parallel: current period dashboard + previous period KPIs for trend
    // NestJS: @Controller('analytics/admin') → /analytics/admin/dashboard & /analytics/admin/kpis
    const [dashboard, prevKPIs, allPropertiesResponse] = await Promise.all([
      apiClient.request({
        method: 'GET',
        url: '/analytics/admin/dashboard',
        params: { startDate, endDate, granularity: 'month' },
      }).catch(() => null),
      apiClient.request({
        method: 'GET',
        url: '/analytics/admin/kpis',
        params: { startDate: prevRange.startDate, endDate: startDate },
      }).catch(() => null),
      // Still need listing counts — backend analytics doesn't include them yet
      apiClient.searchProperties({ limit: 1 }).catch(() => ({ total: 0, data: [] })),
    ]);

    const kpis = dashboard?.kpis ?? {};

    // ── Revenue month-over-month trend ──────────────────────────────────────
    const currentRevenue  = kpis.grossRevenue ?? 0;
    const previousRevenue = prevKPIs?.grossRevenue ?? 0;
    const revenueChange   = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    // ── Bookings trend ──────────────────────────────────────────────────────
    const currentBookings  = kpis.totalBookings ?? 0;
    const previousBookings = prevKPIs?.totalBookings ?? 0;
    const bookingsChange   = previousBookings > 0
      ? Math.round(((currentBookings - previousBookings) / previousBookings) * 100)
      : currentBookings > 0 ? 100 : 0;

    // ── Property listing counts (from search endpoint total) ────────────────
    const totalListings = (allPropertiesResponse as any)?.total
      ?? (allPropertiesResponse as any)?.data?.length
      ?? 0;

    // ── New users registered (30-day KPI from admin dashboard) ─────────────
    const newUsersRegistered = kpis.newGuestsThisPeriod ?? 0;

    // ── Pending approvals still from properties search ──────────────────────
    // The admin analytics endpoints don't expose these — fall back to a targeted query
    let pendingProperties = 0;
    let pendingAgents = 0;
    try {
      const pendingProps = await apiClient.searchProperties({ status: 'pending', limit: 1 }).catch(() => ({ total: 0 }));
      pendingProperties = (pendingProps as any)?.total ?? 0;
    } catch { /* non-critical */ }

    const pendingApprovals = pendingProperties + pendingAgents;

    // ── Revenue breakdown from booking status breakdown ────────────────────
    const statusBreakdown: any[] = dashboard?.bookingStatusBreakdown ?? [];
    const commissionRevenue = statusBreakdown
      .filter((b: any) => ['confirmed', 'completed'].includes(b.status))
      .reduce((s: number, b: any) => s + (b.revenue ?? 0), 0);
    const platformFeeRevenue = kpis.platformFeeRevenue ?? 0;

    // ── Build revenueHistory from revenueOverTime ──────────────────────────
    const revenueHistory = (dashboard?.revenueOverTime ?? []).map((p: any) => ({
      month: p.period,
      revenue: p.grossRevenue,
      transactions: p.bookingCount,
    }));

    setStats({
      totalListings,
      forRent: 0,       // not available from analytics endpoint alone
      forSale: 0,       // same — extend if needed with property search by type
      newUsersRegistered,
      pendingApprovals,
      pendingProperties,
      pendingAgents,
      monthlyRevenue: currentRevenue,
      grossRevenue: currentRevenue,
      platformFeeRevenue,
      commissionRevenue,
      featuredRevenue: platformFeeRevenue,
      totalRevenue: currentRevenue,
      averageBookingValue: kpis.averageBookingValue ?? 0,
      totalBookings: currentBookings,
      completedBookings: kpis.completedBookings ?? 0,
      cancelledBookings: kpis.cancelledBookings ?? 0,
      cancellationRate: kpis.cancellationRate ?? 0,
      averageOccupancyRate: kpis.averageOccupancyRate ?? 0,
      totalGuests: kpis.totalGuests ?? 0,
      newGuestsThisPeriod: kpis.newGuestsThisPeriod ?? 0,
      averageRating: kpis.averageRating ?? 0,
      revenueHistory,
      _adminKPIs: kpis,
    });

    setStatsTrend({
      totalProperties: revenueChange,         // revenue MoM % as proxy for overall growth
      activeListings: bookingsChange,          // bookings MoM %
      totalViews: kpis.averageOccupancyRate ?? 0,
      totalInquiries: -(kpis.cancellationRate ?? 0), // cancellation rate (negative = bad)
    });
  };

  // ════════════════════════════════════════════════════════════════════════
  // AGENT — uses /properties/my/properties + /inquiries/stats + /wallet
  // ════════════════════════════════════════════════════════════════════════
  const fetchAgentStats = async () => {
    const propertiesResponse = await apiClient.getMyProperties();
    const agentProperties = extractPropertiesArray(propertiesResponse);

    const activeListings = countActiveListings(agentProperties);
    const listingViews = calculateTotalViews(agentProperties);
    const listingSaves = agentProperties.reduce(
      (sum, p) => sum + ((p as any).favoriteCount || (p as any).favorites || 0),
      0,
    );

    let listingInquiries = 0, newLeads = 0;
    try {
      const inquiryStats = await apiClient.getInquiryStats();
      listingInquiries = inquiryStats?.total || inquiryStats?.data?.total || 0;
      const inquiries = await apiClient.getMyInquiries({ limit: 1000 });
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const inquiryList = extractArrayFromResponse(inquiries, ['data', 'inquiries']);
      newLeads = inquiryList.filter(
        (inq: any) => new Date(inq.createdAt) > thirtyDaysAgo,
      ).length;
    } catch {
      listingInquiries = agentProperties.reduce(
        (sum, p) => sum + ((p as any).inquiries || 0), 0,
      );
    }

    let totalEarnings = 0, monthlyEarnings = 0, yearlyEarnings = 0;
    try {
      const txRes = await apiClient.getUserTransactions({
        status: 'success',
        limit: 1000,
      });
      const transactions = extractArrayFromResponse(txRes, ['transactions', 'data']);
      if (transactions?.length) {
        totalEarnings = transactions.reduce(
          (sum: number, tx: any) => sum + (tx.amount || 0), 0,
        );
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        monthlyEarnings = transactions
          .filter((tx: any) => new Date(tx.completedAt || tx.createdAt) >= startOfMonth)
          .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
        yearlyEarnings = transactions
          .filter((tx: any) => new Date(tx.completedAt || tx.createdAt) >= startOfYear)
          .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
      }
    } catch { /* non-critical */ }

    setStats({
      activeListings, listingViews, listingSaves,
      listingInquiries, newLeads,
      totalEarnings, monthlyEarnings, yearlyEarnings,
    });
    await fetchTrendData(['activeListings.changePercent', 'views.changePercent', 'inquiries.changePercent', 'leads.changePercent']);
  };

  // ════════════════════════════════════════════════════════════════════════
  // LANDLORD
  // ════════════════════════════════════════════════════════════════════════
  const fetchLandlordStats = async () => {
    const propertiesResponse = await apiClient.getMyProperties();
    const landlordProperties = extractPropertiesArray(propertiesResponse);

    const activeListings = countActiveListings(landlordProperties);
    const totalProperties = landlordProperties.length;
    const vacantProperties = landlordProperties.filter((p) => {
      const status = (p as any).status || (p as any).availability;
      return status !== 'rented' && status !== 'sold';
    }).length;

    let activeTenants = 0, totalRentalIncome = 0, occupancyRate = 0, pendingInquiries = 0;

    try {
      const userProfile = await apiClient.getCurrentUser();
      activeTenants = (userProfile?.tenants || []).filter(
        (t: any) => t.status === 'active',
      ).length;
      totalRentalIncome = userProfile?.totalRentalIncome || 0;
      occupancyRate = userProfile?.occupancyRate || 0;
    } catch { /* non-critical */ }

    try {
      const inquiryStats = await apiClient.getInquiryStats();
      pendingInquiries = inquiryStats?.pending || inquiryStats?.data?.pending || 0;
    } catch { /* non-critical */ }

    if (occupancyRate === 0 && totalProperties > 0) {
      const rentedProperties = landlordProperties.filter(
        (p) => ((p as any).status || (p as any).availability) === 'rented',
      ).length;
      occupancyRate = Math.round((rentedProperties / totalProperties) * 100);
    }

    setStats({
      totalProperties, activeListings, vacantProperties,
      activeTenants, totalRentalIncome, occupancyRate, pendingInquiries,
    });
    await fetchTrendData(['properties.changePercent', 'occupancy.changePercent', 'income.changePercent', 'tenants.changePercent']);
  };

  // ════════════════════════════════════════════════════════════════════════
  // USER
  // ════════════════════════════════════════════════════════════════════════
  const fetchUserStats = async () => {
    const [favoritesResponse, recommendationsResponse, searchResponse, notificationsResponse] =
      await Promise.all([
        apiClient.getFavorites().catch(() => null),
        apiClient.getRecommendations({ limit: 10 }).catch(() => null),
        apiClient.getSearchHistory(20).catch(() => null),
        apiClient.getUnreadNotificationCount().catch(() => ({ count: 0 })),
      ]);

    const favorites = extractArrayFromResponse(favoritesResponse, ['favorites', 'data.favorites', 'data']);
    const recommendations = extractArrayFromResponse(recommendationsResponse, ['recommendations', 'data.recommendations', 'data']);
    const searchHistory = extractArrayFromResponse(searchResponse, ['data', 'searchHistory', 'searches']);
    const unreadMessages =
      notificationsResponse?.count ||
      notificationsResponse?.data?.count ||
      notificationsResponse?.unreadCount || 0;

    setStats({
      savedProperties: favorites.length,
      recommendedCount: recommendations.length,
      recentSearches: searchHistory.length,
      unreadMessages,
    });
    await fetchTrendData(['favorites.changePercent', 'recommendations.changePercent', 'searches.changePercent', 'messages.changePercent']);
  };

  // ════════════════════════════════════════════════════════════════════════
  // TREND (non-admin roles only — admin sets trends directly from KPI comparison)
  // ════════════════════════════════════════════════════════════════════════
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
        activeListings:  findTrendValue([trendKeys[1], 'activeListings.changePercent']) ?? 0,
        totalViews:      findTrendValue([trendKeys[2], 'views.changePercent']) ?? 0,
        totalInquiries:  findTrendValue([trendKeys[3], 'inquiries.changePercent']) ?? 0,
      });

      const history = dashboardResp?.history || dashboardResp?.data?.history;
      if (history) {
        setStats((prev) => ({
          ...prev,
          viewsHistory:     history.views      || [],
          searchesHistory:  history.searches   || [],
          favoritesHistory: history.favorites  || [],
          inquiriesHistory: history.inquiries  || [],
          listingsHistory:  history.listings   || [],
        }));
      }
    } catch { /* silently ignore trend errors */ }
  };

  return { stats, statsTrend, loading, error };
};

// ─── Utility functions ────────────────────────────────────────────────────────

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
  return properties.filter((p) => {
    const status = (p as any).status || (p as any).availability;
    return (status === 'active' || status === 'available') && (p as any).isActive !== false;
  }).length;
}

function calculateTotalViews(properties: Property[]): number {
  return properties.reduce(
    (sum, p) => sum + ((p as any).viewsCount || (p as any).viewCount || (p as any).views || 0),
    0,
  );
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((cur, part) => (cur == null ? null : cur[part]), obj);
}

function searchForPercentage(obj: any, seen = new Set(), depth = 0): number | null {
  if (!obj || typeof obj !== 'object' || seen.has(obj) || depth > 6) return null;
  seen.add(obj);
  for (const [key, value] of Object.entries(obj)) {
    const lk = key.toLowerCase();
    if (lk.includes('percent') || lk.includes('change') || lk.includes('delta')) {
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