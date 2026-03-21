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
import { useLanguage } from "@/contexts/LanguageContext";
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

// ── Only change: extend the accepted role union with 'student' ───────────────
export const useStatsCardConfig = (
  userRole: 'user' | 'agent' | 'landlord' | 'admin' | 'student',
  stats: DashboardStats,
  statsTrend: StatsTrend,
): StatsCardData[] => {
  const { t } = useLanguage();
  const _t = t as any;
  const sAdmin = _t.stats?.admin || {};
  const sAgent = _t.stats?.agent || {};
  const sLandlord = _t.stats?.landlord || {};
  const sUser = _t.stats?.user || {};

  // Students have their own stats inside StudentRole — return nothing here.
  // Index.tsx already skips the stats section for students, but this is a
  // safe fallback in case the hook is called before the guard fires.
  if (userRole === 'student') return [];

  const formatTrend = (value: number) => ({
    value: Math.abs(Math.round(value ?? 0)),
    isPositive: (value ?? 0) >= 0,
  });

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

  // ADMIN
  if (userRole === 'admin') {
    const totalListings = stats.totalListings || 0;
    const forRent = stats.forRent || 0;
    const forSale = stats.forSale || 0;

    return [
      {
        title: sAdmin.totalListings || "Total Listings",
        value: totalListings.toString(),
        icon: Building2,
        subtitle: sAdmin.allProperties || "All properties on platform",
        trend: formatTrend(statsTrend.totalProperties ?? 0),
        breakdown: [
          { label: sAdmin.forRent || "For Rent", value: forRent, percentage: totalListings > 0 ? Math.round((forRent / totalListings) * 100) : 0, color: "bg-blue-500" },
          { label: sAdmin.forSale || "For Sale", value: forSale, percentage: totalListings > 0 ? Math.round((forSale / totalListings) * 100) : 0, color: "bg-emerald-500" },
        ],
        variant: 'highlighted',
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalProperties ?? 0),
        expandable: true,
      },
      {
        title: sAdmin.newUsers || "New Users Registered",
        value: (stats.newUsersRegistered || 0).toString(),
        icon: UserPlus,
        subtitle: sAdmin.last30Days || "Last 30 days",
        trend: formatTrend(statsTrend.activeListings ?? 0),
        action: { label: sAdmin.viewUsers || "View Users", href: "/dashboard/users" },
        variant: 'success',
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.activeListings ?? 0),
      },
      {
        title: sAdmin.pendingApprovals || "Pending Approvals",
        value: (stats.pendingApprovals || 0).toString(),
        icon: ClipboardCheck,
        subtitle: `${stats.pendingProperties || 0} ${sAdmin.properties || 'properties'}, ${stats.pendingAgents || 0} ${sAdmin.agents || 'agents'}`,
        action: { label: sAdmin.reviewNow || "Review Now", href: "/dashboard/approvals" },
        variant: stats.pendingApprovals && stats.pendingApprovals > 0 ? 'warning' : 'subtle',
        animateValue: true,
        breakdown: stats.pendingApprovals && stats.pendingApprovals > 0
          ? [{ label: sAdmin.properties || "Properties", value: stats.pendingProperties || 0 }, { label: sAdmin.agents || "Agents", value: stats.pendingAgents || 0 }]
          : undefined,
      },
      {
        title: sAdmin.revenueOverview || "Revenue Overview",
        value: `XAF ${(stats.monthlyRevenue || 0).toLocaleString()}`,
        icon: DollarSign,
        subtitle: sAdmin.thisMonth || "This month",
        trend: formatTrend(statsTrend.totalInquiries ?? 0),
        breakdown: [
          { label: sAdmin.commission || "Commission", value: `XAF ${(stats.commissionRevenue || 0).toLocaleString()}`, percentage: stats.monthlyRevenue ? Math.round(((stats.commissionRevenue || 0) / stats.monthlyRevenue) * 100) : 0, color: "bg-green-500" },
          { label: sAdmin.featuredListings || "Featured Listings", value: `XAF ${(stats.featuredRevenue || 0).toLocaleString()}`, percentage: stats.monthlyRevenue ? Math.round(((stats.featuredRevenue || 0) / stats.monthlyRevenue) * 100) : 0, color: "bg-blue-500" },
        ],
        variant: 'glass',
        sparklineData: generateSparkline(statsTrend.totalInquiries ?? 0),
        expandable: true,
      },
    ];
  }

  // AGENT
  if (userRole === 'agent') {
    return [
      {
        title: sAgent.activeListings || "Active Listings",
        value: (stats.activeListings || 0).toString(),
        icon: Home,
        subtitle: sAgent.propertiesPublished || "Properties published",
        trend: formatTrend(statsTrend.activeListings ?? 0),
        action: { label: sAgent.manageListings || "Manage Listings", href: "/dashboard/properties" },
        variant: 'highlighted',
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.activeListings ?? 0),
      },
      {
        title: sAgent.listingPerformance || "Listing Performance",
        value: (stats.listingViews || 0).toString(),
        icon: TrendingUp,
        subtitle: sAgent.totalPropertyViews || "Total property views",
        trend: formatTrend(statsTrend.totalViews ?? 0),
        variant: 'success',
        animateValue: true,
        sparklineData: stats.viewsHistory?.length ? stats.viewsHistory : undefined,
      },
      {
        title: sAgent.newLeads || "New Leads",
        value: (stats.newLeads || 0).toString(),
        icon: Users,
        subtitle: sAgent.last30Days || "Last 30 days",
        trend: formatTrend(statsTrend.totalInquiries ?? 0),
        action: { label: sAgent.viewLeads || "View Leads", href: "/dashboard/inquiries" },
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalInquiries ?? 0),
      },
      {
        title: sAgent.earningsOverview || "Earnings Overview",
        value: `XAF ${(stats.monthlyEarnings || 0).toLocaleString()}`,
        icon: DollarSign,
        subtitle: sAgent.thisMonth || "This month",
        breakdown: [{ label: sAgent.totalEarned || "Total Earned", value: `XAF ${(stats.totalEarnings || 0).toLocaleString()}`, percentage: stats.totalEarnings && stats.monthlyEarnings ? Math.round((stats.monthlyEarnings / stats.totalEarnings) * 100) : 100, color: "bg-green-500" }],
        variant: 'glass',
        sparklineData: generateSparkline(5),
      },
    ];
  }

  // LANDLORD
  if (userRole === 'landlord') {
    return [
      {
        title: sLandlord.propertiesOwned || "Properties Owned",
        value: (stats.totalProperties || 0).toString(),
        icon: Building2,
        subtitle: `${stats.vacantProperties || 0} ${sLandlord.vacant || 'vacant'}`,
        trend: formatTrend(statsTrend.totalProperties ?? 0),
        action: { label: sLandlord.manageProperties || "Manage Properties", href: "/dashboard/properties" },
        variant: 'highlighted' as const,
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalProperties ?? 0),
        breakdown: [
          { label: sLandlord.active || "Active", value: stats.activeListings || 0, color: "bg-emerald-500" },
          { label: sLandlord.vacant || "Vacant", value: stats.vacantProperties || 0, color: "bg-amber-500" },
        ],
        expandable: true,
      },
      {
        title: sLandlord.occupancyRate || "Occupancy Rate",
        value: `${stats.occupancyRate || 0}%`,
        icon: Percent,
        subtitle: sLandlord.portfolioOccupancy || "Portfolio occupancy",
        trend: formatTrend(statsTrend.activeListings ?? 0),
        variant: (stats.occupancyRate || 0) >= 75 ? 'success' as const : 'warning' as const,
        animateValue: true,
        progress: stats.occupancyRate || 0,
        sparklineData: generateSparkline(statsTrend.activeListings ?? 0),
      },
      {
        title: sLandlord.activeTenants || "Active Tenants",
        value: (stats.activeTenants || 0).toString(),
        icon: KeyRound,
        subtitle: sLandlord.currentlyLeasing || "Currently leasing",
        trend: formatTrend(statsTrend.totalViews ?? 0),
        action: { label: sLandlord.manageTenants || "Manage Tenants", href: "/dashboard/tenants" },
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalViews ?? 0),
      },
      {
        title: sLandlord.monthlyRevenue || "Monthly Revenue",
        value: `XAF ${(stats.totalRentalIncome || 0).toLocaleString()}`,
        icon: DollarSign,
        subtitle: sLandlord.rentalIncome || "Rental income",
        trend: formatTrend(statsTrend.totalInquiries ?? 0),
        variant: 'glass' as const,
        animateValue: true,
        sparklineData: generateSparkline(statsTrend.totalInquiries ?? 0),
      },
    ];
  }

  // USER (default — buyers / renters)
  return [
    {
      title: sUser.savedProperties || "Saved Properties",
      value: (stats.savedProperties || 0).toString(),
      icon: Heart,
      subtitle: sUser.propertiesBookmarked || "Properties bookmarked",
      trend: formatTrend(statsTrend.totalProperties ?? 0),
      action: { label: sUser.viewFavorites || "View Favorites", href: "/dashboard/favorites" },
      variant: 'highlighted',
      animateValue: true,
      sparklineData: generateSparkline(statsTrend.totalProperties ?? 0),
    },
    {
      title: sUser.recommendedForYou || "Recommended For You",
      value: (stats.recommendedCount || 0).toString(),
      icon: Sparkles,
      subtitle: sUser.aiSuggestions || "AI-powered suggestions",
      action: { label: sUser.viewAll || "View All", href: "/dashboard/recommendations" },
      variant: 'glass',
      animateValue: true,
    },
    {
      title: sUser.recentSearches || "Recent Searches",
      value: (stats.recentSearches || 0).toString(),
      icon: Search,
      subtitle: sUser.searchHistory || "Search history",
      trend: formatTrend(statsTrend.totalViews ?? 0),
      action: { label: sUser.viewHistory || "View History", href: "/dashboard/search-history" },
      animateValue: true,
      sparklineData: generateSparkline(statsTrend.totalViews ?? 0),
    },
    {
      title: sUser.messagesAndNotifications || "Messages & Notifications",
      value: (stats.unreadMessages || 0).toString(),
      icon: Bell,
      subtitle: sUser.unreadNotifications || "Unread notifications",
      action: { label: sUser.viewAll || "View All", href: "/dashboard/notifications" },
      variant: stats.unreadMessages && stats.unreadMessages > 0 ? 'warning' : 'subtle',
      animateValue: true,
      breakdown: stats.unreadMessages && stats.unreadMessages > 0
        ? [{ label: sUser.unreadMessages || "Unread Messages", value: stats.unreadMessages }]
        : undefined,
    },
  ];
};