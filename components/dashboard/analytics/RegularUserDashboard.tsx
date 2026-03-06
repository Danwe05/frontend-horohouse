import React from 'react';
import {
    Heart,
    Eye,
    Users,
    Home,
    Download,
    AlertCircle
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { KPICard } from './KPICard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { DashboardProps, KPICardProps } from '@/app/dashboard/analytics/types';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const RegularUserDashboard = ({ data, dateRange, setDateRange, loading, onExport }: DashboardProps) => {
    if (loading) return <LoadingSkeleton />;

    const kpis: KPICardProps[] = [
        {
            title: 'Saved Properties',
            value: data?.kpis?.savedProperties?.toString() || '0',
            icon: Heart
        },
        {
            title: 'Recently Viewed',
            value: data?.kpis?.recentlyViewed?.toString() || '0',
            icon: Eye
        },
        {
            title: 'Contacted Agents',
            value: data?.kpis?.contactedAgents?.toString() || '0',
            icon: Users
        },
        {
            title: 'Completed Transactions',
            value: data?.kpis?.completedTransactions?.toString() || '0',
            icon: Home
        }
    ];

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Your Analytics</h1>
                    <p className="text-gray-600 mt-1">Track your property search journey</p>
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

            {/* Insights Alerts */}
            {data?.insights && data.insights.length > 0 && (
                <div className="space-y-3">
                    {data.insights.slice(0, 3).map((insight, idx) => (
                        <Alert key={idx} className="border-blue-200 bg-blue-50">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-sm font-medium">
                                {insight}
                            </AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                    <KPICard key={idx} {...kpi} loading={loading} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Engagement Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle>Engagement Over Time</CardTitle>
                        <CardDescription>Your activity on the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.engagementOverTime && data.engagementOverTime.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={data.engagementOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="searches" stroke="#3b82f6" strokeWidth={2} name="Searches" />
                                    <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} name="Views" />
                                    <Line type="monotone" dataKey="saves" stroke="#ec4899" strokeWidth={2} name="Saves" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                No engagement data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Property Type Interest */}
                <Card>
                    <CardHeader>
                        <CardTitle>Property Type Interest</CardTitle>
                        <CardDescription>What you're looking for most</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.propertyTypeInterest && data.propertyTypeInterest.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={data.propertyTypeInterest}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ type, percentage }: any) => `${type} ${percentage}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {data.propertyTypeInterest.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                Start viewing properties to see your interests
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest interactions</CardDescription>
                </CardHeader>
                <CardContent>
                    {data?.recentActivity && data.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {data.recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={
                                                activity.type === 'favorite_add' ? 'default' :
                                                    activity.type === 'property_inquiry' ? 'secondary' :
                                                        'outline'
                                            } className="text-xs">
                                                {activity.type.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {new Date(activity.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-900">{activity.propertyTitle}</p>
                                        <p className="text-sm text-gray-600">{activity.city}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500">
                            No recent activity to display
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
