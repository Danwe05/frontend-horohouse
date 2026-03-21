'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { analyticsService, DateRangeParams } from '@/lib/services/analyticService';
import {
    TrendingUp, TrendingDown, DollarSign, Users,
    Home, Calendar, BarChart3, PieChart as PieChartIcon,
    Activity, MapPin, Star, ArrowUpRight, Loader2,
    Hotel, Briefcase, UserCheck
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function AdminShortTermAnalytics({ dateRange }: { dateRange: string }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        kpis: null,
        revenue: [],
        occupancy: [],
        topProperties: [],
        cities: [],
        hosts: []
    });

    const { t } = useLanguage();
    const s = (t as any)?.analytics || {};

    useEffect(() => {
        const fetchAdminSTData = async () => {
            setLoading(true);
            try {
                const params = analyticsService.getDateRangePreset(dateRange as any);
                const [kpis, revenue, occupancy, topProperties, cities, hosts] = await Promise.all([
                    analyticsService.getAdminKPIs(params),
                    analyticsService.getAdminRevenue(params),
                    analyticsService.getAdminOccupancy(params),
                    analyticsService.getAdminTopProperties({ ...params, limit: 5 }),
                    analyticsService.getAdminCityPerformance(params),
                    analyticsService.getAdminHostPerformance({ ...params, limit: 5 })
                ]);

                setData({
                    kpis,
                    revenue: revenue.data || [],
                    occupancy: occupancy.data || [],
                    topProperties: topProperties.properties || [],
                    cities: cities.cities || [],
                    hosts: hosts.hosts || []
                });
            } catch (err) {
                console.error('Failed to fetch admin ST analytics:', err);
                toast.error('Failed to load short-term rental analytics.');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminSTData();
    }, [dateRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const kpis = data.kpis;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Hotel className="h-5 w-5 text-blue-500" />
                        {s?.adminStOversight || "Short-Term Rental Oversight"}
                    </h2>
                    <p className="text-sm text-slate-500">{s?.adminStOversightDesc || "Performance metrics for bookings, occupancy, and hosts"}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Activity className="h-3 w-3" /> {s?.liveData || "Live Data"}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title={s?.grossRevenue || "Gross Revenue"}
                    value={analyticsService.formatCurrency(kpis?.totalRevenue || 0)}
                    change={kpis?.revenueChange}
                    icon={DollarSign}
                    color="blue"
                />
                <KPICard
                    title={s?.totalBookings || "Total Bookings"}
                    value={kpis?.totalBookings || 0}
                    change={kpis?.bookingsChange}
                    icon={Calendar}
                    color="purple"
                />
                <KPICard
                    title={s?.avgOccupancy || "Avg. Occupancy"}
                    value={`${kpis?.avgOccupancy || 0}%`}
                    change={kpis?.occupancyChange}
                    icon={Activity}
                    color="emerald"
                />
                <KPICard
                    title={s?.activeHosts || "Active Hosts"}
                    value={kpis?.activeHosts || 0}
                    icon={Users}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trends */}
                <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-50">
                        <CardTitle className="text-lg font-bold">{s?.revenueGrowth || "Revenue Growth"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenue}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(val: number) => [analyticsService.formatCurrency(val), s?.revenue || 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Occupancy Chart */}
                <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-50">
                        <CardTitle className="text-lg font-bold">{s?.occupancyRate || "Occupancy Rate (%)"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.occupancy}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="occupancy" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* City Performance */}
                <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-50">
                        <CardTitle className="text-lg font-bold">{s?.cityPerformance || "City Performance"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.cities}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="bookings"
                                    nameKey="city"
                                >
                                    {data.cities.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Properties */}
                <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-50">
                        <CardTitle className="text-lg font-bold">{s?.topStProperties || "Top Short-Term Properties"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {data.topProperties.map((prop: any, idx: number) => (
                                <div key={prop._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden">
                                            {prop.image ? <img src={prop.image} className="w-full h-full object-cover" /> : <Home className="h-5 w-5 m-2.5 text-slate-300" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 line-clamp-1">{prop.title}</p>
                                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <MapPin className="h-2.5 w-2.5" /> {prop.city}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-800">{analyticsService.formatCurrency(prop.revenue)}</p>
                                        <p className="text-[10px] text-slate-400">{prop.bookings} {s?.bookingsNum || "bookings"} · {prop.occupancy}% {s?.occNum || "occ."}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Hosts */}
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-50">
                    <CardTitle className="text-lg font-bold">{s?.topPerformingHosts || "Top Performing Hosts"}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-x divide-slate-100">
                        {data.hosts.map((host: any) => (
                            <div key={host._id} className="p-6 text-center space-y-3 hover:bg-slate-50 transition-colors">
                                <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                                    {host.avatar ? <img src={host.avatar} className="w-full h-full object-cover" /> : <UserCheck className="h-8 w-8 text-blue-500" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 truncate">{host.name}</p>
                                    <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {host.rating} ({host.reviews})
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-slate-100 space-y-1">
                                    <p className="text-xs font-black text-blue-600">{analyticsService.formatCurrency(host.revenue)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s?.totalRevenue || "Total Revenue"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function KPICard({ title, value, change, icon: Icon, color }: any) {
    const isPositive = change > 0;
    return (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-600`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {change !== undefined && (
                        <span className={`text-[10px] font-bold flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                            {Math.abs(change)}%
                        </span>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-black text-slate-800">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
