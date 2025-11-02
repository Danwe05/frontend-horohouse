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

export function useNotifications(): UseNotificationsReturn {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if initial load is complete
  const hasLoadedInitial = useRef(false);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
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
      console.log('✅ Loaded notifications:', uniqueNotifications.length);
    } catch (err: any) {
      console.error('❌ Failed to load notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated]);

  /**
   * Load unread count from API
   */
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiClient.getUnreadNotificationCount();
      setUnreadCount(response.count);
      console.log('✅ Loaded unread count:', response.count);
    } catch (err) {
      console.error('❌ Failed to load unread count:', err);
    }
  }, [isAuthenticated]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log('✅ Marked notification as read:', notificationId);
    } catch (err) {
      console.error('❌ Failed to mark notification as read:', err);
      // Revert optimistic update
      await loadNotifications();
      await loadUnreadCount();
    }
  }, [loadNotifications, loadUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      console.log('✅ Marked all notifications as read');
    } catch (err) {
      console.error('❌ Failed to mark all notifications as read:', err);
      // Revert optimistic update
      await loadNotifications();
      await loadUnreadCount();
    }
  }, [loadNotifications, loadUnreadCount]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      
      await apiClient.deleteNotification(notificationId);
      
      // Optimistic update
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      console.log('✅ Deleted notification:', notificationId);
    } catch (err) {
      console.error('❌ Failed to delete notification:', err);
      // Revert optimistic update
      await loadNotifications();
      await loadUnreadCount();
    }
  }, [notifications, loadNotifications, loadUnreadCount]);

  /**
   * Delete all read notifications
   */
  const deleteAllRead = useCallback(async () => {
    try {
      await apiClient.deleteAllReadNotifications();
      
      // Optimistic update
      setNotifications(prev => prev.filter(n => !n.read));
      
      console.log('✅ Deleted all read notifications');
    } catch (err) {
      console.error('❌ Failed to delete read notifications:', err);
      // Revert optimistic update
      await loadNotifications();
    }
  }, [loadNotifications]);

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
    // If auth is still initializing, do nothing yet. This prevents
    // clearing notifications on page refresh while the auth provider
    // is rehydrating stored tokens/user.
  if (!authIsLoading && !isAuthenticated) {
      // Disconnect socket and clear data when explicitly not authenticated
      socketService.disconnect();
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      hasLoadedInitial.current = false;
      return;
    }

    // Load initial data from API
    if (!hasLoadedInitial.current) {
      loadNotifications();
      loadUnreadCount();
      hasLoadedInitial.current = true;
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
      // Add new notification to the top of the list, but avoid duplicates
      setNotifications(prev => {
        const exists = prev.some(n => n._id === notification._id);
        if (exists) return prev;
        // increment unread count only when new
        setUnreadCount(c => c + 1);
        return [notification, ...prev];
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
    });

    const unsubscribeNotificationRead = socketService.on('notificationRead', (data) => {
      console.log('✓ Notification marked as read via WebSocket:', data.notificationId);
      
      setNotifications(prev =>
        prev.map(n => n._id === data.notificationId ? { ...n, read: true } : n)
      );
    });

    const unsubscribeAllRead = socketService.on('allNotificationsRead', () => {
      console.log('✓ All notifications marked as read via WebSocket');
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    });

    const unsubscribeNotificationDeleted = socketService.on('notificationDeleted', (data) => {
      console.log('🗑️ Notification deleted via WebSocket:', data.notificationId);
      
      setNotifications(prev => prev.filter(n => n._id !== data.notificationId));
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
  }, [isAuthenticated, loadNotifications, loadUnreadCount]);

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