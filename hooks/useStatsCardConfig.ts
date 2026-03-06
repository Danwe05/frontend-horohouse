import {
  Home,
  Building2,
  TrendingUp,
  Users,
  ClipboardCheck,
  DollarSign,
  Heart,
  Sparkles,
  Search,
  Bell,
  Eye,
  MessageSquare,
  UserPlus,
  KeyRound,
  Percent,
} from "lucide-react";
import { DashboardStats, StatsTrend } from "./useDashboardStats";

export interface StatsCardData {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  subtitle: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: 'default' | 'highlighted' | 'subtle' | 'success' | 'warning' | 'danger' | 'glass';
  breakdown?: {
    label: string;
    value: number | string;
    percentage?: number;
    color?: string;
  }[];
  animateValue?: boolean;
  sparklineData?: number[];
  progress?: number;
  expandable?: boolean;
  compactMode?: boolean;
  loading?: boolean;
}

export const useStatsCardConfig = (
  userRole: 'user' | 'agent' | 'landlord' | 'admin',
  stats: DashboardStats,
  statsTrend: StatsTrend
): StatsCardData[] => {
  const formatTrend = (value: number) => ({
    value: Math.abs(Math.round(value ?? 0)),
    isPositive: (value ?? 0) >= 0,
  });

  // Generate mock sparkline data based on trend
  const generateSparkline = (trend: number, points: number = 8): number[] => {
    const base = 50;
    const variance = 15;
    const data: number[] = [];

    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const trendValue = trend > 0 ? progress * variance : -progress * variance;
      const randomness = (Math.random() - 0.5) * 5;
      data.push(Math.max(0, base + trendValue + randomness));
    }

    return data;
  };

  // ADMIN DASHBOARD CARDS
  if (userRole === 'admin') {
    const totalListings = stats.totalListings || 0;
    const forRent = stats.forRent || 0;
    const forSale = stats.forSale || 0;

    return [
      {
        title: "Total Listings",
        value: totalListings.toString(),
        icon: Building2,
        subtitle: "All properties on platform",
        trend: formatTrend(statsTrend.totalProperties ?? 0),
        breakdown: [
          {
            label: "For Rent",
            value: forRent,
            percentage: totalListings > 0 ? Math.round((forRent / totalListings) * 100) : 0,
            color: "bg-blue-500"
          },
          {
            label: "For Sale",
            value: forSale,
            percentage: totalListings > 0 ? Math.round((forSale / totalListings) * 100) : 0,
            color: "bg-emerald-500"
          },
        ],
        variant: 'highlighted',
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalProperties ?? 0),
        expandable: true,
      },
      {
        title: "New Users Registered",
        value: (stats.newUsersRegistered || 0).toString(),
        icon: UserPlus,
        subtitle: "Last 30 days",
        trend: formatTrend(statsTrend.activeListings ?? 0),
        action: {
          label: "View Users",
          href: "/dashboard/users",
        },
        variant: 'success',
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.activeListings ?? 0),
      },
      {
        title: "Pending Approvals",
        value: (stats.pendingApprovals || 0).toString(),
        icon: ClipboardCheck,
        subtitle: `${stats.pendingProperties || 0} properties, ${stats.pendingAgents || 0} agents`,
        action: {
          label: "Review Now",
          href: "/dashboard/approvals",
        },
        variant: stats.pendingApprovals && stats.pendingApprovals > 0 ? 'warning' : 'subtle',
        animateValue: true,
        breakdown: stats.pendingApprovals && stats.pendingApprovals > 0 ? [
          { label: "Properties", value: stats.pendingProperties || 0 },
          { label: "Agents", value: stats.pendingAgents || 0 },
        ] : undefined,
      },
      {
        title: "Revenue Overview",
        value: `XAF ${(stats.monthlyRevenue || 0).toLocaleString()}`,
        icon: DollarSign,
        subtitle: "This month",
        trend: formatTrend(statsTrend.totalInquiries ?? 0),
        breakdown: [
          {
            label: "Commission",
            value: `XAF ${(stats.commissionRevenue || 0).toLocaleString()}`,
            percentage: stats.monthlyRevenue ? Math.round(((stats.commissionRevenue || 0) / stats.monthlyRevenue) * 100) : 0,
            color: "bg-green-500"
          },
          {
            label: "Featured Listings",
            value: `XAF ${(stats.featuredRevenue || 0).toLocaleString()}`,
            percentage: stats.monthlyRevenue ? Math.round(((stats.featuredRevenue || 0) / stats.monthlyRevenue) * 100) : 0,
            color: "bg-blue-500"
          },
        ],
        variant: 'glass',
        sparklineData: generateSparkline(statsTrend.totalInquiries ?? 0),
        expandable: true,
      },
    ];
  }

  // AGENT DASHBOARD CARDS
  if (userRole === 'agent') {
    const totalInteractions = (stats.listingViews || 0) + (stats.listingSaves || 0) + (stats.listingInquiries || 0);

    return [
      {
        title: "Active Listings",
        value: (stats.activeListings || 0).toString(),
        icon: Home,
        subtitle: "Properties published",
        trend: formatTrend(statsTrend.activeListings ?? 0),
        action: {
          label: "Manage Listings",
          href: "/dashboard/properties",
        },
        variant: 'highlighted',
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.activeListings ?? 0),
      },
      {
        title: "Listing Performance",
        value: (stats.listingViews || 0).toString(),
        icon: TrendingUp,
        subtitle: "Total property views",
        trend: formatTrend(statsTrend.totalViews ?? 0),
        variant: 'success',
        animateValue: true,
        // Use real views history
        sparklineData: stats.viewsHistory && stats.viewsHistory.length > 0
          ? stats.viewsHistory
          : undefined,
      },
      {
        title: "New Leads",
        value: (stats.newLeads || 0).toString(),
        icon: Users,
        subtitle: "Last 30 days",
        trend: formatTrend(statsTrend.totalInquiries ?? 0),
        action: {
          label: "View Leads",
          href: "/dashboard/inquiries",
        },
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalInquiries ?? 0),
      },
      {
        title: "Earnings Overview",
        value: `XAF ${(stats.monthlyEarnings || 0).toLocaleString()}`,
        icon: DollarSign,
        subtitle: "This month",
        breakdown: [
          {
            label: "Total Earned",
            value: `XAF ${(stats.totalEarnings || 0).toLocaleString()}`,
            percentage: stats.totalEarnings && stats.monthlyEarnings
              ? Math.round((stats.monthlyEarnings / stats.totalEarnings) * 100)
              : 100,
            color: "bg-green-500"
          },
        ],
        variant: 'glass',
        sparklineData: generateSparkline(5), // Assume positive earnings trend
      },
    ];
  }

  // LANDLORD DASHBOARD CARDS
  if (userRole === 'landlord') {
    return [
      {
        title: "Properties Owned",
        value: (stats.totalProperties || 0).toString(),
        icon: Building2,
        subtitle: `${stats.vacantProperties || 0} vacant`,
        trend: formatTrend(statsTrend.totalProperties ?? 0),
        action: {
          label: "Manage Properties",
          href: "/dashboard/properties",
        },
        variant: 'highlighted' as const,
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalProperties ?? 0),
        breakdown: [
          {
            label: "Active",
            value: stats.activeListings || 0,
            color: "bg-emerald-500",
          },
          {
            label: "Vacant",
            value: stats.vacantProperties || 0,
            color: "bg-amber-500",
          },
        ],
        expandable: true,
      },
      {
        title: "Occupancy Rate",
        value: `${stats.occupancyRate || 0}%`,
        icon: Percent,
        subtitle: "Portfolio occupancy",
        trend: formatTrend(statsTrend.activeListings ?? 0),
        variant: (stats.occupancyRate || 0) >= 75 ? 'success' as const : 'warning' as const,
        animateValue: true,
        progress: stats.occupancyRate || 0,
        sparklineData: generateSparkline(statsTrend.activeListings ?? 0),
      },
      {
        title: "Active Tenants",
        value: (stats.activeTenants || 0).toString(),
        icon: KeyRound,
        subtitle: "Currently leasing",
        trend: formatTrend(statsTrend.totalViews ?? 0),
        action: {
          label: "Manage Tenants",
          href: "/dashboard/tenants",
        },
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalViews ?? 0),
      },
      {
        title: "Monthly Revenue",
        value: `XAF ${(stats.totalRentalIncome || 0).toLocaleString()}`,
        icon: DollarSign,
        subtitle: "Rental income",
        trend: formatTrend(statsTrend.totalInquiries ?? 0),
        variant: 'glass' as const,
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalInquiries ?? 0),
      },
    ];
  }

  // USER DASHBOARD CARDS (Buyers/Renters)
  return [
    {
      title: "Saved Properties",
      value: (stats.savedProperties || 0).toString(),
      icon: Heart,
      subtitle: "Properties bookmarked",
      trend: formatTrend(statsTrend.totalProperties ?? 0),
      action: {
        label: "View Favorites",
        href: "/dashboard/favorites",
      },
      variant: 'highlighted',
      animateValue: true,
      sparklineData: generateSparkline(statsTrend.totalProperties ?? 0),
    },
    {
      title: "Recommended For You",
      value: (stats.recommendedCount || 0).toString(),
      icon: Sparkles,
      subtitle: "AI-powered suggestions",
      action: {
        label: "View All",
        href: "/dashboard/recommendations",
      },
      variant: 'glass',
      animateValue: true,
    },
    {
      title: "Recent Searches",
      value: (stats.recentSearches || 0).toString(),
      icon: Search,
      subtitle: "Search history",
      trend: formatTrend(statsTrend.totalViews ?? 0),
      action: {
        label: "View History",
        href: "/dashboard/search-history",
      },
      animateValue: true,
      sparklineData: generateSparkline(statsTrend.totalViews ?? 0),
    },
    {
      title: "Messages & Notifications",
      value: (stats.unreadMessages || 0).toString(),
      icon: Bell,
      subtitle: "Unread notifications",
      action: {
        label: "View All",
        href: "/dashboard/notifications",
      },
      variant: stats.unreadMessages && stats.unreadMessages > 0 ? 'warning' : 'subtle',
      animateValue: true,
      breakdown: stats.unreadMessages && stats.unreadMessages > 0 ? [
        { label: "Unread Messages", value: stats.unreadMessages },
      ] : undefined,
    },
  ];
};