'use client';

import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageSquare, 
  Home, 
  DollarSign,
  Download,
  AlertCircle,
  Users,
  Loader2
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { analyticsService } from '@/lib/services/analyticService';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

// KPI Card Component
const KPICard = ({ title, value, change, trend, icon: Icon, loading }: any) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h3 className="text-3xl font-bold mt-2 text-gray-900">{value}</h3>
            {change !== undefined && change !== null && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                ) : null}
                <span className={`text-sm font-medium ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last period</span>
              </div>
            )}
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-96 bg-gray-200 rounded animate-pulse" />
      <div className="h-96 bg-gray-200 rounded animate-pulse" />
    </div>
  </div>
);

// Regular User Dashboard
const RegularUserDashboard = ({ data, dateRange, setDateRange, loading, onExport }: any) => {
  if (loading) return <LoadingSkeleton />;

  const kpis = [
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
                    label={({ type, percentage }) => `${type} ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.propertyTypeInterest.map((entry, index) => (
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
              {data.recentActivity.map(activity => (
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

// Agent Dashboard
const AgentDashboard = ({ data, dateRange, setDateRange, loading, onExport }:any) => {
  if (loading) return <LoadingSkeleton />;

  const kpis = [
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

// Main Analytics Page Component
const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dateRange, setDateRange] = useState('30days');
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndAnalytics = async () => {
      try {
        // Check if user is authenticated
        const isValid = await authService.ensureValidToken();
        if (!isValid) {
          router.push('/auth/login');
          return;
        }

        // Get user info
        const user = authService.getStoredUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        setUserRole(user.role);
        await fetchAnalytics(dateRange);
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/auth/login');
      }
    };

    fetchUserAndAnalytics();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchAnalytics(dateRange);
    }
  }, [dateRange]);

  const fetchAnalytics = async (range: any) => {
    setLoading(true);
    try {
      const dateParams = analyticsService.getDateRangePreset(range);
      const data = await analyticsService.getDashboard(dateParams);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const dateParams = analyticsService.getDateRangePreset(dateRange);
      const blob = await analyticsService.exportData({ ...dateParams, format });
      
      const filename = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`;
      analyticsService.downloadExport(blob, filename);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="flex-1 min-h-screen pt-14 lg:pt-0">
            {loading && !analyticsData ? (
              <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : userRole === 'agent' ? (
              <AgentDashboard 
                data={analyticsData} 
                dateRange={dateRange}
                setDateRange={setDateRange}
                loading={loading}
                onExport={handleExport}
              />
            ) : (
              <RegularUserDashboard 
                data={analyticsData}
                dateRange={dateRange}
                setDateRange={setDateRange}
                loading={loading}
                onExport={handleExport}
              />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AnalyticsPage;