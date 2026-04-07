'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell, MessageSquare, Heart,
  RefreshCw, Settings, X,
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
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 14, // slightly more offset for breathing room
      right: window.innerWidth - rect.right,
    });
  }, []);

  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
  } = useNotifications();

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const typeStyles: Record<string, { icon: any }> = {
    [NotificationType.INQUIRY]: { icon: MessageSquare },
    [NotificationType.FAVORITE]: { icon: Heart },
    [NotificationType.SYSTEM]: { icon: ShieldCheck },
    [NotificationType.PROPERTY_UPDATE]: { icon: Bell },
    [NotificationType.BOOKING_REQUEST]: { icon: Calendar },
    [NotificationType.BOOKING_CONFIRMED]: { icon: CheckCircle2 },
    [NotificationType.BOOKING_REJECTED]: { icon: XCircle },
    [NotificationType.BOOKING_CANCELLED]: { icon: XCircle },
    [NotificationType.BOOKING_REMINDER]: { icon: Bell },
    [NotificationType.BOOKING_COMPLETED]: { icon: CheckCircle2 },
    [NotificationType.REVIEW_REQUEST]: { icon: Star },
    [NotificationType.REVIEW_RECEIVED]: { icon: Star },
    [NotificationType.REVIEW_PUBLISHED]: { icon: Star },
    [NotificationType.PAYMENT_RECEIVED]: { icon: DollarSign },
    [NotificationType.REFUND_PROCESSED]: { icon: RefreshCw },
    default: { icon: Bell },
  };

  const handleNotificationClick = (n: any) => {
    if (!n.read) markAsRead(n._id);
    if (n.link) router.push(n.link);
    else if (n.metadata?.bookingId) router.push(`/dashboard/bookings/${n.metadata.bookingId}`);
    else if (n.metadata?.propertyId) router.push(`/properties/${n.metadata.propertyId}`);
    else if (n.type.includes('review')) router.push('/dashboard/reviews');
    setIsOpen(false);
  };

  const panel = (
    <div
      ref={panelRef}
      className="overflow-hidden sm:rounded-2xl border border-[#DDDDDD] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.18)] flex flex-col w-full h-full sm:h-auto"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#DDDDDD] bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-[16px] font-semibold text-[#222222] tracking-tight">Notifications</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-[#008A05]' : 'bg-[#DDDDDD]'}`} />
            <span className="text-[12px] font-medium text-[#717171]">
              {isConnected ? 'Real-time' : 'Reconnecting...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={markAllAsRead}
            className="text-[14px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
          >
            Mark all as read
          </button>
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center p-2 -mr-2 rounded-full hover:bg-[#F7F7F7] transition-colors focus:outline-none"
            >
              <X className="w-5 h-5 text-[#222222]" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        className="overflow-y-auto overflow-x-hidden bg-white custom-scrollbar"
        style={{ maxHeight: isMobile ? 'calc(100dvh - 140px)' : '440px' }}
      >
        {notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-10">
            <Bell className="w-8 h-8 text-[#DDDDDD] mb-4 stroke-[1.5]" />
            <p className="text-[16px] font-semibold text-[#222222]">You're all caught up</p>
            <p className="text-[14px] text-[#717171] mt-2 leading-relaxed">
              We'll let you know when important account activity happens.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#DDDDDD]">
            {notifications.map((n) => {
              const style = typeStyles[n.type] ?? typeStyles.default;
              const Icon = style.icon;
              return (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative px-6 py-5 flex gap-4 transition-colors cursor-pointer ${!n.read ? 'bg-white hover:bg-[#F7F7F7]' : 'bg-white hover:bg-[#F7F7F7] opacity-75 hover:opacity-100'
                    }`}
                >
                  {!n.read && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 blue-blue-600 rounded-full" />
                  )}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F7F7F7] border border-[#DDDDDD] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#222222] stroke-[1.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-[15px] ${!n.read ? 'font-semibold text-[#222222]' : 'font-medium text-[#222222]'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[12px] text-[#717171] whitespace-nowrap pt-0.5">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[14px] text-[#717171] leading-snug line-clamp-2">{n.message}</p>
                    <div className="mt-3 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button className="flex items-center text-[13px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none">
                        View details
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                        className="text-[13px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
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

      {/* Footer */}
      <div className="px-6 py-4 bg-white border-t border-[#DDDDDD] flex items-center justify-between flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={loadNotifications}
            className="p-2 -ml-2 text-[#222222] hover:bg-[#F7F7F7] rounded-full transition-colors focus:outline-none"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 stroke-[1.5] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 text-[#222222] hover:bg-[#F7F7F7] rounded-full transition-colors focus:outline-none" aria-label="Settings">
            <Settings className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>
        <button className="text-[14px] font-semibold text-[#222222] hover:underline transition-colors flex items-center gap-1 focus:outline-none">
          See all activity <MoreHorizontal className="w-4 h-4 ml-1" />
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DDDDDD;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #717171;
        }
      `}</style>
    </div>
  );

  return (
    <>
      {/* Wrap both triggers in a single DIV and attach the triggerRef to it.
        This ensures getBoundingClientRect() calculates properly on large displays
        instead of targeting the hidden mobile button.
      */}
      <div ref={triggerRef} className="relative flex items-center justify-center">

        {/* Desktop Bell Trigger */}
        <button
          onClick={() => {
            updatePosition();
            setIsOpen((prev) => !prev);
          }}
          className={`relative hidden md:flex items-center justify-center w-10 h-10 rounded-full transition-colors focus:outline-none ${isOpen ? 'bg-[#F7F7F7] text-[#222222]' : 'bg-white text-[#222222] hover:bg-[#F7F7F7]'
            }`}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[1.5]" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 block h-2.5 w-2.5 rounded-full blue-blue-600 border-2 border-white" />
          )}
        </button>

        {/* Mobile Bell Trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden flex items-center justify-center p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] relative focus:outline-none"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[2]" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 block h-2.5 w-2.5 rounded-full blue-blue-600 border-2 border-white" />
          )}
        </button>

      </div>

      {/* Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        isMobile ? (
          <>
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-blue-700/50 backdrop-blur-sm z-[9998]"
            />
            <div
              className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-3xl overflow-hidden shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
              style={{ height: '90vh' }}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#DDDDDD] rounded-full z-10" />
              <div className="pt-8 h-full">
                {panel}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            position: 'fixed',
            top: dropdownPos.top,
            right: dropdownPos.right,
            width: 420,
            zIndex: 9999,
          }}>
            {panel}
          </div>
        ),
        document.body
      )}
    </>
  );
}