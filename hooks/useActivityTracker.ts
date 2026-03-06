import { useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type ActivityType = 
  | 'property_view'
  | 'search'
  | 'favorite_add'
  | 'favorite_remove'
  | 'property_inquiry'
  | 'property_share'
  | 'agent_contact';

interface LogActivityParams {
  activityType: ActivityType;
  propertyId?: string;
  agentId?: string;
  searchQuery?: string;
  searchFilters?: any;
  resultsCount?: number;
  city?: string;
  country?: string;
  viewDuration?: number;
  metadata?: Record<string, any>;
}

export function useActivityTracker() {
  const { user } = useAuth();

  const logActivity = useCallback(async (params: LogActivityParams) => {
    try {
      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };

      // Get session ID from localStorage or generate one
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionId', sessionId);
      }

      const activityData = {
        ...params,
        userId: user?.id,
        sessionId,
        deviceInfo,
        referrer: document.referrer,
        source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
      };

      await apiClient.logActivity(activityData);
    } catch (error) {
      // Don't throw errors for analytics - just log them
      console.warn('Failed to log activity:', error);
    }
  }, [user]);

  // Specific tracking methods
  const trackPropertyView = useCallback((propertyId: string, metadata?: any) => {
    logActivity({
      activityType: 'property_view',
      propertyId,
      metadata,
    });
  }, [logActivity]);

  const trackSearch = useCallback((query: string, filters: any, resultsCount: number) => {
    logActivity({
      activityType: 'search',
      searchQuery: query,
      searchFilters: filters,
      resultsCount,
    });
  }, [logActivity]);

  const trackFavoriteAdd = useCallback((propertyId: string) => {
    logActivity({
      activityType: 'favorite_add',
      propertyId,
    });
  }, [logActivity]);

  const trackFavoriteRemove = useCallback((propertyId: string) => {
    logActivity({
      activityType: 'favorite_remove',
      propertyId,
    });
  }, [logActivity]);

  const trackPropertyInquiry = useCallback((propertyId: string, metadata?: any) => {
    logActivity({
      activityType: 'property_inquiry',
      propertyId,
      metadata,
    });
  }, [logActivity]);

  const trackAgentContact = useCallback((agentId: string, propertyId?: string) => {
    logActivity({
      activityType: 'agent_contact',
      agentId,
      propertyId,
    });
  }, [logActivity]);

  const trackPropertyShare = useCallback((propertyId: string, method: string) => {
    logActivity({
      activityType: 'property_share',
      propertyId,
      metadata: { shareMethod: method },
    });
  }, [logActivity]);

  return {
    logActivity,
    trackPropertyView,
    trackSearch,
    trackFavoriteAdd,
    trackFavoriteRemove,
    trackPropertyInquiry,
    trackAgentContact,
    trackPropertyShare,
  };
}

// Hook for tracking view duration
export function useViewDurationTracker(propertyId: string) {
  const { trackPropertyView } = useActivityTracker();

  useEffect(() => {
    const startTime = Date.now();
    
    // Track when user leaves the page
    const handleBeforeUnload = () => {
      const duration = Date.now() - startTime;
      trackPropertyView(propertyId, { viewDuration: duration });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Also track after 30 seconds
    const timer = setTimeout(() => {
      const duration = Date.now() - startTime;
      trackPropertyView(propertyId, { viewDuration: duration });
    }, 30000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(timer);
    };
  }, [propertyId, trackPropertyView]);
}

// Hook for tracking scroll depth
export function useScrollDepthTracker(propertyId: string) {
  const { logActivity } = useActivityTracker();

  useEffect(() => {
    let maxScrollDepth = 0;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollDepth = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      );

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      // Log scroll depth when component unmounts
      if (maxScrollDepth > 0) {
        logActivity({
          activityType: 'property_view',
          propertyId,
          metadata: { scrollDepth: maxScrollDepth },
        });
      }
    };
  }, [propertyId, logActivity]);
}