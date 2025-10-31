import { apiClient } from '../api';

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsQueryParams extends DateRangeParams {
  granularity?: 'day' | 'week' | 'month';
}

export interface ExportParams extends DateRangeParams {
  format?: 'csv' | 'json' | 'pdf';
}

// KPI Interfaces
export interface KPI {
  value: number;
  label: string;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
}

// Chart Data Interfaces
export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface PropertyEngagement {
  id: string;
  title: string;
  views: number;
  inquiries: number;
  saves: number;
  price: number;
  image?: string;
  engagementScore?: number;
}

export interface CityEngagement {
  city: string;
  views: number;
  inquiries: number;
  properties?: number;
}

export interface Activity {
  id: string;
  type: string;
  propertyTitle: string;
  timestamp: Date;
  city?: string;
  description?: string;
}

export interface ConversionMetrics {
  totalInquiries: number;
  responded: number;
  closed: number;
  conversionPercentage: number;
  responseRate?: number;
}

export interface Insight {
  type: 'success' | 'warning' | 'info' | 'neutral';
  message: string;
  actionable?: boolean;
  actionText?: string;
  actionUrl?: string;
}

// Regular User Analytics Response
export interface RegularUserAnalytics {
  kpis: {
    savedProperties: number;
    recentlyViewed: number;
    contactedAgents: number;
    completedTransactions: number;
  };
  engagementOverTime: ChartDataPoint[];
  propertyTypeInterest: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Activity[];
  insights: string[];
}

// Agent Analytics Response
export interface AgentAnalytics {
  kpis: {
    totalViews: number;
    inquiriesReceived: number;
    savedProperties: number;
    activeListings: number;
    estimatedRevenue: number;
  };
  engagementOverTime: ChartDataPoint[];
  topPerformingListings: PropertyEngagement[];
  engagementByCity: CityEngagement[];
  conversionRate: ConversionMetrics;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

// Comparison Response
export interface ComparisonData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  percentChange: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AnalyticsComparison {
  current: RegularUserAnalytics | AgentAnalytics;
  previous: RegularUserAnalytics | AgentAnalytics;
  comparison: {
    [key: string]: ComparisonData;
  };
  period: {
    current: {
      startDate: string;
      endDate: string;
    };
    previous: {
      startDate: string;
      endDate: string;
    };
  };
}

// Engagement Response
export interface EngagementResponse {
  engagementOverTime: ChartDataPoint[];
  granularity: 'day' | 'week' | 'month';
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalViews: number;
    totalSearches: number;
    totalSaves: number;
    totalInquiries?: number;
    averageDaily: {
      views: number;
      searches: number;
      saves: number;
    };
  };
}

class AnalyticsService {
  /**
   * Get analytics dashboard data with normalization
   */
  async getDashboard(params?: DateRangeParams): Promise<RegularUserAnalytics | AgentAnalytics> {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/analytics/dashboard',
        params,
      });
      
      // Normalize the response to ensure all required fields exist
      return this.normalizeAnalyticsData(response);
    } catch (error) {
      console.error('Error fetching analytics dashboard:', error);
      // Return default structure on error
      return this.getDefaultAnalyticsData();
    }
  }

  /**
   * Normalize analytics data to ensure all fields exist with proper values
   */
  private normalizeAnalyticsData(data: any): RegularUserAnalytics | AgentAnalytics {
    // Check if this is agent or regular user data based on KPIs
    const isAgent = 'totalViews' in (data.kpis || {});

    if (isAgent) {
      return this.normalizeAgentAnalytics(data);
    } else {
      return this.normalizeRegularUserAnalytics(data);
    }
  }

  /**
   * Normalize regular user analytics
   */
  private normalizeRegularUserAnalytics(data: any): RegularUserAnalytics {
    const normalized: RegularUserAnalytics = {
      kpis: {
        savedProperties: data.kpis?.savedProperties || 0,
        recentlyViewed: data.kpis?.recentlyViewed || 0,
        contactedAgents: data.kpis?.contactedAgents || 0,
        completedTransactions: data.kpis?.completedTransactions || 0,
      },
      engagementOverTime: this.normalizeEngagementData(data.engagementOverTime || [], 'user'),
      propertyTypeInterest: (data.propertyTypeInterest || []).map((item: any) => ({
        type: item.type || 'Unknown',
        count: item.count || 0,
        percentage: item.percentage || 0,
      })),
      recentActivity: (data.recentActivity || []).map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        propertyTitle: activity.propertyTitle,
        timestamp: activity.timestamp,
        city: activity.city || 'Unknown',
        description: activity.description,
      })),
      insights: data.insights || [],
    };

    return normalized;
  }

  /**
   * Normalize agent analytics
   */
  private normalizeAgentAnalytics(data: any): AgentAnalytics {
    const normalized: AgentAnalytics = {
      kpis: {
        totalViews: data.kpis?.totalViews || 0,
        inquiriesReceived: data.kpis?.inquiriesReceived || 0,
        savedProperties: data.kpis?.savedProperties || 0,
        activeListings: data.kpis?.activeListings || 0,
        estimatedRevenue: data.kpis?.estimatedRevenue || 0,
      },
      engagementOverTime: this.normalizeEngagementData(data.engagementOverTime || [], 'agent'),
      topPerformingListings: (data.topPerformingListings || []).map((listing: any) => ({
        id: listing.id,
        title: listing.title,
        views: listing.views || 0,
        inquiries: listing.inquiries || 0,
        saves: listing.saves || 0,
        price: listing.price || 0,
        image: listing.image,
        engagementScore: listing.engagementScore,
      })),
      engagementByCity: (data.engagementByCity || []).map((city: any) => ({
        city: city.city,
        views: city.views || 0,
        inquiries: city.inquiries || 0,
        properties: city.properties,
      })),
      conversionRate: {
        totalInquiries: data.conversionRate?.totalInquiries || 0,
        responded: data.conversionRate?.responded || 0,
        closed: data.conversionRate?.closed || 0,
        conversionPercentage: data.conversionRate?.conversionPercentage || 0,
        responseRate: data.conversionRate?.responseRate,
      },
      revenueByMonth: (data.revenueByMonth || []).map((item: any) => ({
        month: item.month,
        revenue: item.revenue || 0,
      })),
    };

    return normalized;
  }

  /**
   * Normalize engagement over time data
   */
  private normalizeEngagementData(data: ChartDataPoint[], userType: 'user' | 'agent'): ChartDataPoint[] {
    // If no data, generate placeholder data for the last 7 days
    if (!data || data.length === 0) {
      return this.generatePlaceholderEngagementData(userType);
    }

    // Ensure all data points have required fields
    return data.map(point => {
      const normalized: ChartDataPoint = {
        date: point.date,
      };

      if (userType === 'user') {
        normalized.searches = point.searches || 0;
        normalized.views = point.views || 0;
        normalized.saves = point.saves || 0;
      } else {
        normalized.views = point.views || 0;
        normalized.inquiries = point.inquiries || 0;
        normalized.saves = point.saves || 0;
      }

      return normalized;
    });
  }

  /**
   * Generate placeholder engagement data for charts
   */
  private generatePlaceholderEngagementData(userType: 'user' | 'agent'): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const point: ChartDataPoint = {
        date: date.toISOString().split('T')[0],
      };

      if (userType === 'user') {
        point.searches = 0;
        point.views = 0;
        point.saves = 0;
      } else {
        point.views = 0;
        point.inquiries = 0;
        point.saves = 0;
      }

      data.push(point);
    }

    return data;
  }

  /**
   * Get default analytics data structure
   */
  private getDefaultAnalyticsData(): RegularUserAnalytics {
    return {
      kpis: {
        savedProperties: 0,
        recentlyViewed: 0,
        contactedAgents: 0,
        completedTransactions: 0,
      },
      engagementOverTime: this.generatePlaceholderEngagementData('user'),
      propertyTypeInterest: [],
      recentActivity: [],
      insights: [],
    };
  }

  /**
   * Get engagement metrics over time
   */
  async getEngagement(params?: AnalyticsQueryParams): Promise<EngagementResponse> {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/analytics/engagement',
        params,
      });
      return response;
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      throw error;
    }
  }

  /**
   * Get quick stats/KPIs
   */
  async getKPIs(params?: DateRangeParams): Promise<any> {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/analytics/kpis',
        params,
      });
      return response;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportData(params?: ExportParams): Promise<Blob> {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/analytics/export',
        params,
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  /**
   * Get comparison data (current period vs previous period)
   */
  async getComparison(params?: DateRangeParams): Promise<AnalyticsComparison> {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/analytics/comparison',
        params,
      });
      return response;
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate date range for common presets
   */
  getDateRangePreset(preset: '7days' | '30days' | '90days' | 'custom', customRange?: { startDate: Date; endDate: Date }): DateRangeParams {
    const endDate = new Date();
    let startDate = new Date();

    switch (preset) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'custom':
        if (customRange) {
          return {
            startDate: customRange.startDate.toISOString(),
            endDate: customRange.endDate.toISOString(),
          };
        }
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  /**
   * Helper: Download exported file
   */
  downloadExport(blob: Blob, filename: string = 'analytics-export') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper: Format currency
   */
  formatCurrency(amount: number, currency: string = 'XAF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Helper: Format number with abbreviation
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Helper: Format percentage
   */
  formatPercentage(value: number): string {
    return `${value > 0 ? '+' : ''}${value}%`;
  }

  /**
   * Helper: Get trend from percentage change
   */
  getTrend(percentChange: number): 'up' | 'down' | 'stable' {
    if (percentChange > 0) return 'up';
    if (percentChange < 0) return 'down';
    return 'stable';
  }

  /**
   * Helper: Calculate percentage change
   */
  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;