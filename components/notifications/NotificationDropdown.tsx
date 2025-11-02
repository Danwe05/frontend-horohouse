// components/NotificationDropdown.tsx - UPDATED VERSION
'use client';

import React from 'react';
import { Bell, Check, Trash2, Mail, Heart, Home, MessageCircle, AlertCircle, X, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';

function formatDistanceToNow(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 604800)} weeks ago`;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return <MessageCircle className="h-4 w-4" />;
      case 'favorite':
        return <Heart className="h-4 w-4" />;
      case 'property_update':
        return <Home className="h-4 w-4" />;
      case 'message':
        return <Mail className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'bg-blue-100 text-blue-600';
      case 'favorite':
        return 'bg-red-100 text-red-600';
      case 'property_update':
        return 'bg-green-100 text-green-600';
      case 'message':
        return 'bg-purple-100 text-purple-600';
      case 'system':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate to link if available
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        aria-label={`${unreadCount} notifications`}
      >
        <Bell className="h-4 w-4 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Connection status indicator */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Real-time updates active' : 'Offline mode'}
        />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  {isConnected ? (
                    <span title="Connected">
                      <Wifi className="h-4 w-4 text-green-600" />
                    </span>
                  ) : (
                    <span title="Disconnected">
                      <WifiOff className="h-4 w-4 text-gray-400" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={loadNotifications}
                    disabled={isLoading}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg p-1 transition-colors disabled:opacity-50"
                    title="Refresh notifications"
                  >
                    <div className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6h6M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                      </svg>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg p-1 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {unreadCount} unread
                  </span>
                  <button
                    onClick={markAllAsRead}
                    className="h-7 px-3 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="h-[400px] overflow-y-auto">
              {error && (
                <div className="flex flex-col items-center justify-center h-full text-red-500 p-4">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm text-center">{error}</p>
                  <button
                    onClick={loadNotifications}
                    className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
              {isLoading && !error && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-sm">Loading notifications...</p>
                </div>
              )}
              {!isLoading && !error && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bell className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isConnected ? 'You\'ll see new ones here' : 'Check connection'}
                  </p>
                </div>
              )}
              {!isLoading && !error && notifications.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <div
                      key={`${notification._id}-${index}`}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(
                            notification.type
                          )}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(notification.createdAt)}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={deleteAllRead}
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Clear read notifications
                </button>
                <span className="text-xs text-gray-400">
                  {notifications.length} total
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}