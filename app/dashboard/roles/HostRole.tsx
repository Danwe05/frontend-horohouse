"use client";

import React, { useEffect, useState } from "react";
import {
  Home,
  Plus,
  MessageSquare,
  Wallet,
  CalendarDays,
  TrendingUp,
  Star,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  BadgeCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { BookingSummaryWidget } from "@/components/dashboard/BookingSummaryWidget";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────

type Property = any;
type Booking = any;

interface HostStats {
  totalListings: number;
  completedStays: number;
  currentMonthEarnings: number;
  avgRating: number;
  occupancyRate: number;
  isSuperhost?: boolean;
}

interface Props {
  properties: Property[];
  loadingProperties: boolean;
  sortBy: string;
  setSortBy: (s: string) => void;
  handlePropertyUpdate: () => void;
  router: any;
}

// ── Minimal Premium Booking Status Badge ─────────────────────────────────────

function BookingBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    confirmed:   { label: "Confirmed",   color: "text-zinc-700 bg-zinc-50 ring-zinc-200", dot: "bg-emerald-500" },
    pending:     { label: "Pending",     color: "text-blue-700 bg-blue-50/50 ring-blue-200/50", dot: "bg-blue-500" }, 
    cancelled:   { label: "Cancelled",   color: "text-zinc-500 bg-zinc-50 ring-transparent", dot: "bg-zinc-400" },
    checked_out: { label: "Checked Out", color: "text-zinc-500 bg-white ring-zinc-200", dot: "bg-zinc-400" },
  };
  const cfg = map[status?.toLowerCase()] ?? map["pending"];
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset shadow-sm", cfg.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Clean Earnings Bar ───────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function EarningsChart({ data }: { data: { month: number; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end gap-3 h-40 pt-6">
      {data.map((d, i) => {
        const isCurrentMonth = i === data.length - 1;
        return (
          <div key={i} className="flex flex-col items-center gap-3 flex-1 group relative">
            <div className="w-full relative flex justify-center">
              {/* Tooltip on hover */}
              <div className="absolute -top-12 bg-zinc-900 text-white text-xs font-medium px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1 whitespace-nowrap pointer-events-none shadow-xl z-10">
                {d.amount.toLocaleString()} XAF
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
              </div>
              <div
                className={cn(
                  "w-full max-w-[36px] rounded-t-full transition-all duration-700 ease-out",
                  isCurrentMonth 
                    ? "bg-gradient-to-t from-blue-600 to-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                    : "bg-zinc-100 group-hover:bg-blue-100"
                )}
                style={{ height: `${(d.amount / max) * 120}px`, minHeight: d.amount > 0 ? 6 : 0 }}
              />
            </div>
            <span className={cn("text-xs font-semibold tracking-wide uppercase", isCurrentMonth ? "text-blue-600" : "text-zinc-400")}>
              {MONTHS[d.month - 1]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Typography Stat Tile ─────────────────────────────────────────────────────

function StatTile({ label, value, sub, icon: Icon }:
  { label: string; value: string; sub?: string; icon: any }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 cursor-default group">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-zinc-500">{label}</span>
        <div className="p-2.5 rounded-xl bg-zinc-50 group-hover:bg-blue-50 transition-colors duration-300">
          <Icon className="h-5 w-5 text-zinc-700 group-hover:text-blue-600 transition-colors duration-300" strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight">
          {value}
        </p>
        {sub && <p className="text-xs font-medium text-zinc-400 mt-2">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function HostRole({
  properties,
  loadingProperties,
  handlePropertyUpdate,
  router,
}: Props) {
  const { user } = useAuth();
  const [hostStats, setHostStats] = useState<HostStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [earningsData, setEarningsData] = useState<{ month: number; amount: number }[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingStats(true);
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          apiClient.getHostStats(user?.id ?? ""),
          apiClient.getHostingBookings({ limit: 5 }),
        ]);
        setHostStats(statsRes);

        const rawBookings = Array.isArray(bookingsRes) ? bookingsRes : bookingsRes?.bookings ?? [];
        setRecentBookings(rawBookings.slice(0, 5));

        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          return { month: d.getMonth() + 1, year: d.getFullYear(), amount: 0 };
        }).reverse();

        rawBookings.forEach((b: Booking) => {
          if (b.status !== "confirmed" && b.status !== "checked_out") return;
          const d = new Date(b.checkIn ?? b.createdAt);
          const m = months.find(x => x.month === d.getMonth() + 1 && x.year === d.getFullYear());
          if (m) m.amount += b.totalPrice ?? 0;
        });

        setEarningsData(months);
      } catch (e) {
        console.error("Failed to load host stats", e);
      } finally {
        setLoadingStats(false);
      }
    };
    load();
  }, [user?.id]);

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
        ? `${(n / 1000).toFixed(0)}K`
        : `${n}`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:gap-10 font-sans antialiased pb-12 max-w-[1600px] mx-auto">

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Create listing", icon: Plus,         path: "/dashboard/propertyForm" },
          { label: "Reservations",   icon: CalendarDays, path: "/dashboard/bookings" },
          { label: "Messages",       icon: MessageSquare,path: "/dashboard/messages" },
          { label: "Earnings",       icon: Wallet,       path: "/dashboard/wallet" },
        ].map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => router.push(path)}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-zinc-100 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="bg-zinc-50 p-3 rounded-full group-hover:bg-blue-50 transition-colors duration-300">
              <Icon className="w-6 h-6 text-zinc-700 group-hover:text-blue-600 transition-colors duration-300" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      {loadingStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[152px] bg-zinc-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatTile
            label="Active listings"
            value={String(hostStats?.totalListings ?? properties.length)}
            icon={Home}
          />
          <StatTile
            label="Completed stays"
            value={String(hostStats?.completedStays ?? 0)}
            icon={Users}
          />
          <StatTile
            label="Month earnings"
            value={`${fmt(hostStats?.currentMonthEarnings ?? 0)}`}
            sub="XAF"
            icon={TrendingUp}
          />
          <StatTile
            label="Overall rating"
            value={hostStats?.avgRating ? hostStats.avgRating.toFixed(1) : "—"}
            sub={hostStats?.avgRating ? "Based on reviews" : "No reviews yet"}
            icon={Star}
          />
          <StatTile
            label="Occupancy rate"
            value={hostStats?.occupancyRate !== undefined ? `${Math.round(hostStats.occupancyRate)}%` : "—"}
            sub={hostStats?.isSuperhost ? "Superhost active" : undefined}
            icon={BadgeCheck}
          />
        </div>
      )}

      {/* ── Main Two-Column Layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

        {/* LEFT: Properties + Earnings */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Properties Panel */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                Your listings
              </h2>
              <Button 
                variant="ghost" 
                className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium rounded-xl h-10 px-4 transition-colors group" 
                onClick={() => router.push('/dashboard/property')}
              >
                View all <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
              </Button>
            </div>

            {loadingProperties ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 bg-zinc-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 relative z-10">
                <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-5">
                  <Home className="w-8 h-8 text-zinc-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">No listings yet</h3>
                <p className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed">It’s easy to start hosting and earn extra income. Create your first listing today.</p>
                <Button onClick={() => router.push('/dashboard/propertyForm')} className="bg-zinc-900 text-white hover:bg-zinc-800 transition-colors font-medium rounded-xl h-12 px-8 shadow-md hover:shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {properties.slice(0, 4).map((property: Property) => {
                  const id = property._id || property.id || "x";
                  const images = property.images || [];
                  const img = images.length > 0
                    ? (typeof images[0] === "string" ? images[0] : (images[0] as any)?.url)
                    : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500";
                  const addr = [property.address, property.city].filter(Boolean).join(", ");
                  const beds = property.amenities?.bedrooms ?? property.bedrooms ?? 0;
                  const baths = property.amenities?.bathrooms ?? property.bathrooms ?? 0;
                  return (
                    <PropertyCard
                      key={id}
                      id={id}
                      image={img}
                      title={property.title || "Untitled"}
                      location={addr || "Location not specified"}
                      price={property.price || 0}
                      beds={beds}
                      baths={baths}
                      sqft={property.area || 0}
                      type={property.type || "rent"}
                      status={property.status || "active"}
                      isFeatured={property.isFeatured || false}
                      isVerified={property.isVerified || false}
                      viewCount={property.viewsCount || 0}
                      favoriteCount={property.favoriteCount || 0}
                      isFavorite={property.isFavorite || false}
                      onUpdate={handlePropertyUpdate}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Earnings Chart Panel */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">Earnings summary</h2>
              <button 
                onClick={() => router.push('/dashboard/wallet')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Withdraw funds
              </button>
            </div>
            
            <div className="pt-8 mt-4">
              {earningsData.length > 0 ? (
                <EarningsChart data={earningsData} />
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-sm font-medium text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <Wallet className="w-8 h-8 text-zinc-300 mb-3" strokeWidth={1.5} />
                  No earnings data in the past 6 months
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Bookings */}
        <div className="flex flex-col gap-8">
          
          {/* Recent Bookings Panel */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">Recent bookings</h2>
              <button 
                onClick={() => router.push('/dashboard/bookings')}
                className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 rounded-full transition-colors group"
              >
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </button>
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <CalendarDays className="w-10 h-10 mx-auto mb-4 text-zinc-300" strokeWidth={1.5} />
                <p className="text-sm font-medium text-zinc-500">No recent bookings found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recentBookings.map((b, i) => (
                  <div key={b._id || i} className="flex items-start gap-4 pb-6 border-b border-zinc-100 last:border-0 last:pb-0 group">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 text-base font-semibold text-zinc-700 shadow-sm border border-zinc-200/50 group-hover:bg-zinc-200 transition-colors">
                      {(b.guest?.name ?? b.guestName ?? "G")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-base font-semibold text-zinc-900 truncate pr-2">
                          {b.guest?.name ?? b.guestName ?? "Guest"}
                        </p>
                        <span className="text-sm font-bold text-zinc-900 shrink-0 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200">
                          {(b.totalPrice ?? 0).toLocaleString()} XAF
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate mb-3">
                        {b.property?.title ?? b.propertyTitle ?? "Property"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs font-medium text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                          {b.checkIn ? new Date(b.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""} -{" "}
                          {b.checkOut ? new Date(b.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""}
                        </div>
                        <BookingBadge status={b.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Requests Widget */}
          <div className="shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden">
            <BookingSummaryWidget role="host" title="Pending requests" limit={3} />
          </div>
          
        </div>
      </div>
    </div>
  );
}