import { useState, useEffect, useCallback } from 'react';
import { RecentlyViewedProperty } from '@/types/recentlyViewed';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const MAX_RECENT_PROPERTIES = 8;
const STORAGE_KEY = 'recentlyViewedProperties';

export function useRecentlyViewedProperties(limit = 8) {
  const [recentProperties, setRecentProperties] = useState<RecentlyViewedProperty[]>([]);
  const { isAuthenticated, isLoading } = useAuth();

  const loadFromLocal = useCallback(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedProperty[];
        setRecentProperties(parsed.slice(0, limit));
        console.debug(`[useRecentlyViewedProperties] loaded ${Math.min(parsed.length, limit)} items from localStorage`);
      }
    } catch (e) {
      console.error('Failed to read recently viewed from localStorage', e);
    }
  }, [limit]);

  const loadFromApi = useCallback(async () => {
    try {
      const data = await apiClient.getRecentlyViewed(limit);
      // Expecting data to be an array like [{ property, viewedAt }, ...]
      const mapped: RecentlyViewedProperty[] = (data || []).slice(0, limit).map((item: any) => {
        const prop = item.property || item;
        return {
          id: prop._id || prop.id,
          title: prop.title || prop.name || 'Property',
          price: prop.price || (prop.pricing && prop.pricing.price) || 0,
          location: prop.address || `${prop.city || ''}`,
          imageUrl: (prop.images && prop.images[0] && prop.images[0].url) || prop.imageUrl || '/placeholder.jpg',
          bedrooms: prop.amenities?.bedrooms || prop.bedrooms || undefined,
          bathrooms: prop.amenities?.bathrooms || prop.bathrooms || undefined,
          squareMeters: prop.area || prop.squareMeters || undefined,
          viewedAt: item.viewedAt ? new Date(item.viewedAt) : new Date(),
        } as RecentlyViewedProperty;
      });

      setRecentProperties(mapped.slice(0, limit));
      console.debug(`[useRecentlyViewedProperties] loaded ${mapped.length} items from API`);
    } catch (error) {
      console.error('Failed to load recently viewed from API', error);
      // Fallback to local
      loadFromLocal();
    }
  }, [limit, loadFromLocal]);

  useEffect(() => {
    // Wait for auth initialization
    if (isLoading) return;

    if (isAuthenticated) {
      loadFromApi();
    } else {
      loadFromLocal();
    }
  }, [isAuthenticated, isLoading, loadFromApi, loadFromLocal]);

  const addRecentProperty = useCallback((property: Omit<RecentlyViewedProperty, 'viewedAt'>) => {
    if (isAuthenticated) {
      // For authenticated users the backend updates recently viewed when property details are fetched.
      // To refresh local copy, fetch from API.
      loadFromApi().catch((e) => console.warn('Failed to refresh recently viewed after add:', e));
      return;
    }

    // For anonymous users store in localStorage
    try {
      setRecentProperties((current) => {
        const filtered = current.filter((p) => p.id !== property.id);
        const newItem: RecentlyViewedProperty = { ...property, viewedAt: new Date() } as RecentlyViewedProperty;
        const updated = [newItem, ...filtered].slice(0, MAX_RECENT_PROPERTIES);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    } catch (e) {
      console.error('Failed to add recent property to localStorage', e);
    }
  }, [isAuthenticated, loadFromApi]);

  const clearRecentProperties = useCallback(async () => {
    if (isAuthenticated) {
      try {
        // No direct API to clear short list except viewed-properties delete (which clears full viewing history)
        await apiClient.clearViewingHistory();
        setRecentProperties([]);
      } catch (e) {
        console.error('Failed to clear viewing history via API', e);
      }
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setRecentProperties([]);
  }, [isAuthenticated]);

  return {
    recentProperties,
    addRecentProperty,
    clearRecentProperties,
  };
}