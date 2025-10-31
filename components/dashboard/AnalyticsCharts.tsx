'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageSquare, 
  DollarSign,
  Users,
  Home,
  Calendar,
  MapPin,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

interface AnalyticsData {
  propertyViews: ChartData;
  propertyInquiries: ChartData;
  revenueData: ChartData;
  locationStats: ChartData;
  monthlyStats: {
    views: number;
    inquiries: number;
    revenue: number;
    newListings: number;
  };
  topProperties: Array<{
    id: string;
    title: string;
    views: number;
    inquiries: number;
    revenue: number;
  }>;
  locationBreakdown: Array<{
    location: string;
    properties: number;
    views: number;
    inquiries: number;
  }>;
}

interface AnalyticsChartsProps {
  userRole: 'registered_user' | 'agent' | 'admin';
  userId?: string;
}

const SimpleChart: React.FC<{ data: ChartData; title: string; type: 'bar' | 'line' }> = ({ 
  data, 
  title, 
  type 
}) => {
  const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
  const minValue = Math.min(...data.datasets.flatMap(d => d.data));
  const range = maxValue - minValue || 1;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="h-64 w-full">
        <div className="flex items-end justify-between h-full space-x-2">
          {data.labels.map((label, index) => {
            const value = data.datasets[0]?.data[index] || 0;
            const height = ((value - minValue) / range) * 100;
            const isHighest = value === maxValue;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative w-full flex justify-center">
                  <div
                    className={`w-8 rounded-t transition-all duration-500 ${
                      type === 'bar' 
                        ? `bg-gradient-to-t from-blue-500 to-blue-400 ${isHighest ? 'from-green-500 to-green-400' : ''}`
                        : 'bg-blue-500 h-2 w-2 rounded-full'
                    }`}
                    style={{ 
                      height: type === 'bar' ? `${height}%` : '8px',
                      minHeight: type === 'bar' ? '4px' : '8px'
                    }}
                    title={`${label}: ${value}`}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center">
                  <div className="font-medium">{value}</div>
                  <div className="text-xs truncate max-w-16">{label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Min: {minValue}</span>
          <span>Max: {maxValue}</span>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
}> = ({ title, value, change, icon, format = 'number' }) => {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `$${Number(val).toLocaleString()}`;
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return Number(val).toLocaleString();
  };

  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(change)}% from last month
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ userRole, userId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [userRole, userId, timeRange]);

  const loadAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Generate sample data based on user role
      const data = await generateAnalyticsData(userRole, timeRange);
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      setError(err?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateAnalyticsData = async (role: string, range: string): Promise<AnalyticsData> => {
    // Generate sample data - in real implementation, this would come from API
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const labels = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const baseViews = role === 'agent' ? 100 : role === 'admin' ? 500 : 20;
    const baseInquiries = role === 'agent' ? 15 : role === 'admin' ? 80 : 5;
    const baseRevenue = role === 'agent' ? 5000 : role === 'admin' ? 25000 : 0;

    return {
      propertyViews: {
        labels,
        datasets: [{
          label: 'Property Views',
          data: labels.map(() => Math.floor(Math.random() * baseViews) + 10),
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      },
      propertyInquiries: {
        labels,
        datasets: [{
          label: 'Inquiries',
          data: labels.map(() => Math.floor(Math.random() * baseInquiries) + 1),
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2
        }]
      },
      revenueData: {
        labels,
        datasets: [{
          label: 'Revenue ($)',
          data: labels.map(() => Math.floor(Math.random() * baseRevenue) + 100),
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 2
        }]
      },
      locationStats: {
        labels: ['Downtown', 'Suburbs', 'Beachfront', 'Mountains', 'City Center'],
        datasets: [{
          label: 'Properties by Location',
          data: [45, 32, 28, 15, 38],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      },
      monthlyStats: {
        views: Math.floor(Math.random() * 1000) + 500,
        inquiries: Math.floor(Math.random() * 100) + 50,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        newListings: Math.floor(Math.random() * 20) + 5
      },
      topProperties: Array.from({ length: 5 }, (_, i) => ({
        id: `prop-${i + 1}`,
        title: `Luxury Property ${i + 1}`,
        views: Math.floor(Math.random() * 500) + 100,
        inquiries: Math.floor(Math.random() * 50) + 5,
        revenue: Math.floor(Math.random() * 10000) + 1000
      })),
      locationBreakdown: [
        { location: 'Downtown', properties: 45, views: 1200, inquiries: 85 },
        { location: 'Suburbs', properties: 32, views: 980, inquiries: 67 },
        { location: 'Beachfront', properties: 28, views: 1450, inquiries: 92 },
        { location: 'Mountains', properties: 15, views: 320, inquiries: 18 },
        { location: 'City Center', properties: 38, views: 1100, inquiries: 73 }
      ]
    };
  };

  const handleRefresh = () => {
    loadAnalyticsData(true);
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const csvData = [
      ['Date', 'Views', 'Inquiries', 'Revenue'],
      ...analyticsData.propertyViews.labels.map((label, index) => [
        label,
        analyticsData.propertyViews.datasets[0].data[index].toString(),
        analyticsData.propertyInquiries.datasets[0].data[index].toString(),
        analyticsData.revenueData.datasets[0].data[index].toString()
      ])
    ];
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your property performance and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Views"
          value={analyticsData.monthlyStats.views}
          change={12}
          icon={<Eye className="h-6 w-6 text-blue-600" />}
        />
        <MetricCard
          title="Inquiries"
          value={analyticsData.monthlyStats.inquiries}
          change={8}
          icon={<MessageSquare className="h-6 w-6 text-green-600" />}
        />
        <MetricCard
          title="Revenue"
          value={analyticsData.monthlyStats.revenue}
          change={15}
          icon={<DollarSign className="h-6 w-6 text-yellow-600" />}
          format="currency"
        />
        <MetricCard
          title="New Listings"
          value={analyticsData.monthlyStats.newListings}
          change={-3}
          icon={<Home className="h-6 w-6 text-purple-600" />}
        />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="properties">Top Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Views Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart data={analyticsData.propertyViews} title="" type="bar" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Inquiries Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart data={analyticsData.propertyInquiries} title="" type="line" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChart data={analyticsData.revenueData} title="" type="bar" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Properties by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart data={analyticsData.locationStats} title="" type="bar" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Location Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.locationBreakdown.map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{location.location}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="text-center">
                          <div className="font-semibold">{location.properties}</div>
                          <div className="text-xs">Properties</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{location.views}</div>
                          <div className="text-xs">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{location.inquiries}</div>
                          <div className="text-xs">Inquiries</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProperties.map((property, index) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{property.title}</h4>
                        <p className="text-sm text-gray-600">Property ID: {property.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{property.views}</div>
                        <div className="text-gray-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{property.inquiries}</div>
                        <div className="text-gray-500">Inquiries</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-yellow-600">${property.revenue.toLocaleString()}</div>
                        <div className="text-gray-500">Revenue</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
