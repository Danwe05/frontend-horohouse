'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Eye, Heart, MessageSquare,
  Home, DollarSign, Download, Calendar, Activity, CheckCircle2
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { analyticsService } from '@/lib/services/analyticService';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import AdminShortTermAnalytics from '@/components/dashboard/AdminShortTermAnalytics';

// --- Shared Components ---

const DashboardHeader = ({ title, description, dateRange, setDateRange, onExport, s }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold text-[#222222] mb-1">{title}</h1>
      <p className="text-sm text-[#717171]">{description}</p>
    </div>
    <div className="flex items-center gap-3">
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-[160px] h-10 bg-white border-[#DDDDDD] rounded-lg text-sm font-medium text-[#222222] focus:ring-0">
          <Calendar className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-lg border-[#DDDDDD] shadow-md">
          <SelectItem value="7days">{s?.last7days || 'Last 7 days'}</SelectItem>
          <SelectItem value="30days">{s?.last30days || 'Last 30 days'}</SelectItem>
          <SelectItem value="90days">{s?.last90days || 'Last 90 days'}</SelectItem>
        </SelectContent>
      </Select>
      <Button
        onClick={() => onExport('json')}
        variant="outline"
        className="h-10 rounded-lg px-4 border-[#DDDDDD] text-[#222222] font-medium text-sm"
      >
        <Download className="w-4 h-4 mr-2" />
        {s?.exportData || 'Export'}
      </Button>
    </div>
  </div>
);

const KPICard = ({ title, value, change, trend, icon: Icon }: any) => (
  <Card className="rounded-xl border-[#DDDDDD] shadow-none">
    <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
      <div className="flex justify-between items-start text-[#717171]">
        <span className="text-sm font-medium">{title}</span>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold text-[#222222] leading-none">{value}</span>
        {change && (
          <span className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-700' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {change}%
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="h-full flex items-center justify-center text-sm text-[#717171] p-6">
    {message}
  </div>
);

// --- Dashboards ---

const RegularUserDashboard = ({ data, dateRange, setDateRange, onExport, s }: any) => (
  <div className="max-w-7xl mx-auto space-y-8 pb-12">
    <DashboardHeader
      title={s?.yourDashboard || "Your dashboard"}
      description={s?.yourDashboardDesc || "Insights into your property search and activity."}
      dateRange={dateRange}
      setDateRange={setDateRange}
      onExport={onExport}
      s={s}
    />

    {data?.insights?.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.insights.slice(0, 3).map((insight: string, idx: number) => (
          <div key={idx} className="bg-white rounded-xl p-4 border border-[#DDDDDD] flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
            <p className="text-sm text-[#222222]">{insight}</p>
          </div>
        ))}
      </div>
    )}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title={s?.savedItems || "Saved"} value={data?.kpis?.savedProperties || '0'} icon={Heart} />
      <KPICard title={s?.propertiesViewed || "Viewed"} value={data?.kpis?.recentlyViewed || '0'} icon={Eye} />
      <KPICard title={s?.inquiriesSent || "Inquiries"} value={data?.kpis?.contactedAgents || '0'} icon={MessageSquare} />
      <KPICard title={s?.transactions || "Stays"} value={data?.kpis?.completedTransactions || '0'} icon={Home} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 rounded-xl border-[#DDDDDD] shadow-none">
        <CardHeader className="border-b border-[#DDDDDD] p-5">
          <CardTitle className="text-base font-semibold text-[#222222] flex items-center gap-2">
            <Activity className="w-4 h-4" /> {s?.activityTrends || "Activity trends"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 h-[350px]">
          {data?.engagementOverTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.engagementOverTime} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDDDDD" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#717171', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#717171', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #DDDDDD', boxShadow: 'none' }} />
                <Area type="monotone" dataKey="views" name="Views" stroke="#222222" strokeWidth={2} fill="#222222" fillOpacity={0.05} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="saves" name="Saves" stroke="#FF385C" strokeWidth={2} fill="#FF385C" fillOpacity={0.05} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState message={s?.noActivityData || "No data available."} />}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-[#DDDDDD] shadow-none h-[415px] flex flex-col">
        <CardHeader className="border-b border-[#DDDDDD] p-5">
          <CardTitle className="text-base font-semibold text-[#222222]">{s?.recentHistory || "Recent history"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto">
          {data?.recentActivity?.length > 0 ? (
            <div className="divide-y divide-[#DDDDDD]">
              {data.recentActivity.map((activity: any) => (
                <div key={activity.id} className="p-4 hover:bg-[#F7F7F7] flex flex-col gap-1">
                  <p className="text-sm font-medium text-[#222222] truncate">{activity.propertyTitle}</p>
                  <div className="flex items-center justify-between text-xs text-[#717171]">
                    <span>{activity.city} • {new Date(activity.timestamp).toLocaleDateString()}</span>
                    <span className="uppercase font-semibold text-[10px]">{activity.type.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message={s?.noRecentActivity || "No recent activity."} />}
        </CardContent>
      </Card>
    </div>
  </div>
);

const AgentDashboard = ({ data, dateRange, setDateRange, onExport, s }: any) => (
  <div className="max-w-7xl mx-auto space-y-8 pb-12">
    <DashboardHeader
      title={s?.agentPerformance || "Performance dashboard"}
      description={s?.agentPerformanceDesc || "Overview of your listings, conversions, and revenue."}
      dateRange={dateRange}
      setDateRange={setDateRange}
      onExport={onExport}
      s={s}
    />

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KPICard title={s?.totalViews || "Views"} value={analyticsService.formatNumber(data?.kpis?.totalViews || 0)} icon={Eye} />
      <KPICard title={s?.inquiries || "Inquiries"} value={data?.kpis?.inquiriesReceived || '0'} icon={MessageSquare} />
      <KPICard title={s?.saved || "Saved"} value={data?.kpis?.savedProperties || '0'} icon={Heart} />
      <KPICard title={s?.activeListings || "Listings"} value={data?.kpis?.activeListings || '0'} icon={Home} />
      <KPICard title={s?.estRevenue || "Revenue"} value={analyticsService.formatCurrency(data?.kpis?.estimatedRevenue || 0)} icon={DollarSign} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 rounded-xl border-[#DDDDDD] shadow-none">
        <CardHeader className="border-b border-[#DDDDDD] p-5">
          <CardTitle className="text-base font-semibold text-[#222222] flex items-center gap-2">
            <Activity className="w-4 h-4" /> {s?.listingEngagement || "Listing engagement"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 h-[350px]">
          {data?.engagementOverTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.engagementOverTime} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDDDDD" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#717171', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#717171', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #DDDDDD', boxShadow: 'none' }} />
                <Area type="monotone" name="Views" dataKey="views" stroke="#222222" strokeWidth={2} fill="#222222" fillOpacity={0.05} activeDot={{ r: 4 }} />
                <Area type="monotone" name="Inquiries" dataKey="inquiries" stroke="#FF385C" strokeWidth={2} fill="#FF385C" fillOpacity={0.05} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState message={s?.noEngagementData || "No data available."} />}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-[#DDDDDD] shadow-none h-[415px] flex flex-col">
        <CardHeader className="border-b border-[#DDDDDD] p-5">
          <CardTitle className="text-base font-semibold text-[#222222]">{s?.conversionFunnel || "Conversion funnel"}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex-1 flex flex-col justify-center space-y-8">
          <div>
            <div className="flex justify-between items-end mb-2 text-sm text-[#222222]">
              <span>{s?.totalInquiries || "Total inquiries"}</span>
              <span className="font-semibold text-lg">{data?.conversionRate?.totalInquiries || '0'}</span>
            </div>
            <div className="h-1.5 w-full bg-[#F7F7F7] rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2 text-sm text-[#222222]">
              <span>{s?.closedDeals || "Closed deals"}</span>
              <span className="font-semibold text-lg">{data?.conversionRate?.closed || '0'}</span>
            </div>
            <div className="h-1.5 w-full bg-[#F7F7F7] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${data?.conversionRate?.totalInquiries ? (data.conversionRate.closed / data.conversionRate.totalInquiries) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-[#DDDDDD] flex justify-between items-center">
            <span className="text-sm text-[#717171] uppercase font-semibold">{s?.successRate || "Success rate"}</span>
            <span className="text-xl font-semibold text-[#222222]">{data?.conversionRate?.conversionPercentage || '0'}%</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card className="rounded-xl border-[#DDDDDD] shadow-none">
      <CardHeader className="border-b border-[#DDDDDD] p-5">
        <CardTitle className="text-base font-semibold text-[#222222] flex items-center gap-2">
          <Home className="w-4 h-4" /> {s?.topPerformingListings || "Top performing listings"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data?.topPerformingListings?.length > 0 ? (
          <div className="divide-y divide-[#DDDDDD]">
            {data.topPerformingListings.map((listing: any, idx: number) => (
              <div key={listing.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F7F7]">
                <div>
                  <p className="text-sm font-medium text-[#222222] mb-1">{idx + 1}. {listing.title}</p>
                  <p className="text-sm text-[#717171]">{analyticsService.formatCurrency(listing.price)}</p>
                </div>
                <div className="flex gap-6 text-sm text-[#222222]">
                  <div className="text-right"><p className="text-xs text-[#717171] mb-0.5">{s?.views || "Views"}</p><p>{listing.views}</p></div>
                  <div className="text-right"><p className="text-xs text-[#717171] mb-0.5">{s?.inquiries || "Inquiries"}</p><p>{listing.inquiries}</p></div>
                  <div className="text-right"><p className="text-xs text-[#717171] mb-0.5">{s?.saved || "Saves"}</p><p>{listing.saves}</p></div>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState message={s?.noListingData || "No listing data available."} />}
      </CardContent>
    </Card>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-8 p-6 max-w-7xl mx-auto animate-pulse">
    <div className="flex justify-between mb-8"><div className="h-8 w-48 bg-[#EBEBEB] rounded" /><div className="h-10 w-32 bg-[#EBEBEB] rounded" /></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-[#F7F7F7] rounded-xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-96 bg-[#F7F7F7] rounded-xl" />
      <div className="h-96 bg-[#F7F7F7] rounded-xl" />
    </div>
  </div>
);

// --- Main Page ---

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();
  const s = (t as any)?.analytics || {};

  useEffect(() => {
    const fetchUserAndAnalytics = async () => {
      try {
        const isValid = await authService.ensureValidToken();
        if (!isValid) return router.push('/auth/login');
        const user = authService.getStoredUser();
        if (!user) return router.push('/auth/login');
        setUserRole(user.role);
        await fetchAnalytics(dateRange);
      } catch (error) { router.push('/auth/login'); }
    };
    fetchUserAndAnalytics();
  }, []);

  useEffect(() => {
    if (userRole) fetchAnalytics(dateRange);
  }, [dateRange, userRole]);

  const fetchAnalytics = async (range: any) => {
    setLoading(true);
    try {
      const dateParams = analyticsService.getDateRangePreset(range);
      const data = await analyticsService.getDashboard(dateParams);
      setAnalyticsData(data);
    } catch (e) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const dateParams = analyticsService.getDateRangePreset(dateRange as any);
      const blob = await analyticsService.exportData({ ...dateParams, format });
      if (blob) {
        analyticsService.downloadExport(blob, `analytics-${dateRange}.${format}`);
        toast.success(`Exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="p-6 md:p-10 w-full">
            {loading && !analyticsData ? (
              <LoadingSkeleton />
            ) : ['agent', 'admin'].includes(userRole!) ? (
              <>
                <AgentDashboard data={analyticsData} dateRange={dateRange} setDateRange={setDateRange} onExport={handleExport} s={s} />
                {userRole === 'admin' && (
                  <div className="mt-12 pt-12 border-t border-[#DDDDDD] max-w-7xl mx-auto">
                    <AdminShortTermAnalytics dateRange={dateRange} />
                  </div>
                )}
              </>
            ) : (
              <RegularUserDashboard data={analyticsData} dateRange={dateRange} setDateRange={setDateRange} onExport={handleExport} s={s} />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}