import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Property {
  _id: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  location?: {
    address: string;
    city: string;
    state: string;
  };
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: {
    bedrooms?: number;
    bathrooms?: number;
  };
  beds?: number;
  baths?: number;
  area?: number;
  sqft?: number;
  squareFeet?: number;
  images: Array<{ url: string } | string>;
  type: string;
  status: string;
  availability?: string;
  isFeatured: boolean;
  isVerified: boolean;
  viewCount?: number;
  viewsCount?: number;
  views?: number;
  favoriteCount?: number;
  favorites?: number;
  inquiries?: number;
  isFavorite?: boolean;
  isActive?: boolean;
}

const DEFAULT_PROPERTY_LIMIT = 6;

export const useDashboardProperties = (isAgent: boolean, sortBy: string = 'recent') => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let response;
      if (isAgent) {
        response = await apiClient.getMyProperties({ 
          limit: DEFAULT_PROPERTY_LIMIT, 
          sort: sortBy 
        });
      } else {
        response = await apiClient.getRecentProperties(DEFAULT_PROPERTY_LIMIT);
      }

      const propertyData = extractPropertiesArray(response);
      setProperties(propertyData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch properties'));
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAgent, sortBy]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const refetch = useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { 
    properties, 
    loading, 
    error,
    refetch 
  };
};

// Utility function to extract properties array from various API response formats
function extractPropertiesArray(response: any): Property[] {
  if (Array.isArray(response)) {
    return response;
  }
  
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  if (response?.properties && Array.isArray(response.properties)) {
    return response.properties;
  }
  
  return [];
}