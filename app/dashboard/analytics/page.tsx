'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import {
  TrendingUp, TrendingDown, Eye, Heart, MessageSquare,
  Home, DollarSign, Download, AlertCircle, Users, Loader2,
  Calendar, CheckCircle2, Search, ArrowRight, BarChart3, PieChartIcon, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { analyticsService } from '@/lib/services/analyticService';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

// --- Sub-Components ---

const DashboardHeader = ({ title, description, dateRange, setDateRange, onExport, icon: HeaderIcon }: any) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
          <HeaderIcon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>

        </div>
      </div>
      <p className="text-slate-500 pl-11">{description}</p>
    </div>

    {/* MODERN FILTER BAR */}
    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-10 transition-all flex items-center gap-2">
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-[160px] h-11 border-none bg-slate-50 rounded-xl text-sm text-slate-600 shadow-none font-semibold">
          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl shadow-lg border-slate-100">
          <SelectItem value="7days" className="rounded-lg">Last 7 days</SelectItem>
          <SelectItem value="30days" className="rounded-lg">Last 30 days</SelectItem>
          <SelectItem value="90days" className="rounded-lg">Last 90 days</SelectItem>
        </SelectContent>
      </Select>
      <div className="h-8 w-px bg-slate-200 mx-1"></div>
      <Button onClick={() => onExport('json')} variant="ghost" className="h-11 rounded-xl px-4 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors font-semibold">
        <Download className="w-4 h-4 mr-2" />
        Export Data
      </Button>
    </div>
  </div>
);

const ModernKPICard = ({ title, value, change, trend, icon: Icon, colorClass = "blue" }: any) => {
  const variants: any = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    pink: "bg-pink-50 text-pink-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${variants[colorClass]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            {title}
            {change && (
              <span className={`flex items-center text-[10px] ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                {change}%
              </span>
            )}
          </p>
          <p className="text-2xl font-black text-slate-800">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Role Specific Dashboards ---

const RegularUserDashboard = ({ data, dateRange, setDateRange, loading, onExport }: any) => {
  if (loading) return <LoadingSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <DashboardHeader
        title="Your Dashboard"
        description="Insights into your property search, favorites, and activity"
        dateRange={dateRange}
        setDateRange={setDateRange}
        onExport={onExport}
        icon={BarChart3}
      />

      {/* Insights Section */}
      {data?.insights && data.insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.insights.slice(0, 3).map((insight: string, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start gap-3">
              <div className="bg-blue-50 p-2 rounded-xl mt-0.5">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-700 leading-snug pt-1">
                {insight}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernKPICard title="Saved Items" value={data?.kpis?.savedProperties || '0'} icon={Heart} colorClass="pink" />
        <ModernKPICard title="Properties Viewed" value={data?.kpis?.recentlyViewed || '0'} icon={Eye} colorClass="blue" />
        <ModernKPICard title="Inquiries Sent" value={data?.kpis?.contactedAgents || '0'} icon={MessageSquare} colorClass="emerald" />
        <ModernKPICard title="Transactions" value={data?.kpis?.completedTransactions || '0'} icon={Home} colorClass="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[400px]">
            {data?.engagementOverTime?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.engagementOverTime}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSaves" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', padding: '12px 16px', fontWeight: 600 }}
                    itemStyle={{ fontSize: '14px', padding: '2px 0' }}
                    labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '13px' }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
                  <Area type="monotone" dataKey="saves" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorSaves)" activeDot={{ r: 6, strokeWidth: 0, fill: '#ec4899' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">No activity data available for this period.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity List */}
        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px] lg:h-auto">
          <CardHeader className="bg-white border-b border-slate-50 pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-bold text-slate-800">Recent History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
            {data?.recentActivity?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 cursor-pointer group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                      {activity.type.includes('favorite') ? <Heart className="w-4 h-4 text-pink-500" /> : <Search className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate mb-0.5">{activity.propertyTitle}</p>
                      <p className="text-xs font-medium text-slate-500 mb-2 truncate">{activity.city} • {new Date(activity.timestamp).toLocaleDateString()}</p>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none hover:bg-slate-200 text-[10px] uppercase tracking-wider px-2 py-0">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <Search className="w-10 h-10 mb-3 opacity-20" />
                <p className="font-medium text-sm">No recent activity found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AgentDashboard = ({ data, dateRange, setDateRange, loading, onExport }: any) => {
  if (loading) return <LoadingSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <DashboardHeader
        title="Agent Performance"
        description="Comprehensive overview of your listings, conversions, and revenue"
        dateRange={dateRange}
        setDateRange={setDateRange}
        onExport={onExport}
        icon={PieChartIcon}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ModernKPICard title="Total Views" value={analyticsService.formatNumber(data?.kpis?.totalViews || 0)} icon={Eye} colorClass="blue" />
        <ModernKPICard title="Inquiries" value={data?.kpis?.inquiriesReceived || '0'} icon={MessageSquare} colorClass="emerald" />
        <ModernKPICard title="Saved" value={data?.kpis?.savedProperties || '0'} icon={Heart} colorClass="pink" />
        <ModernKPICard title="Active Listings" value={data?.kpis?.activeListings || '0'} icon={Home} colorClass="purple" />
        <ModernKPICard title="Est. Revenue" value={analyticsService.formatCurrency(data?.kpis?.estimatedRevenue || 0)} icon={DollarSign} colorClass="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 pb-4 pt-6 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Listing Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[400px]">
            {data?.engagementOverTime?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.engagementOverTime}>
                  <defs>
                    <linearGradient id="colorViewsAgent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInqAgent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px', fontWeight: 600 }}
                    itemStyle={{ fontSize: '14px', padding: '2px 0' }}
                  />
                  <Area type="monotone" name="Views" dataKey="views" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorViewsAgent)" activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} />
                  <Area type="monotone" name="Inquiries" dataKey="inquiries" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInqAgent)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">No engagement data available.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-white border-b border-slate-50 pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-bold text-slate-800">Conversion Funnel</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-1">From inquiry to closed deal</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            <div className="space-y-8">
              <div className="group relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><MessageSquare className="w-4 h-4" /></div>
                    <p className="font-bold text-slate-700">Total Inquiries</p>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">{data?.conversionRate?.totalInquiries || '0'}</h4>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden absolute -bottom-4">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="group relative mt-8">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><CheckCircle2 className="w-4 h-4" /></div>
                    <p className="font-bold text-slate-700">Closed Deals</p>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">{data?.conversionRate?.closed || '0'}</h4>
                </div>
                {(() => {
                  const pct = data?.conversionRate?.totalInquiries > 0
                    ? (data.conversionRate.closed / data.conversionRate.totalInquiries) * 100
                    : 0;
                  return (
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden absolute -bottom-4">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-12 text-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                  <span className="text-xl font-black text-purple-600">{data?.conversionRate?.conversionPercentage || '0'}%</span>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Listings (Agent only) */}
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-50 pb-4 pt-6 px-6">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Home className="w-5 h-5 text-orange-500" />
            Top Performing Listings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data?.topPerformingListings?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.topPerformingListings.map((listing: any, index: number) => (
                <div key={listing.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-900 truncate mb-1">{listing.title}</p>
                      <p className="text-sm font-semibold text-slate-500">{analyticsService.formatCurrency(listing.price)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Views</p>
                      <p className="text-sm font-black text-slate-800">{listing.views}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inquiries</p>
                      <p className="text-sm font-black text-slate-800">{listing.inquiries}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saves</p>
                      <p className="text-sm font-black text-slate-800">{listing.saves}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <Home className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">No listing data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// --- Skeleton Helper ---
const LoadingSkeleton = () => (
  <div className="space-y-8 p-4 md:p-8 animate-pulse">
    <div className="flex flex-col md:flex-row justify-between gap-4 py-4">
      <div className="space-y-3"><div className="h-8 w-64 bg-slate-200 rounded-xl" /><div className="h-4 w-96 bg-slate-100 rounded-lg" /></div>
      <div className="h-12 w-48 bg-slate-200 rounded-2xl" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-[140px] bg-slate-100 rounded-3xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-1 lg:col-span-2 h-[450px] bg-slate-100 rounded-3xl" />
      <div className="h-[450px] bg-slate-100 rounded-3xl" />
    </div>
  </div>
);

import AdminShortTermAnalytics from '@/components/dashboard/AdminShortTermAnalytics';

// Main Page
const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndAnalytics = async () => {
      try {
        const isValid = await authService.ensureValidToken();
        if (!isValid) { router.push('/auth/login'); return; }
        const user = authService.getStoredUser();
        if (!user) { router.push('/auth/login'); return; }
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
      console.error(e);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const dateParams = analyticsService.getDateRangePreset(dateRange as any);
      // Wait for service to generate blob
      const blob = await analyticsService.exportData({ ...dateParams, format });
      if (blob) {
        analyticsService.downloadExport(blob, `analytics-${dateRange}.${format}`);
        toast.success(`Analytics exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export analytics as ${format.toUpperCase()}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <NavDash />
          <div className="p-4 md:p-8 pt-6 space-y-12">
            {loading && !analyticsData ? (
              <LoadingSkeleton />
            ) : userRole === 'agent' || userRole === 'admin' ? (
              <>
                <AgentDashboard data={analyticsData} dateRange={dateRange} setDateRange={setDateRange} loading={loading} onExport={handleExport} />

                {userRole === 'admin' && (
                  <div className="mt-16 pt-16 border-t border-slate-200">
                    <AdminShortTermAnalytics dateRange={dateRange} />
                  </div>
                )}
              </>
            ) : (
              <RegularUserDashboard data={analyticsData} dateRange={dateRange} setDateRange={setDateRange} loading={loading} onExport={handleExport} />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AnalyticsPage;