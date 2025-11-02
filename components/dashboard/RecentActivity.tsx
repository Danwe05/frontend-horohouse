'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Eye, 
  Heart, 
  Search, 
  Home, 
  MessageSquare, 
  DollarSign,
  Calendar,
  User,
  MapPin
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'view' | 'favorite' | 'search' | 'inquiry' | 'listing' | 'sale' | 'message';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    propertyId?: string;
    propertyTitle?: string;
    price?: number;
    location?: string;
    userAvatar?: string;
    userName?: string;
  };
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'view':
      return <Eye className="h-4 w-4" />;
    case 'favorite':
      return <Heart className="h-4 w-4" />;
    case 'search':
      return <Search className="h-4 w-4" />;
    case 'inquiry':
      return <MessageSquare className="h-4 w-4" />;
    case 'listing':
      return <Home className="h-4 w-4" />;
    case 'sale':
      return <DollarSign className="h-4 w-4" />;
    case 'message':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'view':
      return 'bg-blue-100 text-blue-800';
    case 'favorite':
      return 'bg-red-100 text-red-800';
    case 'search':
      return 'bg-green-100 text-green-800';
    case 'inquiry':
      return 'bg-purple-100 text-purple-800';
    case 'listing':
      return 'bg-orange-100 text-orange-800';
    case 'sale':
      return 'bg-emerald-100 text-emerald-800';
    case 'message':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  activities, 
  title = "Recent Activity",
  maxItems = 10 
}) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            displayActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  
                  {activity.metadata && (
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      {activity.metadata.propertyTitle && (
                        <div className="flex items-center space-x-1">
                          <Home className="h-3 w-3" />
                          <span className="truncate max-w-32">{activity.metadata.propertyTitle}</span>
                        </div>
                      )}
                      
                      {activity.metadata.price && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${activity.metadata.price.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {activity.metadata.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-24">{activity.metadata.location}</span>
                        </div>
                      )}
                      
                      {activity.metadata.userName && (
                        <div className="flex items-center space-x-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={activity.metadata.userAvatar} />
                            <AvatarFallback className="text-xs">
                              {activity.metadata.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-20">{activity.metadata.userName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {activities.length > maxItems && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all activity ({activities.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Sample data generators for different user types
export const generateUserActivities = (): ActivityItem[] => [
  {
    id: '1',
    type: 'view',
    title: 'Viewed Property',
    description: 'Modern 3BR apartment in downtown',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metadata: {
      propertyTitle: 'Modern Downtown Apartment',
      price: 450000,
      location: 'Downtown'
    }
  },
  {
    id: '2',
    type: 'favorite',
    title: 'Added to Favorites',
    description: 'Luxury villa with ocean view',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: {
      propertyTitle: 'Ocean View Villa',
      price: 1200000,
      location: 'Beachfront'
    }
  },
  {
    id: '3',
    type: 'search',
    title: 'New Search',
    description: 'Searched for "2 bedroom apartments under $300k"',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'inquiry',
    title: 'Sent Inquiry',
    description: 'Contacted agent about property details',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      propertyTitle: 'Family Home',
      location: 'Suburbs'
    }
  }
];

export const generateAgentActivities = (): ActivityItem[] => [
  {
    id: '1',
    type: 'listing',
    title: 'New Listing Added',
    description: 'Published luxury condo in city center',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    metadata: {
      propertyTitle: 'Luxury City Condo',
      price: 750000,
      location: 'City Center'
    }
  },
  {
    id: '2',
    type: 'inquiry',
    title: 'New Inquiry Received',
    description: 'Client interested in viewing property',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: {
      userName: 'John Smith',
      propertyTitle: 'Modern Family Home'
    }
  },
  {
    id: '3',
    type: 'sale',
    title: 'Property Sold',
    description: 'Successfully closed deal',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: {
      propertyTitle: 'Suburban House',
      price: 425000,
      location: 'Westside'
    }
  },
  {
    id: '4',
    type: 'message',
    title: 'Client Message',
    description: 'Received message about property viewing',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    metadata: {
      userName: 'Sarah Johnson'
    }
  }
];

export const generateAdminActivities = (): ActivityItem[] => [
  {
    id: '1',
    type: 'listing',
    title: 'Property Approved',
    description: 'Approved new listing from agent',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    metadata: {
      userName: 'Agent Mike',
      propertyTitle: 'Downtown Loft'
    }
  },
  {
    id: '2',
    type: 'message',
    title: 'System Alert',
    description: 'High traffic detected on property search',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'sale',
    title: 'Platform Revenue',
    description: 'Commission received from property sale',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: {
      price: 15000
    }
  }
];