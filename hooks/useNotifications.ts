import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '@/lib/socket';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types/notification';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  loadNotifications: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// Storage keys
const STORAGE_KEY_NOTIFICATIONS = 'user_notifications';
const STORAGE_KEY_UNREAD_COUNT = 'user_unread_count';
const STORAGE_KEY_LAST_FETCH = 'user_notifications_last_fetch';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export function useNotifications(): UseNotificationsReturn {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if initial load is complete
  const hasLoadedInitial = useRef(false);
  const hasRestoredFromStorage = useRef(false);
  const isLoadingRef = useRef(false); // Prevent duplicate loads

  /**
   * Save notifications to localStorage
   */
  const saveToStorage = useCallback((notifs: Notification[], count: number) => {
    if (!user?.id) return;
    
    try {
      localStorage.setItem(
        `${STORAGE_KEY_NOTIFICATIONS}_${user.id}`,
        JSON.stringify(notifs)
      );
      localStorage.setItem(
        `${STORAGE_KEY_UNREAD_COUNT}_${user.id}`,
        String(count)
      );
      localStorage.setItem(
        `${STORAGE_KEY_LAST_FETCH}_${user.id}`,
        String(Date.now())
      );
    } catch (err) {
      console.warn('Failed to save notifications to storage:', err);
    }
  }, [user?.id]);

  /**
   * Load notifications from localStorage
   */
  const loadFromStorage = useCallback((): { notifications: Notification[], unreadCount: number, lastFetch: number } | null => {
    if (!user?.id) return null;

    try {
      const storedNotifications = localStorage.getItem(`${STORAGE_KEY_NOTIFICATIONS}_${user.id}`);
      const storedCount = localStorage.getItem(`${STORAGE_KEY_UNREAD_COUNT}_${user.id}`);
      const storedLastFetch = localStorage.getItem(`${STORAGE_KEY_LAST_FETCH}_${user.id}`);

      if (storedNotifications) {
        return {
          notifications: JSON.parse(storedNotifications),
          unreadCount: storedCount ? parseInt(storedCount, 10) : 0,
          lastFetch: storedLastFetch ? parseInt(storedLastFetch, 10) : 0
        };
      }
    } catch (err) {
      console.warn('Failed to load notifications from storage:', err);
    }

    return null;
  }, [user?.id]);

  /**
   * Clear storage for current user
   */
  const clearStorage = useCallback(() => {
    if (!user?.id) return;
    
    try {
      localStorage.removeItem(`${STORAGE_KEY_NOTIFICATIONS}_${user.id}`);
      localStorage.removeItem(`${STORAGE_KEY_UNREAD_COUNT}_${user.id}`);
      localStorage.removeItem(`${STORAGE_KEY_LAST_FETCH}_${user.id}`);
    } catch (err) {
      console.warn('Failed to clear storage:', err);
    }
  }, [user?.id]);

  /**
   * Check if cache is still valid
   */
  const isCacheValid = useCallback((lastFetch: number): boolean => {
    return Date.now() - lastFetch < CACHE_DURATION;
  }, []);

  /**
   * Restore from storage on mount
   */
  useEffect(() => {
    if (!authIsLoading && isAuthenticated && user?.id && !hasRestoredFromStorage.current) {
      console.log('📦 Restoring notifications from storage...');
      const stored = loadFromStorage();
      
      if (stored && stored.notifications.length > 0) {
        console.log('✅ Restored', stored.notifications.length, 'notifications from storage');
        setNotifications(stored.notifications);
        setUnreadCount(stored.unreadCount);
        
        // Check if cache is still valid
        if (isCacheValid(stored.lastFetch)) {
          console.log('✅ Cache is valid, skipping API call');
          hasLoadedInitial.current = true; // Skip initial API load
        }
      }
      
      hasRestoredFromStorage.current = true;
    }
  }, [authIsLoading, isAuthenticated, user?.id, loadFromStorage, isCacheValid]);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setIsLoadingNotifications(true);
      setError(null);
      
      const response = await apiClient.getNotifications({
        limit: 20,
        skip: 0,
      });

      // Deduplicate notifications by _id in case API returns duplicates
      const uniqueMap = new Map<string, typeof response.notifications[0]>();
      for (const n of response.notifications || []) {
        if (n && n._id) uniqueMap.set(n._id, n);
      }
      const uniqueNotifications = Array.from(uniqueMap.values());

      setNotifications(uniqueNotifications);
      
      // Calculate unread count from notifications
      const unread = uniqueNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Save to storage
      saveToStorage(uniqueNotifications, unread);
      
      console.log('✅ Loaded notifications:', uniqueNotifications.length);
    } catch (err: any) {
      console.error('❌ Failed to load notifications:', err);
      
      // If rate limited, use cached data
      if (err.response?.status === 429) {
        console.log('⚠️ Rate limited, using cached data');
        setError('Rate limited. Showing cached notifications.');
      } else {
        setError(err.response?.data?.message || 'Failed to load notifications');
      }
    } finally {
      setIsLoadingNotifications(false);
      isLoadingRef.current = false;
    }
  }, [isAuthenticated, saveToStorage]);

  /**
   * Load unread count from API
   */
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiClient.getUnreadNotificationCount();
      setUnreadCount(response.count);
      
      // Update storage with new count
      saveToStorage(notifications, response.count);
      
      console.log('✅ Loaded unread count:', response.count);
    } catch (err: any) {
      console.error('❌ Failed to load unread count:', err);
      
      // If rate limited, calculate from local data
      if (err.response?.status === 429) {
        const localCount = notifications.filter(n => !n.read).length;
        setUnreadCount(localCount);
        console.log('⚠️ Rate limited, using local count:', localCount);
      }
    }
  }, [isAuthenticated, notifications, saveToStorage]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update first
      const updatedNotifications = notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      );
      const newUnreadCount = Math.max(0, unreadCount - 1);
      
      setNotifications(updatedNotifications);
      setUnreadCount(newUnreadCount);
      
      // Save to storage
      saveToStorage(updatedNotifications, newUnreadCount);
      
      // Then call API
      await apiClient.markNotificationAsRead(notificationId);
      
      console.log('✅ Marked notification as read:', notificationId);
    } catch (err:any) {
      console.error('❌ Failed to mark notification as read:', err);
      // Revert optimistic update only if not rate limited
      if (err.response?.status !== 429) {
        await loadNotifications();
        await loadUnreadCount();
      }
    }
  }, [notifications, unreadCount, saveToStorage, loadNotifications, loadUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Save to storage
      saveToStorage(updatedNotifications, 0);
      
      // Then call API
      await apiClient.markAllNotificationsAsRead();
      
      console.log('✅ Marked all notifications as read');
    } catch (err:any) {
      console.error('❌ Failed to mark all notifications as read:', err);
      // Revert optimistic update only if not rate limited
      if (err.response?.status !== 429) {
        await loadNotifications();
        await loadUnreadCount();
      }
    }
  }, [notifications, saveToStorage, loadNotifications, loadUnreadCount]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      
      // Optimistic update
      const updatedNotifications = notifications.filter(n => n._id !== notificationId);
      let newUnreadCount = unreadCount;
      
      if (notification && !notification.read) {
        newUnreadCount = Math.max(0, unreadCount - 1);
      }
      
      setNotifications(updatedNotifications);
      setUnreadCount(newUnreadCount);
      
      // Save to storage
      saveToStorage(updatedNotifications, newUnreadCount);
      
      // Then call API
      await apiClient.deleteNotification(notificationId);
      
      console.log('✅ Deleted notification:', notificationId);
    } catch (err:any) {
      console.error('❌ Failed to delete notification:', err);
      // Revert optimistic update only if not rate limited
      if (err.response?.status !== 429) {
        await loadNotifications();
        await loadUnreadCount();
      }
    }
  }, [notifications, unreadCount, saveToStorage, loadNotifications, loadUnreadCount]);

  /**
   * Delete all read notifications
   */
  const deleteAllRead = useCallback(async () => {
    try {
      // Optimistic update
      const updatedNotifications = notifications.filter(n => !n.read);
      
      setNotifications(updatedNotifications);
      
      // Save to storage
      saveToStorage(updatedNotifications, unreadCount);
      
      // Then call API
      await apiClient.deleteAllReadNotifications();
      
      console.log('✅ Deleted all read notifications');
    } catch (err:any) {
      console.error('❌ Failed to delete read notifications:', err);
      // Revert optimistic update only if not rate limited
      if (err.response?.status !== 429) {
        await loadNotifications();
      }
    }
  }, [notifications, unreadCount, saveToStorage, loadNotifications]);

  /**
   * Refresh notifications and count
   */
  const refreshNotifications = useCallback(async () => {
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  /**
   * Initialize WebSocket connection and load initial data
   */
  useEffect(() => {
    console.log('🔍 useNotifications effect triggered:', { 
      authIsLoading, 
      isAuthenticated,
      userId: user?.id,
      hasLoadedInitial: hasLoadedInitial.current,
      hasRestoredFromStorage: hasRestoredFromStorage.current,
      notificationCount: notifications.length 
    });

    // Wait for auth to finish loading before doing anything
    if (authIsLoading) {
      console.log('⏳ Auth is still loading, waiting...');
      return;
    }

    // If user is not authenticated after auth has finished loading, clean up
    if (!isAuthenticated) {
      console.log('🚪 User not authenticated, cleaning up...');
      
      // Only clean up if we had previously loaded data
      if (hasLoadedInitial.current) {
        socketService.disconnect();
        setNotifications([]);
        setUnreadCount(0);
        setIsConnected(false);
        clearStorage();
        hasLoadedInitial.current = false;
        hasRestoredFromStorage.current = false;
      }
      return;
    }

    // User is authenticated, load initial data (only once and only if not from cache)
    if (!hasLoadedInitial.current && user?.id) {
      console.log('📥 Loading initial notifications from API...');
      
      // Call the functions directly here
      const loadInitialData = async () => {
        if (isLoadingRef.current) {
          console.log('⚠️ Already loading, skipping...');
          return;
        }

        try {
          isLoadingRef.current = true;
          setIsLoadingNotifications(true);
          setError(null);
          
          const [notificationsResponse, countResponse] = await Promise.all([
            apiClient.getNotifications({ limit: 20, skip: 0 }),
            apiClient.getUnreadNotificationCount()
          ]);

          // Deduplicate notifications
          const uniqueMap = new Map();
          for (const n of notificationsResponse.notifications || []) {
            if (n && n._id) uniqueMap.set(n._id, n);
          }
          const uniqueNotifications = Array.from(uniqueMap.values());

          setNotifications(uniqueNotifications);
          setUnreadCount(countResponse.count);
          
          // Save to storage
          saveToStorage(uniqueNotifications, countResponse.count);
          
          console.log('✅ Initial load complete:', uniqueNotifications.length, 'notifications');
          
          hasLoadedInitial.current = true;
        } catch (err: any) {
          console.error('❌ Failed to load initial data:', err);
          
          if (err.response?.status === 429) {
            setError('Rate limited. Showing cached notifications.');
            console.log('⚠️ Rate limited on initial load, using cached data');
            // Mark as loaded to prevent retry
            hasLoadedInitial.current = true;
          } else {
            setError(err.response?.data?.message || 'Failed to load notifications');
          }
        } finally {
          setIsLoadingNotifications(false);
          isLoadingRef.current = false;
        }
      };

      loadInitialData();
    }

    // Connect to WebSocket
    console.log('🔌 Connecting to WebSocket...');
    const socket = socketService.connect();

    if (!socket) {
      console.warn('⚠️ Failed to initialize socket');
      return;
    }

    // WebSocket event handlers
    const unsubscribeConnected = socketService.on('connected', (data) => {
      console.log('✅ Connected to WebSocket:', data);
      setIsConnected(true);
      setError(null);
    });

    const unsubscribeNotification = socketService.on('notification', (notification) => {
      console.log('📬 New notification via WebSocket:', notification);
      
      setNotifications(prev => {
        const exists = prev.some(n => n._id === notification._id);
        if (exists) return prev;
        
        const updated = [notification, ...prev];
        const newUnreadCount = updated.filter(n => !n.read).length;
        
        // Save to storage
        saveToStorage(updated, newUnreadCount);
        setUnreadCount(newUnreadCount);
        
        return updated;
      });
      
      // Optional: Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png',
        });
      }
    });

    const unsubscribeUnreadCount = socketService.on('unreadCount', (data) => {
      console.log('📊 Unread count updated via WebSocket:', data.count);
      setUnreadCount(data.count);
      saveToStorage(notifications, data.count);
    });

    const unsubscribeNotificationRead = socketService.on('notificationRead', (data) => {
      console.log('✓ Notification marked as read via WebSocket:', data.notificationId);
      
      setNotifications(prev => {
        const updated = prev.map(n => n._id === data.notificationId ? { ...n, read: true } : n);
        const newUnreadCount = updated.filter(n => !n.read).length;
        saveToStorage(updated, newUnreadCount);
        setUnreadCount(newUnreadCount);
        return updated;
      });
    });

    const unsubscribeAllRead = socketService.on('allNotificationsRead', () => {
      console.log('✓ All notifications marked as read via WebSocket');
      
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        saveToStorage(updated, 0);
        return updated;
      });
      setUnreadCount(0);
    });

    const unsubscribeNotificationDeleted = socketService.on('notificationDeleted', (data) => {
      console.log('🗑️ Notification deleted via WebSocket:', data.notificationId);
      
      setNotifications(prev => {
        const updated = prev.filter(n => n._id !== data.notificationId);
        const newUnreadCount = updated.filter(n => !n.read).length;
        saveToStorage(updated, newUnreadCount);
        setUnreadCount(newUnreadCount);
        return updated;
      });
    });

    const unsubscribeError = socketService.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      setError(error.message);
    });

    const unsubscribeDisconnect = socketService.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket subscriptions');
      unsubscribeConnected();
      unsubscribeNotification();
      unsubscribeUnreadCount();
      unsubscribeNotificationRead();
      unsubscribeAllRead();
      unsubscribeNotificationDeleted();
      unsubscribeError();
      unsubscribeDisconnect();
    };
  }, [authIsLoading, isAuthenticated, user?.id, saveToStorage, clearStorage]);

  /**
   * Request browser notification permission
   */
  useEffect(() => {
    if (isAuthenticated && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📢 Notification permission:', permission);
      });
    }
  }, [isAuthenticated]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading: isLoadingNotifications,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refreshNotifications,
  };
}