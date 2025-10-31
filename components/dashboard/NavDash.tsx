"use client";

import { Search, Bell, MessageSquare, Settings, LogOut, User, ChevronDown, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { authService } from "@/lib/auth";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: {
    propertyId?: string;
    inquiryId?: string;
    senderId?: string;
    [key: string]: any;
  };
}

export const NavDash = () => {
  const { user, logout, isLoading } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !authService.isLoggedIn()) {
        console.log('⏭️ [NavDash] Skipping notification fetch - user not logged in');
        return;
      }

      try {
        setLoadingNotifications(true);
        setNotificationError(null);
        
        // Debug: Log token details
        const token = authService.getAccessToken();
        console.log('🔍 [NavDash] Fetching notifications...');
        console.log('🔍 [NavDash] Token exists:', !!token);
        
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 [NavDash] Token payload:', {
              sub: payload.sub,
              sessionId: payload.sessionId,
              role: payload.role,
              exp: new Date(payload.exp * 1000).toISOString(),
            });
            console.log('🔍 [NavDash] Token expired:', authService.isTokenExpired());
          } catch (e) {
            console.error('❌ [NavDash] Failed to decode token:', e);
          }
        }

        const [notificationsData, unreadData] = await Promise.all([
          apiClient.getNotifications({ limit: 10 }),
          apiClient.getUnreadNotificationCount()
        ]);
        
        console.log('✅ [NavDash] Notifications response:', notificationsData);
        console.log('✅ [NavDash] Unread count response:', unreadData);
        
        // Handle different response structures
        const notificationsList = notificationsData?.notifications || notificationsData?.data || notificationsData || [];
        setNotifications(Array.isArray(notificationsList) ? notificationsList : []);
        setUnreadCount(unreadData?.count || 0);
        
      } catch (error: any) {
        console.error('❌ [NavDash] Failed to fetch notifications:', error);
        console.error('❌ [NavDash] Error response:', error.response);
        
        if (error.response?.status === 401) {
          console.log('🔐 [NavDash] Authentication error - user may need to re-login');
          setNotificationError('Authentication failed. Please refresh the page.');
        } else {
          setNotificationError('Failed to load notifications');
        }
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification._id);
    }

    // Navigate based on notification link or metadata
    if (notification.link) {
      router.push(notification.link);
    } else if (notification.metadata) {
      const { propertyId, inquiryId } = notification.metadata;
      
      if (inquiryId) {
        router.push(`/dashboard/message?inquiry=${inquiryId}`);
      } else if (propertyId) {
        router.push(`/dashboard/property/${propertyId}`);
      }
    }
    
    setShowNotifications(false);
  };

  const handleAddProperty = () => {
    router.push("/dashboard/propertyForm");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setShowProfileDropdown(false);
    }
  };

  const handleViewProfile = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/settings?tab=profile');
  };

  const handleViewProperties = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/property');
  };

  const handleViewMessages = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/message');
  };

  const handleViewSettings = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/settings');
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    router.push('/dashboard/notifications');
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get user display info
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || user?.phoneNumber || '';
  const userRole = user?.role || 'user';
  const avatarUrl = user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffdfbf`;

  return (
    <header className="h-16 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-50 supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <SidebarTrigger />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search properties, tenants, or documents..."
            className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Add Property Button - Only show for agents/admins */}
        {(userRole === 'agent' || userRole === 'admin') && (
          <Button 
            onClick={handleAddProperty}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative hover:bg-muted/50 transition-all duration-200",
              showNotifications && "bg-muted/50"
            )}
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-card animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-popover backdrop-blur-lg border border-border rounded-xl shadow-lg p-0 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              {/* Notifications Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Mark all read
                  </Button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm">Loading notifications...</p>
                  </div>
                ) : notificationError ? (
                  <div className="p-8 text-center text-red-500">
                    <p className="text-sm">{notificationError}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={`${notification._id}-${index}`}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-4 border-b border-border/30 last:border-b-0 transition-all duration-200 hover:bg-muted/30 group cursor-pointer",
                        !notification.read && "bg-blue-50/50 hover:bg-blue-50"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          !notification.read ? "bg-blue-500" : "bg-muted-foreground/30"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "font-medium text-sm",
                              !notification.read ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Notifications Footer */}
              <div className="p-3 border-t border-border/30 bg-muted/20">
                <Button
                  variant="ghost"
                  onClick={handleViewAllNotifications}
                  className="w-full text-sm text-muted-foreground hover:text-foreground justify-center"
                >
                  View all notifications
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        {!isLoading && user && (
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 transition-all duration-200 rounded-lg",
                showProfileDropdown && "bg-muted/50"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden border border-border/50">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-foreground">{displayName}</div>
                <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200 hidden sm:block",
                showProfileDropdown && "rotate-180"
              )} />
            </Button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-popover backdrop-blur-lg border border-border rounded-xl shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* Profile Header */}
                <div className="p-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden border border-border/50 relative">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                      {(user.emailVerified || user.phoneVerified) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-popover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{displayName}</div>
                      <div className="text-sm text-muted-foreground truncate">{displayEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Dropdown Items */}
                <div className="space-y-1 p-1">
                  <Button
                    variant="ghost"
                    onClick={handleViewProfile}
                    className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all duration-200"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Profile</span>
                  </Button>

                  {(userRole === 'agent' || userRole === 'admin') && (
                    <Button
                      variant="ghost"
                      onClick={handleViewProperties}
                      className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all duration-200"
                    >
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">My Properties</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleViewMessages}
                    className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all duration-200"
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Messages</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleViewSettings}
                    className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-all duration-200"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Settings</span>
                  </Button>

                  <div className="border-t border-border/30 my-1" />

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};