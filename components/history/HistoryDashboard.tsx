'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Search, 
  MapPin, 
  Calendar,
  Activity,
  Users,
  Heart,
  MessageSquare,
  Clock,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface ActivityStat {
  _id: string;
  count: number;
  lastActivity: Date;
}

interface CityData {
  city: string;
  country: string;
  count: number;
  uniqueUsers: number;
}

interface PropertyView {
  propertyId: string;
  property: any;
  viewCount: number;
  uniqueViewers: number;
  avgViewDuration: number;
  lastViewed: Date;
}

interface SearchTrend {
  query: string;
  count: number;
  avgResults: number;
  avgClicked: number;
  clickThroughRate: number;
  uniqueUsers: number;
  lastSearched: Date;
}

interface DailyActivity {
  date: string;
  activities: Array<{ type: string; count: number }>;
  total: number;
}

interface UserActivity {
  totalActivity: number;
  byType: ActivityStat[];
  timeframe: number;
}

const HistoryDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent' || isAdmin;

  // State
  const [timeframe, setTimeframe] = useState(30);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'properties'>('overview');
  
  // Data state
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [popularCities, setPopularCities] = useState<CityData[]>([]);
  const [mostViewed, setMostViewed] = useState<PropertyView[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [timeframe, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        apiClient.getMyActivity(timeframe),
        apiClient.getPopularCities(10, timeframe),
      ];

      if (isAgent) {
        promises.push(
          apiClient.getSearchTrends(timeframe, 10),
          apiClient.request({ 
            url: '/history/most-viewed-properties',
            params: { limit: 5, timeframe },
            skipAuth: true 
          } as any)
        );
      }

      if (isAdmin) {
        promises.push(apiClient.getDashboardStats(timeframe));
      }

      const results = await Promise.all(promises);
      
      setUserActivity(results[0]);
      setPopularCities(results[1]);
      
      if (isAgent) {
        setSearchTrends(results[2]);
        setMostViewed(results[3]);
      }
      
      if (isAdmin && results[4]) {
        setDashboardStats(results[4]);
      }
    } catch (error) {
      console.error('Failed to fetch history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      property_view: <Eye className="h-4 w-4" />,
      search: <Search className="h-4 w-4" />,
      favorite_add: <Heart className="h-4 w-4" />,
      property_inquiry: <MessageSquare className="h-4 w-4" />,
      agent_contact: <Users className="h-4 w-4" />,
      login: <Activity className="h-4 w-4" />,
    };
    return icons[type] || <Activity className="h-4 w-4" />;
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      property_view: 'Property Views',
      search: 'Searches',
      favorite_add: 'Favorites Added',
      favorite_remove: 'Favorites Removed',
      property_inquiry: 'Inquiries',
      agent_contact: 'Agent Contacts',
      login: 'Logins',
      logout: 'Logouts',
      property_share: 'Shares',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Analytics</h2>
          <p className="text-gray-600 mt-1">Track your platform engagement and insights</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeframe === days
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {['overview', 'trends', 'properties'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Admin Dashboard Stats */}
          {isAdmin && dashboardStats && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Platform Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(dashboardStats.overview.totalViews)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Searches</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(dashboardStats.overview.totalSearches)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(dashboardStats.overview.activeUsers)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Favorites</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(dashboardStats.overview.totalFavorites)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Summary Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Your Activity Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userActivity?.byType.map((activity) => (
                    <tr key={activity._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            {getActivityIcon(activity._id)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {getActivityLabel(activity._id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatNumber(activity.count)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(activity.lastActivity).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popular Cities Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Popular Cities
              </h3>
              <span className="text-sm text-gray-500">Top {popularCities.length} locations</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {popularCities.map((city, index) => (
                    <tr key={city.city} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{city.city}</div>
                          <div className="text-sm text-gray-500">{city.country}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-gray-900">
                          {formatNumber(city.count)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {city.uniqueUsers} users
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((city.count / popularCities[0].count) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {((city.count / popularCities[0].count) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && isAgent && (
        <div className="space-y-6">
          {/* Search Trends Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Top Search Queries
              </h3>
              <span className="text-sm text-gray-500">Last {timeframe} days</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Searches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Results
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Searched
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {searchTrends.map((trend, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{trend.query}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-gray-900">
                          {formatNumber(trend.count)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trend.clickThroughRate > 0.5 
                            ? 'bg-green-100 text-green-800' 
                            : trend.clickThroughRate > 0.3
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(trend.clickThroughRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {trend.avgResults.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {trend.uniqueUsers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(trend.lastSearched).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && isAgent && (
        <div className="space-y-6">
          {/* Most Viewed Properties Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Most Viewed Properties
              </h3>
              <span className="text-sm text-gray-500">Last {timeframe} days</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Viewers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Viewed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mostViewed.map((property) => (
                    <tr key={property.propertyId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {property.property?.images?.[0] && (
                            <img
                              src={property.property.images[0]}
                              alt={property.property.title}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {property.property?.title || 'Property'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {property.property?.city}, {property.property?.country}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="text-lg font-bold text-gray-900">
                            {formatNumber(property.viewCount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {property.uniqueViewers}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDuration(property.avgViewDuration)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          ${property.property?.price?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(property.lastViewed).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && userActivity?.totalActivity === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
          <p className="text-gray-600">Start exploring properties to see your activity here.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryDashboard;