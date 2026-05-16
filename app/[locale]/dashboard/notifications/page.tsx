'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  Search,
  Trash2,
  Wifi,
  WifiOff,
  Mail,
  Heart,
  Home,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';

import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types/notification';
import { useLanguage } from '@/contexts/LanguageContext';

function formatDistanceToNow(date: string, s: any) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return s?.justNow || 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} ${s?.minutesAgo || 'minutes ago'}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${s?.hoursAgo || 'hours ago'}`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ${s?.daysAgo || 'days ago'}`;
  return `${Math.floor(seconds / 604800)} ${s?.weeksAgo || 'weeks ago'}`;
}

function getNotificationIcon(type: string) {
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
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'inquiry':
      return 'bg-blue-100 text-blue-700';
    case 'favorite':
      return 'bg-rose-100 text-rose-700';
    case 'property_update':
      return 'bg-emerald-100 text-emerald-700';
    case 'message':
      return 'bg-violet-100 text-violet-700';
    case 'system':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [query, setQuery] = useState('');
  const { t } = useLanguage();
  const s = (t as any)?.notifications || {};

  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refreshNotifications,
  } = useNotifications();

  const filtered = useMemo(() => {
    const base = tab === 'unread' ? notifications.filter((n) => !n.read) : notifications;
    const q = query.trim().toLowerCase();
    if (!q) return base;

    return base.filter((n) => {
      const hay = `${n.title} ${n.message}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notifications, query, tab]);

  const handleOpen = async (n: Notification) => {
    if (!n.read) {
      await markAsRead(n._id);
    }

    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 min-h-screen pt-14 px-6 lg:pt-0">
            <div className="mx-auto w-full max-w-6xl py-6 lg:py-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">{s?.notifications || "Notifications"}</h1>
                  <p className="mt-1 text-sm md:text-base text-slate-600">{s?.notificationsDesc || "Stay on top of messages, updates, and activity."}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 -sm">
                    {isConnected ? (
                      <>
                        <Wifi className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">{s?.live || "Live"}</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{s?.offline || "Offline"}</span>
                      </>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">{unreadCount} {s?.unread || "unread"}</span>
                  </div>

                  <Button type="button" variant="outline" onClick={refreshNotifications} disabled={isLoading}>
                    {s?.refresh || "Refresh"}
                  </Button>
                  <Button type="button" onClick={markAllAsRead} disabled={isLoading || unreadCount === 0}>
                    <Check className="h-4 w-4 mr-2" />
                    {s?.markAllRead || "Mark all read"}
                  </Button>
                </div>
              </div>

              <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')} className="w-full mt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <TabsList className="w-full md:w-fit bg-white border border-slate-200 -sm">
                    <TabsTrigger value="all" className="gap-2">
                      {s?.all || "All"}
                      <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700">
                        {notifications.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="gap-2">
                      {s?.unreadTab || "Unread"}
                      <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                        {unreadCount}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <div className="relative w-full md:w-[420px]">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={s?.searchNotifications || "Search notifications..."}
                      className="pl-9 bg-white"
                    />
                  </div>
                </div>

                <TabsContent value="all" className="mt-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base">{s?.inbox || "Inbox"}</CardTitle>
                        <Button type="button" variant="outline" onClick={deleteAllRead} disabled={isLoading || notifications.every((n) => !n.read)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {s?.clearRead || "Clear read"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                          <div className="font-semibold">{s?.couldNotLoad || "Couldn’t load notifications"}</div>
                          <div className="mt-1 text-red-700">{error}</div>
                          <div className="mt-3">
                            <Button type="button" variant="outline" onClick={loadNotifications}>
                              {s?.tryAgain || "Try again"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {!error && isLoading && notifications.length === 0 && (
                        <div className="py-10 text-center text-sm text-slate-600">{s?.loadingNotifications || "Loading notifications…"}</div>
                      )}

                      {!error && !isLoading && filtered.length === 0 && (
                        <div className="py-12 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <Bell className="h-6 w-6" />
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900">{s?.noNotifications || "No notifications"}</div>
                          <div className="mt-1 text-sm text-slate-600">{s?.youAreCaughtUp || "You’re all caught up."}</div>
                        </div>
                      )}

                      {!error && filtered.length > 0 && (
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                          {filtered.map((n) => (
                            <div
                              key={n._id}
                              className={`group flex gap-3 p-4 bg-white hover:bg-slate-50 transition cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''
                                }`}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleOpen(n)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleOpen(n);
                                }
                              }}
                            >
                              <div
                                className={`mt-0.5 h-10 w-10 rounded-full flex items-center justify-center ${getNotificationColor(
                                  String(n.type)
                                )}`}
                              >
                                {getNotificationIcon(String(n.type))}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-semibold text-slate-900 truncate">{n.title}</div>
                                      {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600 line-clamp-2">{n.message}</div>
                                  </div>
                                  <div className="shrink-0 text-xs text-slate-400">{formatDistanceToNow(n.createdAt, s)}</div>
                                </div>

                                {n.link && (
                                  <div className="mt-2 text-xs text-blue-700 font-medium">{s?.viewDetails || "View details"}</div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n._id);
                                }}
                                className="mt-0.5 h-9 w-9 rounded-lg border border-transparent text-slate-400 hover:text-red-600 hover:bg-red-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                aria-label={`Delete notification: ${n.title}`}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 mx-auto" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {!error && hasMore && (
                        <div className="mt-4 flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={loadMoreNotifications}
                            disabled={isLoadingMore || isLoading}
                          >
                            {isLoadingMore ? (s?.loading || 'Loading…') : (s?.loadMore || 'Load more')}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="unread" className="mt-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{s?.unreadTab || "Unread"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!error && !isLoading && filtered.length === 0 && (
                        <div className="py-12 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                            <Check className="h-6 w-6" />
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900">{s?.allRead || "All read"}</div>
                          <div className="mt-1 text-sm text-slate-600">{s?.nothingNew || "Nothing new right now."}</div>
                        </div>
                      )}

                      {!error && filtered.length > 0 && (
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                          {filtered.map((n) => (
                            <button
                              key={n._id}
                              type="button"
                              className="w-full text-left group flex gap-3 p-4 bg-white hover:bg-slate-50 transition"
                              onClick={() => handleOpen(n)}
                            >
                              <div
                                className={`mt-0.5 h-10 w-10 rounded-full flex items-center justify-center ${getNotificationColor(
                                  String(n.type)
                                )}`}
                              >
                                {getNotificationIcon(String(n.type))}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-slate-900 truncate">{n.title}</div>
                                    <div className="mt-1 text-xs text-slate-600 line-clamp-2">{n.message}</div>
                                  </div>
                                  <div className="shrink-0 text-xs text-slate-400">{formatDistanceToNow(n.createdAt, s)}</div>
                                </div>
                                {n.link && (
                                  <div className="mt-2 text-xs text-blue-700 font-medium">{s?.viewDetails || "View details"}</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
