'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Eye, Heart, MessageSquare,
  Home, DollarSign, Download, Calendar, Activity, CheckCircle2,
  Loader2, AlertTriangle, RefreshCw, ChevronDown, Building2,
  Bed, BarChart2, Users,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Legend, LineChart, Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyticsService } from '@/lib/services/analyticService';
import { useUserRole } from '@/hooks/useUserRole';
import { apiClient } from '@/lib/api';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import AdminShortTermAnalytics from '@/components/dashboard/AdminShortTermAnalytics';
import { cn } from '@/lib/utils';

// ─── Palette ───────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#222222', '#FF385C', '#3B82F6', '#10B981', '#F59E0B'];

// ─── Tiny sparkline inside KPI card ───────────────────────────────────────────

function Sparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ title, value, change, trend, icon: Icon, sparkData, sparkKey, sparkColor }: any) {
  return (
    <Card className="rounded-2xl border-[#DDDDDD] shadow-none hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start text-[#717171]">
          <span className="text-[13px] font-medium">{title}</span>
          <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#222222]" />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="text-[26px] font-bold text-[#222222] leading-none tracking-tight">{value}</span>
          {change != null && (
            <span className={cn(
              'flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-full',
              trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600',
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        {sparkData?.length > 1 && (
          <Sparkline data={sparkData} dataKey={sparkKey ?? 'value'} color={sparkColor ?? '#222222'} />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Shared header ─────────────────────────────────────────────────────────────

function DashboardHeader({ title, description, dateRange, setDateRange, onExport, s, refreshing }: any) {
  const [exportOpen, setExportOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setExportOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#DDDDDD] mb-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#222222] mb-1">{title}</h1>
        <p className="text-[14px] text-[#717171]">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {refreshing && <Loader2 className="w-4 h-4 animate-spin text-[#AAAAAA]" />}
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px] h-10 bg-white border-[#DDDDDD] rounded-xl text-[13px] font-medium text-[#222222] focus:ring-0 focus:border-[#222222]">
            <Calendar className="w-3.5 h-3.5 mr-2 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#DDDDDD] shadow-lg">
            <SelectItem value="7days">{s?.last7days || 'Last 7 days'}</SelectItem>
            <SelectItem value="30days">{s?.last30days || 'Last 30 days'}</SelectItem>
            <SelectItem value="90days">{s?.last90days || 'Last 90 days'}</SelectItem>
          </SelectContent>
        </Select>

        {/* Export dropdown */}
        <div ref={ref} className="relative">
          <Button
            onClick={() => setExportOpen(o => !o)}
            variant="outline"
            className="h-10 rounded-xl px-4 border-[#DDDDDD] text-[#222222] font-medium text-[13px] gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            {s?.exportData || 'Export'}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-[#DDDDDD] rounded-xl shadow-[0_8px_28px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
              {(['json', 'csv', 'pdf'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => { onExport(fmt); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#222222] hover:bg-[#F7F7F7] transition-colors uppercase"
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty & Error states ──────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="h-full flex items-center justify-center text-[13px] text-[#AAAAAA] p-6">{message}</div>
);

const ChartCard = ({ title, icon: Icon, children, className }: any) => (
  <Card className={cn('rounded-2xl border-[#DDDDDD] shadow-none', className)}>
    <CardHeader className="border-b border-[#DDDDDD] p-5">
      <CardTitle className="text-[15px] font-semibold text-[#222222] flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#717171]" />} {title}
      </CardTitle>
    </CardHeader>
    {children}
  </Card>
);

const chartTooltipStyle = {
  contentStyle: { borderRadius: '10px', border: '1px solid #DDDDDD', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 },
  labelStyle: { color: '#717171', fontWeight: 600 },
};

// ─── Regular User Dashboard ────────────────────────────────────────────────────

const RegularUserDashboard = ({ data, dateRange, setDateRange, onExport, s, refreshing }: any) => (
  <div className="max-w-7xl mx-auto space-y-8 pb-12">
    <DashboardHeader
      title={s?.yourDashboard || 'Your dashboard'}
      description={s?.yourDashboardDesc || 'Insights into your property search and activity.'}
      dateRange={dateRange} setDateRange={setDateRange} onExport={onExport} s={s} refreshing={refreshing}
    />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title={s?.savedItems || 'Saved'} value={data?.kpis?.savedProperties || '0'} icon={Heart}
        sparkData={data?.engagementOverTime} sparkKey="saves" sparkColor="#FF385C" />
      <KPICard title={s?.propertiesViewed || 'Viewed'} value={data?.kpis?.recentlyViewed || '0'} icon={Eye}
        sparkData={data?.engagementOverTime} sparkKey="views" sparkColor="#222222" />
      <KPICard title={s?.inquiriesSent || 'Inquiries'} value={data?.kpis?.contactedAgents || '0'} icon={MessageSquare}
        sparkData={data?.engagementOverTime} sparkKey="searches" sparkColor="#3B82F6" />
      <KPICard title={s?.transactions || 'Stays'} value={data?.kpis?.completedTransactions || '0'} icon={Home} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartCard title={s?.activityTrends || 'Activity trends'} icon={Activity} className="lg:col-span-2">
        <CardContent className="p-5 h-[320px]">
          {data?.engagementOverTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.engagementOverTime} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} dx={-10} />
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Area type="monotone" dataKey="views" name="Views" stroke="#222222" strokeWidth={2} fill="#222222" fillOpacity={0.05} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="saves" name="Saves" stroke="#FF385C" strokeWidth={2} fill="#FF385C" fillOpacity={0.06} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState message={s?.noActivityData || 'No data available.'} />}
        </CardContent>
      </ChartCard>

      <ChartCard title={s?.recentHistory || 'Recent history'} className="h-[415px] flex flex-col">
        <CardContent className="p-0 overflow-y-auto flex-1">
          {data?.recentActivity?.length > 0 ? (
            <div className="divide-y divide-[#EBEBEB]">
              {data.recentActivity.map((act: any) => (
                <div key={act.id} className="p-4 hover:bg-[#F7F7F7] flex flex-col gap-1">
                  <p className="text-[13px] font-semibold text-[#222222] truncate">{act.propertyTitle}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#717171]">
                    <span>{act.city} · {new Date(act.timestamp).toLocaleDateString()}</span>
                    <span className="uppercase font-bold tracking-wide">{act.type?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message={s?.noRecentActivity || 'No recent activity.'} />}
        </CardContent>
      </ChartCard>
    </div>
  </div>
);

// ─── Agent Dashboard ───────────────────────────────────────────────────────────

const AgentDashboard = ({ data, dateRange, setDateRange, onExport, s, refreshing }: any) => (
  <div className="max-w-7xl mx-auto space-y-8 pb-12">
    <DashboardHeader
      title={s?.agentPerformance || 'Performance dashboard'}
      description={s?.agentPerformanceDesc || 'Overview of your listings, conversions, and revenue.'}
      dateRange={dateRange} setDateRange={setDateRange} onExport={onExport} s={s} refreshing={refreshing}
    />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KPICard title={s?.totalViews || 'Views'} value={analyticsService.formatNumber(data?.kpis?.totalViews || 0)} icon={Eye}
        sparkData={data?.engagementOverTime} sparkKey="views" sparkColor="#222222" />
      <KPICard title={s?.inquiries || 'Inquiries'} value={data?.kpis?.inquiriesReceived || '0'} icon={MessageSquare}
        sparkData={data?.engagementOverTime} sparkKey="inquiries" sparkColor="#3B82F6" />
      <KPICard title={s?.saved || 'Saved'} value={data?.kpis?.savedProperties || '0'} icon={Heart}
        sparkData={data?.engagementOverTime} sparkKey="saves" sparkColor="#FF385C" />
      <KPICard title={s?.activeListings || 'Listings'} value={data?.kpis?.activeListings || '0'} icon={Home} />
      <KPICard title={s?.estRevenue || 'Revenue'} value={analyticsService.formatCurrency(data?.kpis?.estimatedRevenue || 0)} icon={DollarSign} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartCard title={s?.listingEngagement || 'Listing engagement'} icon={Activity} className="lg:col-span-2">
        <CardContent className="p-5 h-[320px]">
          {data?.engagementOverTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.engagementOverTime} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} dx={-10} />
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Area type="monotone" name="Views" dataKey="views" stroke="#222222" strokeWidth={2} fill="#222222" fillOpacity={0.05} activeDot={{ r: 4 }} />
                <Area type="monotone" name="Inquiries" dataKey="inquiries" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.06} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState message={s?.noEngagementData || 'No data available.'} />}
        </CardContent>
      </ChartCard>

      <ChartCard title={s?.conversionFunnel || 'Conversion funnel'} className="h-[415px] flex flex-col">
        <CardContent className="p-6 flex-1 flex flex-col justify-center space-y-6">
          {[
            { label: s?.totalInquiries || 'Total inquiries', value: data?.conversionRate?.totalInquiries || 0, pct: 100, color: 'bg-[#222222]' },
            { label: s?.responded || 'Responded', value: data?.conversionRate?.responded || 0, pct: data?.conversionRate?.totalInquiries ? (data.conversionRate.responded / data.conversionRate.totalInquiries) * 100 : 0, color: 'bg-blue-500' },
            { label: s?.closedDeals || 'Closed', value: data?.conversionRate?.closed || 0, pct: data?.conversionRate?.totalInquiries ? (data.conversionRate.closed / data.conversionRate.totalInquiries) * 100 : 0, color: 'bg-emerald-500' },
          ].map(row => (
            <div key={row.label}>
              <div className="flex justify-between mb-2 text-[13px]">
                <span className="text-[#717171]">{row.label}</span>
                <span className="font-bold text-[#222222]">{row.value}</span>
              </div>
              <div className="h-2 w-full bg-[#F7F7F7] rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', row.color)} style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-[#EBEBEB] flex justify-between items-center">
            <span className="text-[12px] text-[#717171] uppercase font-bold tracking-wide">{s?.successRate || 'Success rate'}</span>
            <span className="text-[22px] font-bold text-[#222222]">{data?.conversionRate?.conversionPercentage || '0'}%</span>
          </div>
        </CardContent>
      </ChartCard>
    </div>

    {/* Revenue by month bar chart */}
    {data?.revenueByMonth?.length > 0 && (
      <ChartCard title="Monthly Revenue" icon={BarChart2}>
        <CardContent className="p-5 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueByMonth} margin={{ top: 10, right: 0, left: -10, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} tickFormatter={v => analyticsService.formatNumber(v)} />
              <Tooltip {...chartTooltipStyle} formatter={(v: any) => analyticsService.formatCurrency(v)} />
              <Bar dataKey="revenue" name="Revenue" fill="#222222" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </ChartCard>
    )}

    {/* Top listings */}
    <ChartCard title={s?.topPerformingListings || 'Top performing listings'} icon={Home}>
      <CardContent className="p-0">
        {data?.topPerformingListings?.length > 0 ? (
          <div className="divide-y divide-[#EBEBEB]">
            {data.topPerformingListings.map((listing: any, idx: number) => (
              <div key={listing.id} className="p-5 flex items-center gap-4 hover:bg-[#F7F7F7] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center shrink-0 overflow-hidden">
                  {listing.image
                    ? <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                    : <Building2 className="w-5 h-5 text-[#AAAAAA]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#222222] truncate">{idx + 1}. {listing.title}</p>
                  <p className="text-[12px] text-[#717171]">{analyticsService.formatCurrency(listing.price)}</p>
                </div>
                <div className="flex gap-6 text-[13px] text-[#222222] shrink-0">
                  <div className="text-right"><p className="text-[11px] text-[#AAAAAA] mb-0.5 uppercase font-bold">Views</p><p className="font-semibold">{listing.views}</p></div>
                  <div className="text-right"><p className="text-[11px] text-[#AAAAAA] mb-0.5 uppercase font-bold">Leads</p><p className="font-semibold">{listing.inquiries}</p></div>
                  <div className="text-right"><p className="text-[11px] text-[#AAAAAA] mb-0.5 uppercase font-bold">Saves</p><p className="font-semibold">{listing.saves}</p></div>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState message={s?.noListingData || 'No listing data available.'} />}
      </CardContent>
    </ChartCard>
  </div>
);

// ─── Landlord Dashboard ────────────────────────────────────────────────────────

const LandlordDashboard = ({ data, hostStats, dateRange, setDateRange, onExport, s, refreshing }: any) => {
  const bookingStatusData = [
    { name: 'Pending', value: hostStats?.pending || 0 },
    { name: 'Confirmed', value: hostStats?.confirmed || 0 },
    { name: 'Completed', value: hostStats?.completed || 0 },
    { name: 'Cancelled', value: hostStats?.cancelled || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <DashboardHeader
        title="Host Performance"
        description="Overview of your short-term rental bookings and revenue."
        dateRange={dateRange} setDateRange={setDateRange} onExport={onExport} s={s} refreshing={refreshing}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Bookings" value={hostStats?.total || '0'} icon={Calendar}
          sparkData={data?.engagementOverTime} sparkKey="views" sparkColor="#222222" />
        <KPICard title="Confirmed" value={hostStats?.confirmed || '0'} icon={CheckCircle2}
          sparkData={data?.engagementOverTime} sparkKey="inquiries" sparkColor="#10B981" />
        <KPICard title="Active Listings" value={data?.kpis?.activeListings || hostStats?.properties || '0'} icon={Building2} />
        <KPICard title="Est. Revenue" value={analyticsService.formatCurrency(data?.kpis?.estimatedRevenue || 0)} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking trends area chart */}
        <ChartCard title="Booking Trends" icon={Activity} className="lg:col-span-2">
          <CardContent className="p-5 h-[320px]">
            {data?.engagementOverTime?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.engagementOverTime} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} dx={-10} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Area type="monotone" dataKey="views" name="Views" stroke="#222222" strokeWidth={2} fill="#222222" fillOpacity={0.05} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="inquiries" name="Booking Requests" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.07} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No booking data for this period." />}
          </CardContent>
        </ChartCard>

        {/* Booking status pie */}
        <ChartCard title="Booking Status" icon={BarChart2} className="h-[415px] flex flex-col">
          <CardContent className="p-5 flex-1 flex flex-col">
            {bookingStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {bookingStatusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {bookingStatusData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-[#717171]">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.name}
                      </span>
                      <span className="font-bold text-[#222222]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState message="No booking data yet." />}
          </CardContent>
        </ChartCard>
      </div>

      {/* Revenue by month */}
      {data?.revenueByMonth?.length > 0 && (
        <ChartCard title="Monthly Revenue" icon={BarChart2}>
          <CardContent className="p-5 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByMonth} margin={{ top: 10, right: 0, left: -10, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#AAAAAA', fontSize: 11 }} tickFormatter={v => analyticsService.formatNumber(v)} />
                <Tooltip {...chartTooltipStyle} formatter={(v: any) => analyticsService.formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </ChartCard>
      )}

      {/* Top properties */}
      <ChartCard title="Top Performing Properties" icon={Building2}>
        <CardContent className="p-0">
          {data?.topPerformingListings?.length > 0 ? (
            <div className="divide-y divide-[#EBEBEB]">
              {data.topPerformingListings.map((listing: any, idx: number) => {
                const occupancyPct = Math.min(100, Math.round((listing.inquiries / Math.max(listing.views, 1)) * 100));
                return (
                  <div key={listing.id} className="p-5 flex items-center gap-4 hover:bg-[#F7F7F7] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center shrink-0 overflow-hidden">
                      {listing.image
                        ? <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                        : <Bed className="w-5 h-5 text-[#AAAAAA]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#222222] truncate">{idx + 1}. {listing.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#F7F7F7] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${occupancyPct}%` }} />
                        </div>
                        <span className="text-[11px] text-[#717171] shrink-0">{occupancyPct}% rate</span>
                      </div>
                    </div>
                    <div className="flex gap-5 text-[13px] shrink-0">
                      <div className="text-right"><p className="text-[11px] text-[#AAAAAA] mb-0.5 uppercase font-bold">Views</p><p className="font-semibold text-[#222222]">{listing.views}</p></div>
                      <div className="text-right"><p className="text-[11px] text-[#AAAAAA] mb-0.5 uppercase font-bold">Bookings</p><p className="font-semibold text-[#222222]">{listing.inquiries}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState message="No property data available." />}
        </CardContent>
      </ChartCard>
    </div>
  );
};

// ─── Loading skeleton ──────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
    <div className="h-12 w-64 bg-[#EBEBEB] rounded-xl" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[#F7F7F7] rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-80 bg-[#F7F7F7] rounded-2xl" />
      <div className="h-80 bg-[#F7F7F7] rounded-2xl" />
    </div>
  </div>
);

// ─── Error state ───────────────────────────────────────────────────────────────

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-32 gap-6 text-center">
    <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
      <AlertTriangle className="w-7 h-7 text-red-400" />
    </div>
    <div>
      <p className="text-[18px] font-bold text-[#222222] mb-1">Failed to load analytics</p>
      <p className="text-[14px] text-[#717171]">Something went wrong fetching your data. Please try again.</p>
    </div>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#222222] text-white text-[14px] font-semibold hover:bg-black transition-colors"
    >
      <RefreshCw className="w-4 h-4" /> Retry
    </button>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [hostStats, setHostStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days');
  const router = useRouter();
  const { t } = useLanguage();
  const { role } = useUserRole();
  const s = (t as any)?.analytics || {};

  const fetchAnalytics = useCallback(async (range: typeof dateRange, isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setRefreshing(true);
    setError(false);
    try {
      const dateParams = analyticsService.getDateRangePreset(range);
      const data = await analyticsService.getDashboard(dateParams);
      setAnalyticsData(data);

      // Derive booking stats for landlords/hosts from /bookings/hosting
      if (role === 'landlord' || role === 'host') {
        try {
          const res = await apiClient.getHostBookings({ limit: 100 });
          const bookings: any[] = Array.isArray(res) ? res : (res?.bookings ?? res?.data ?? []);
          setHostStats({
            total:     bookings.length,
            pending:   bookings.filter((b: any) => b.status === 'pending').length,
            confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
            completed: bookings.filter((b: any) => b.status === 'completed').length,
            cancelled: bookings.filter((b: any) => ['cancelled', 'rejected'].includes(b.status)).length,
            properties: [...new Set(bookings.map((b: any) => typeof b.propertyId === 'object' ? b.propertyId._id : b.propertyId))].length,
          });
        } catch { /* non-critical */ }
      }
    } catch {
      setError(true);
      if (!isInitial) toast.error('Failed to refresh analytics data');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  // Initial auth check + fetch
  useEffect(() => {
    (async () => {
      const isValid = await authService.ensureValidToken();
      if (!isValid) { router.push('/auth/login'); return; }
      await fetchAnalytics(dateRange, true);
    })();
  }, []);

  // Refetch on date range change (show old data with spinner overlay)
  useEffect(() => {
    if (!initialLoading) fetchAnalytics(dateRange);
  }, [dateRange]);

  const handleExport = async (fmt: 'json' | 'csv' | 'pdf') => {
    try {
      const dateParams = analyticsService.getDateRangePreset(dateRange);
      const blob = await analyticsService.exportData({ ...dateParams, format: fmt });
      if (blob) {
        analyticsService.downloadExport(blob, `analytics-${dateRange}.${fmt}`);
        toast.success(`Exported as ${fmt.toUpperCase()}`);
      }
    } catch {
      toast.error(`Failed to export ${fmt.toUpperCase()}`);
    }
  };

  const sharedProps = { dateRange, setDateRange, onExport: handleExport, s, refreshing };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="p-6 md:p-10 w-full">
            {initialLoading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorState onRetry={() => fetchAnalytics(dateRange, true)} />
            ) : role === 'landlord' || role === 'host' ? (
              <>
                <LandlordDashboard data={analyticsData} hostStats={hostStats} {...sharedProps} />
              </>
            ) : ['agent', 'admin'].includes(role ?? '') ? (
              <>
                <AgentDashboard data={analyticsData} {...sharedProps} />
                {role === 'admin' && (
                  <div className="mt-12 pt-12 border-t border-[#DDDDDD] max-w-7xl mx-auto">
                    <AdminShortTermAnalytics dateRange={dateRange} />
                  </div>
                )}
              </>
            ) : (
              <RegularUserDashboard data={analyticsData} {...sharedProps} />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}