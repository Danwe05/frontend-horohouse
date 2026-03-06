'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Check, Trash2, MessageSquare, Heart,
  RefreshCw, Settings, X, Wifi, WifiOff,
  MoreHorizontal, ArrowRight, ShieldCheck,
  Calendar, Star, DollarSign, CheckCircle2, XCircle
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types/notification';
import { useRouter } from 'next/navigation';

const formatTime = (date: string) => {
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

export default function PremiumNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications
  } = useNotifications();

  // Handle outside clicks and keyboard
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  const typeStyles: any = {
    [NotificationType.INQUIRY]: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    [NotificationType.FAVORITE]: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    [NotificationType.SYSTEM]: { icon: ShieldCheck, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
    [NotificationType.PROPERTY_UPDATE]: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/10' },

    // Bookings
    [NotificationType.BOOKING_REQUEST]: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    [NotificationType.BOOKING_CONFIRMED]: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    [NotificationType.BOOKING_REJECTED]: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    [NotificationType.BOOKING_CANCELLED]: { icon: XCircle, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
    [NotificationType.BOOKING_REMINDER]: { icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    [NotificationType.BOOKING_COMPLETED]: { icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },

    // Reviews
    [NotificationType.REVIEW_REQUEST]: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    [NotificationType.REVIEW_RECEIVED]: { icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    [NotificationType.REVIEW_PUBLISHED]: { icon: Star, color: 'text-blue-600', bg: 'bg-blue-600/10' },

    // Payments
    [NotificationType.PAYMENT_RECEIVED]: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
    [NotificationType.REFUND_PROCESSED]: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' },

    default: { icon: Bell, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  };

  const handleNotificationClick = (n: any) => {
    if (!n.read) markAsRead(n._id);

    if (n.link) {
      router.push(n.link);
    } else if (n.metadata?.bookingId) {
      router.push(`/dashboard/bookings/${n.metadata.bookingId}`);
    } else if (n.metadata?.propertyId) {
      router.push(`/properties/${n.metadata.propertyId}`);
    } else if (n.type.includes('review')) {
      router.push('/dashboard/reviews');
    }

    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Premium Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isOpen
          ? 'bg-zinc-900 text-white ring-4 ring-zinc-900/10'
          : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:shadow-md'
          }`}
      >
        <Bell className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-[15deg]' : 'group-hover:scale-110'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-violet-600 ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-[380px] origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)]">

            {/* Header: Glass Effect */}
            <div className="px-6 py-5 border-b border-zinc-100/80 bg-zinc-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight uppercase">Notifications</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300'}`} />
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                    {isConnected ? 'Real-time' : 'Reconnecting'}
                  </span>
                </div>
              </div>
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 px-3 py-1.5 rounded-full transition-colors"
              >
                Mark all read
              </button>
            </div>

            {/* List Body */}
            <div className="max-h-[440px] overflow-y-auto custom-scrollbar overflow-x-hidden">
              {notifications.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 border border-zinc-100">
                    <Bell className="w-6 h-6 text-zinc-300" />
                  </div>
                  <p className="text-sm font-medium text-zinc-900">Quiet for now</p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">We'll let you know when something important happens.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {notifications.map((n) => {
                    const style = typeStyles[n.type] || typeStyles.default;
                    const Icon = style.icon;
                    return (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`group relative p-5 flex gap-4 transition-all duration-300 hover:bg-zinc-50/80 cursor-pointer ${!n.read ? 'bg-violet-50/30' : ''}`}
                      >
                        {/* Status Line */}
                        {!n.read && <div className="absolute left-0 top-6 bottom-6 w-1 bg-violet-600 rounded-r-full" />}

                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <Icon className={`w-5 h-5 ${style.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`text-[13px] font-bold truncate ${!n.read ? 'text-zinc-900' : 'text-zinc-500'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tabular-nums">
                              {formatTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[13px] text-zinc-500 leading-snug line-clamp-2">
                            {n.message}
                          </p>

                          {/* Inline Action Bar */}
                          <div className="mt-3 flex items-center gap-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <button className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900 hover:text-violet-600 transition-colors">
                              View <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                              className="text-[11px] font-bold text-zinc-400 hover:text-rose-500"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Premium Footer */}
            <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex gap-4">
                <button
                  onClick={loadNotifications}
                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <button className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                See all activity
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}