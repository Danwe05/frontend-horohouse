import { LucideIcon } from 'lucide-react';

export interface KPICardProps {
    title: string;
    value: string;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon: LucideIcon;
    loading?: boolean;
}

export interface DashboardProps {
    data: AnalyticsData | null;
    dateRange: '7days' | '30days' | '90days' | 'custom';
    setDateRange: (range: '7days' | '30days' | '90days' | 'custom') => void;
    loading: boolean;
    onExport: (format: string) => void;
}

export interface AnalyticsData {
    kpis?: {
        savedProperties?: number;
        recentlyViewed?: number;
        contactedAgents?: number;
        completedTransactions?: number;
        totalViews?: number;
        inquiriesReceived?: number;
        activeListings?: number;
        estimatedRevenue?: number;
    };
    insights?: string[];
    engagementOverTime?: EngagementData[];
    propertyTypeInterest?: PropertyInterest[];
    recentActivity?: Activity[];
    topPerformingListings?: ListingPerformance[];
    engagementByCity?: CityEngagement[];
    conversionRate?: ConversionRate;
}

export interface EngagementData {
    date: string;
    searches?: number;
    views?: number;
    saves?: number;
    inquiries?: number;
}

export interface PropertyInterest {
    type: string;
    count: number;
    percentage: number;
}

export interface Activity {
    id: string;
    type: 'favorite_add' | 'property_inquiry' | string;
    timestamp: string;
    propertyTitle: string;
    city: string;
}

export interface ListingPerformance {
    id: string;
    title: string;
    price: number;
    views: number;
    inquiries: number;
    saves: number;
}

export interface CityEngagement {
    city: string;
    views: number;
    inquiries: number;
}

export interface ConversionRate {
    totalInquiries: number;
    responded: number;
    closed: number;
    conversionPercentage: number;
}
