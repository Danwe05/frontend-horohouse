import React from 'react';
import {
    Eye,
    MessageSquare,
    Heart,
    Home,
    DollarSign,
    Download
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from './KPICard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { DashboardProps, KPICardProps } from '@/app/dashboard/analytics/types';
import { analyticsService } from '@/lib/services/analyticService';

export const AgentDashboard = ({ data, dateRange, setDateRange, loading, onExport }: DashboardProps) => {
    if (loading) return <LoadingSkeleton />;

    const kpis: KPICardProps[] = [
        {
            title: 'Total Views',
            value: analyticsService.formatNumber(data?.kpis?.totalViews || 0),
            icon: Eye
        },
        {
            title: 'Inquiries Received',
            value: data?.kpis?.inquiriesReceived?.toString() || '0',
            icon: MessageSquare
        },
        {
            title: 'Saved Properties',
            value: data?.kpis?.savedProperties?.toString() || '0',
            icon: Heart
        },
        {
            title: 'Active Listings',
            value: data?.kpis?.activeListings?.toString() || '0',
            icon: Home
        },
        {
            title: 'Estimated Revenue',
            value: analyticsService.formatCurrency(data?.kpis?.estimatedRevenue || 0),
            icon: DollarSign
        }
    ];

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agent Analytics</h1>
                    <p className="text-gray-600 mt-1">Monitor your listings performance</p>
                </div>
                <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Last 7 days</SelectItem>
                            <SelectItem value="30days">Last 30 days</SelectItem>
                            <SelectItem value="90days">Last 90 days</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => onExport('json')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {kpis.map((kpi, idx) => (
                    <KPICard key={idx} {...kpi} loading={loading} />
                ))}
            </div>

            {/* Engagement Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Property Engagement Over Time</CardTitle>
                    <CardDescription>Views, inquiries, and saves</CardDescription>
                </CardHeader>
                <CardContent>
                    {data?.engagementOverTime && data.engagementOverTime.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={data.engagementOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} name="Views" />
                                <Line type="monotone" dataKey="inquiries" stroke="#10b981" strokeWidth={3} name="Inquiries" />
                                <Line type="monotone" dataKey="saves" stroke="#ec4899" strokeWidth={3} name="Saves" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[350px] flex items-center justify-center text-gray-500">
                            No engagement data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Listings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Listings</CardTitle>
                        <CardDescription>Your most engaging properties</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.topPerformingListings && data.topPerformingListings.length > 0 ? (
                            <div className="space-y-4">
                                {data.topPerformingListings.map((listing, idx) => (
                                    <div key={listing.id} className="border-b last:border-0 pb-4 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 text-sm">{idx + 1}.</span>
                                                    <h4 className="font-semibold text-gray-900">{listing.title}</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {analyticsService.formatCurrency(listing.price)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-sm">
                                            <span className="flex items-center text-gray-600">
                                                <Eye className="w-4 h-4 mr-1" />
                                                {listing.views}
                                            </span>
                                            <span className="flex items-center text-gray-600">
                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                {listing.inquiries}
                                            </span>
                                            <span className="flex items-center text-gray-600">
                                                <Heart className="w-4 h-4 mr-1" />
                                                {listing.saves}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                No listings data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* City Engagement */}
                <Card>
                    <CardHeader>
                        <CardTitle>Engagement by City</CardTitle>
                        <CardDescription>Where your properties attract attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.engagementByCity && data.engagementByCity.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.engagementByCity}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="city" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="views" fill="#3b82f6" name="Views" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="inquiries" fill="#10b981" name="Inquiries" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                No city data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Conversion Rate */}
            {data?.conversionRate && (
                <Card>
                    <CardHeader>
                        <CardTitle>Conversion Summary</CardTitle>
                        <CardDescription>From inquiry to closed deal</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900">{data.conversionRate.totalInquiries}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Inquiries</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">{data.conversionRate.responded}</p>
                                <p className="text-sm text-gray-600 mt-1">Responded</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{data.conversionRate.closed}</p>
                                <p className="text-sm text-gray-600 mt-1">Closed Deals</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-purple-600">{data.conversionRate.conversionPercentage}%</p>
                                <p className="text-sm text-gray-600 mt-1">Conversion Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
