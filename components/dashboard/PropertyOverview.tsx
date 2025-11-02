'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Eye, 
  Heart, 
  MessageSquare,
  Calendar,
  Star,
  Bed,
  Bath,
  Square,
  TrendingUp,
  Edit,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Property {
  id: string;
  _id?: string;
  title: string;
  price: number;
  location: string;
  type: string;
  status: 'active' | 'pending' | 'sold' | 'draft';
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images: string[];
  views: number;
  favorites: number;
  inquiries: number;
  listedDate: string;
  lastUpdated: string;
  rating?: number;
  description: string;
}

interface PropertyCardProps {
  property: Property;
  onAction: (action: string, propertyId: string) => void;
  showActions?: boolean;
  isOwner?: boolean;
  isLoading?: boolean;
}

const PropertyCardSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    <Skeleton className="w-full h-48" />
    <CardContent className="p-4">
      <div className="space-y-3">
        <div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between">
          <div className="flex space-x-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onAction, 
  showActions = true,
  isOwner = false,
  isLoading = false 
}) => {
  if (isLoading) {
    return <PropertyCardSkeleton />;
  }

  const getStatusColor = (status: Property['status']) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={(property.images && property.images[0]) || '/placeholder-property.jpg'}
          alt={property.title || 'Property'}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 left-2">
          <Badge className={getStatusColor(property.status)}>
            {property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : 'Unknown'}
          </Badge>
        </div>
        {isOwner && (
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAction('edit', property.id)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg truncate">{property.title}</h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">
                {Array.isArray((property.location as any)?.coordinates)
                  ? (property.location as any).coordinates.join(", ")
                  : property.location}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-bold text-lg text-green-600">
                ${property.price.toLocaleString()}
              </span>
            </div>
            <Badge variant="outline">{property.type}</Badge>
          </div>
          
          {(property.bedrooms || property.bathrooms || property.area) && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {property.bedrooms && (
                <div className="flex items-center space-x-1">
                  <Bed className="h-3 w-3" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center space-x-1">
                  <Bath className="h-3 w-3" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center space-x-1">
                  <Square className="h-3 w-3" />
                  <span>{property.area} sqft</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{property.views || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-3 w-3" />
                <span>{property.favorites || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>{property.inquiries || 0}</span>
              </div>
            </div>
            
            {property.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{property.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Listed: {property.listedDate ? formatDate(property.listedDate) : 'Unknown'}
          </div>
          
          {showActions && (
            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('view', property.id)}
                className="flex-1"
              >
                View Details
              </Button>
              {isOwner ? (
                <Button
                  size="sm"
                  onClick={() => onAction('manage', property.id)}
                  className="flex-1"
                >
                  Manage
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onAction('contact', property.id)}
                  className="flex-1"
                >
                  Contact Agent
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface FavoritePropertiesProps {
  onAction: (action: string, propertyId: string) => void;
  maxItems?: number;
}

export const FavoriteProperties: React.FC<FavoritePropertiesProps> = ({ 
  onAction,
  maxItems = 6 
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getFavorites();
        setProperties(data.properties || data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Failed to fetch favorite properties');
        console.error('Error fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const displayProperties = Array.isArray(properties) ? properties.slice(0, maxItems) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Favorite Properties</span>
          </div>
          {!loading && properties.length > maxItems && (
            <Button variant="outline" size="sm" onClick={() => onAction('view-all-favorites', '')}>
              View All ({properties.length})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: maxItems }, (_, i) => (
              <PropertyCardSkeleton key={`fav-skeleton-${i}`} />
            ))}
          </div>
        ) : displayProperties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No favorite properties yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => onAction('search', '')}
            >
              Start Browsing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={onAction}
                isOwner={false}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AgentListingsProps {
  onAction: (action: string, propertyId: string) => void;
  maxItems?: number;
}

export const AgentListings: React.FC<AgentListingsProps> = ({ 
  onAction,
  maxItems = 6 
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProperties, setActiveProperties] = useState(0);
  const [soldProperties, setSoldProperties] = useState(0);

  useEffect(() => {
    const fetchMyProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getMyProperties();
        const propertyList = data.properties || data || [];
        setProperties(propertyList);
        
        // Calculate stats
        setActiveProperties(propertyList.filter((p: Property) => p.status === 'active').length);
        setSoldProperties(propertyList.filter((p: Property) => p.status === 'sold').length);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Failed to fetch your listings');
        console.error('Error fetching my properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProperties();
  }, []);

const displayProperties = Array.isArray(properties) ? properties.slice(0, maxItems) : [];


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>My Listings</span>
          </div>
          <div className="flex items-center space-x-2">
            {!loading && (
              <>
                <Badge variant="outline">{activeProperties} Active</Badge>
                <Badge variant="secondary">{soldProperties} Sold</Badge>
                {properties.length > maxItems && (
                  <Button variant="outline" size="sm" onClick={() => onAction('view-all-listings', '')}>
                    View All ({properties.length})
                  </Button>
                )}
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: maxItems }, (_, i) => (
              <PropertyCardSkeleton key={`agent-skeleton-${i}`} />
            ))}
          </div>
        ) : displayProperties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No properties listed yet</p>
            <Button 
              variant="default" 
              size="sm" 
              className="mt-2"
              onClick={() => onAction('add-listing', '')}
            >
              Add Your First Listing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProperties.map((property, index) => (
              <PropertyCard
                key={property.id || property._id || `property-${index}`}
                property={property}
                onAction={onAction}
                isOwner={true}
              />
            ))}

          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RecentlyViewedProps {
  onAction: (action: string, propertyId: string) => void;
  maxItems?: number;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ 
  onAction,
  maxItems = 4 
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getRecentlyViewed(maxItems * 2); // Fetch more to account for filtering
        setProperties(data.properties || data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Failed to fetch recently viewed properties');
        console.error('Error fetching recently viewed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [maxItems]);

  const displayProperties = Array.isArray(properties) ? properties.slice(0, maxItems) : [];


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Recently Viewed</span>
          </div>
          {!loading && properties.length > maxItems && (
            <Button variant="outline" size="sm" onClick={() => onAction('view-all-recent', '')}>
              View All ({properties.length})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: maxItems }, (_, i) => (
              <PropertyCardSkeleton key={`recent-skeleton-${i}`} />
            ))}
          </div>
        ) : displayProperties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recently viewed properties</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={onAction}
                isOwner={false}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Utility hook for handling favorite actions
export const useFavoriteActions = () => {
  const [loading, setLoading] = useState(false);

  const addToFavorites = async (propertyId: string) => {
    try {
      setLoading(true);
      await apiClient.addToFavorites(propertyId);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error?.response?.data?.message || 'Failed to add to favorites' 
      };
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (propertyId: string) => {
    try {
      setLoading(true);
      await apiClient.removeFromFavorites(propertyId);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error?.response?.data?.message || 'Failed to remove from favorites' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    addToFavorites,
    removeFromFavorites,
    loading
  };
};