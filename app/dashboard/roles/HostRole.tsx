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

// ── Minimal Airbnb Booking Status Badge ──────────────────────────────────────

function BookingBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    confirmed:   { label: "Confirmed",   color: "text-[#222222] bg-[#F7F7F7] border-[#DDDDDD]", dot: "bg-emerald-500" },
    pending:     { label: "Pending",     color: "text-[#222222] bg-white border-[#222222]", dot: "bg-[#E51D53]" }, // Airbnb Pink for action needed
    cancelled:   { label: "Cancelled",   color: "text-[#717171] bg-[#F7F7F7] border-transparent", dot: "bg-[#B0B0B0]" },
    checked_out: { label: "Checked Out", color: "text-[#717171] bg-white border-[#DDDDDD]", dot: "bg-[#717171]" },
  };
  const cfg = map[status?.toLowerCase()] ?? map["pending"];
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border", cfg.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Clean Monochrome Earnings Bar ────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function EarningsChart({ data }: { data: { month: number; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end gap-2 h-32 pt-4">
      {data.map((d, i) => {
        const isCurrentMonth = i === data.length - 1;
        return (
          <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-full relative flex justify-center">
              {/* Tooltip on hover */}
              <div className="absolute -top-8 bg-[#222222] text-white text-[11px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {d.amount.toLocaleString()} XAF
              </div>
              <div
                className={cn(
                  "w-full max-w-[32px] rounded-t-sm transition-all duration-700",
                  isCurrentMonth ? "bg-[#222222]" : "bg-[#DDDDDD] group-hover:bg-[#B0B0B0]"
                )}
                style={{ height: `${(d.amount / max) * 100}px`, minHeight: d.amount > 0 ? 4 : 0 }}
              />
            </div>
            <span className={cn("text-[11px] font-semibold", isCurrentMonth ? "text-[#222222]" : "text-[#717171]")}>
              {MONTHS[d.month - 1]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stark Typography Stat Tile ───────────────────────────────────────────────

function StatTile({ label, value, sub, icon: Icon }:
  { label: string; value: string; sub?: string; icon: any }) {
  return (
    <div className="bg-white rounded-[24px] border border-[#DDDDDD] p-6 flex flex-col shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] font-semibold text-[#717171]">{label}</span>
        <Icon className="h-5 w-5 text-[#222222]" />
      </div>
      <div className="mt-auto">
        <p className="text-[32px] sm:text-[36px] font-bold text-[#222222] leading-none tracking-tight">
          {value}
        </p>
        {sub && <p className="text-[12px] font-medium text-[#717171] mt-2">{sub}</p>}
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
    <div className="grid grid-cols-1 gap-8 lg:gap-10 font-sans pb-12">

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Create listing", icon: Plus,          path: "/dashboard/propertyForm" },
          { label: "Reservations",   icon: CalendarDays,  path: "/dashboard/bookings" },
          { label: "Messages",       icon: MessageSquare, path: "/dashboard/messages" },
          { label: "Earnings",       icon: Wallet,        path: "/dashboard/wallet" },
        ].map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => router.push(path)}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-[#DDDDDD] rounded-[20px] hover:border-[#222222] hover:bg-[#F7F7F7] transition-all duration-200 active:scale-[0.98]"
          >
            <Icon className="w-7 h-7 text-[#222222]" strokeWidth={1.5} />
            <span className="text-[14px] font-semibold text-[#222222]">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      {loadingStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 bg-[#F7F7F7] animate-pulse rounded-[24px]" />
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
            sub={hostStats?.isSuperhost ? "Superhost status active" : undefined}
            icon={BadgeCheck}
          />
        </div>
      )}

      {/* ── Main Two-Column Layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

        {/* LEFT: Properties + Earnings */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Properties Panel */}
          <div className="bg-white rounded-[24px] border border-[#DDDDDD] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[22px] font-semibold tracking-tight text-[#222222]">
                Your listings
              </h2>
              <div className="flex gap-3">
                <Button variant="outline" className="border-[#222222] text-[#222222] hover:bg-[#F7F7F7] font-semibold rounded-xl h-11 px-5" onClick={() => router.push('/dashboard/property')}>
                  Show all
                </Button>
              </div>
            </div>

            {loadingProperties ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-56 bg-[#F7F7F7] animate-pulse rounded-xl" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[#DDDDDD] rounded-xl bg-[#F7F7F7]/50">
                <Home className="w-12 h-12 mx-auto mb-4 text-[#B0B0B0]" strokeWidth={1} />
                <h3 className="text-[18px] font-semibold text-[#222222] mb-2">No listings yet</h3>
                <p className="text-[15px] text-[#717171] mb-6 max-w-sm mx-auto">It’s easy to start hosting and earn extra income. Create your first listing today.</p>
                <Button onClick={() => router.push('/dashboard/propertyForm')} className="bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded-xl h-12 px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Create listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          <div className="bg-white rounded-[24px] border border-[#DDDDDD] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[22px] font-semibold tracking-tight text-[#222222]">Earnings summary</h2>
              <button 
                onClick={() => router.push('/dashboard/wallet')}
                className="text-[14px] font-semibold underline text-[#222222] hover:text-[#717171] transition-colors"
              >
                Withdraw funds
              </button>
            </div>
            
            {/* Earnings Chart */}
            <div className="pt-6 border-t border-[#EBEBEB] mt-6">
              {earningsData.length > 0 ? (
                <EarningsChart data={earningsData} />
              ) : (
                <div className="h-32 flex items-center justify-center text-[15px] font-medium text-[#717171]">
                  No earnings data in the past 6 months
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Bookings */}
        <div className="flex flex-col gap-8">
          
          {/* Recent Bookings Panel */}
          <div className="bg-white rounded-[24px] border border-[#DDDDDD] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[22px] font-semibold tracking-tight text-[#222222]">Recent bookings</h2>
              <button 
                onClick={() => router.push('/dashboard/bookings')}
                className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-[#222222]" />
              </button>
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 text-[#B0B0B0]" strokeWidth={1} />
                <p className="text-[15px] font-medium text-[#717171]">You don't have any recent bookings.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recentBookings.map((b, i) => (
                  <div key={b._id || i} className="flex items-start gap-4 pb-6 border-b border-[#EBEBEB] last:border-0 last:pb-0">
                    <div className="w-12 h-12 rounded-full bg-[#222222] flex items-center justify-center shrink-0 text-[16px] font-bold text-white">
                      {(b.guest?.name ?? b.guestName ?? "G")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[16px] font-semibold text-[#222222] truncate pr-2">
                          {b.guest?.name ?? b.guestName ?? "Guest"}
                        </p>
                        <span className="text-[15px] font-semibold text-[#222222] shrink-0">
                          {(b.totalPrice ?? 0).toLocaleString()} XAF
                        </span>
                      </div>
                      <p className="text-[14px] text-[#717171] truncate mb-2">
                        {b.property?.title ?? b.propertyTitle ?? "Property"}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-[#717171]">
                          {b.checkIn ? new Date(b.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""} -{" "}
                          {b.checkOut ? new Date(b.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""}
                        </p>
                        <BookingBadge status={b.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Requests Widget */}
          {/* Note: Ensure this child component is also updated with Airbnb styles if you have access to it */}
          <BookingSummaryWidget role="host" title="Pending requests" limit={3} />
          
        </div>
      </div>
    </div>
  );
}