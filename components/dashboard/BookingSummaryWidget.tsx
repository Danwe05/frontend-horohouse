'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronRight, Clock, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { format, parseISO, isValid } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PopulatedProperty {
  _id?: string;
  title?: string;
  images?: Array<{ url?: string } | string>;
  address?: string;
  city?: string;
}

interface PopulatedUser {
  _id?: string;
  name?: string;
  email?: string;
  profilePicture?: string;
}

interface Booking {
  _id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  nights?: number;
  priceBreakdown?: { totalAmount?: number };
  currency?: string;
  propertyId?: PopulatedProperty | string | null;
  guestId?: PopulatedUser | string | null;
  hostId?: PopulatedUser | string | null;
}

// ─── Safe field extractors ────────────────────────────────────────────────────
function getPropertyTitle(p: Booking['propertyId']): string {
  if (!p || typeof p === 'string') return 'Property'
  return (typeof p.title === 'string' ? p.title : null) ?? 'Property'
}

function getPropertyImage(p: Booking['propertyId']): string | null {
  if (!p || typeof p === 'string') return null
  const imgs = p.images
  if (!Array.isArray(imgs) || imgs.length === 0) return null
  const first = imgs[0]
  if (typeof first === 'string') return first
  if (first && typeof first === 'object' && typeof first.url === 'string') return first.url
  return null
}

function getUserName(u: PopulatedUser | string | null | undefined): string {
  if (!u || typeof u === 'string') return 'User'
  return (typeof u.name === 'string' ? u.name : null) ?? 'User'
}

function safeDate(iso: string | undefined | null, fmt: string): string {
  if (!iso) return '—'
  try {
    const d = parseISO(iso)
    return isValid(d) ? format(d, fmt) : '—'
  } catch {
    return '—'
  }
}

// ── Minimal Airbnb Booking Status Badge ──────────────────────────────────────
function BookingBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    confirmed: { label: "Confirmed", color: "text-[#222222] bg-[#F7F7F7] border-[#DDDDDD]", dot: "bg-emerald-500" },
    pending:   { label: "Pending",   color: "text-[#222222] bg-white border-[#222222]", dot: "bg-[#FF385C]" }, // Airbnb Brand Red
    rejected:  { label: "Rejected",  color: "text-[#717171] bg-[#F7F7F7] border-transparent", dot: "bg-[#B0B0B0]" },
    cancelled: { label: "Cancelled", color: "text-[#717171] bg-[#F7F7F7] border-transparent", dot: "bg-[#B0B0B0]" },
    completed: { label: "Completed", color: "text-[#717171] bg-white border-[#DDDDDD]", dot: "bg-[#717171]" },
  };
  const cfg = map[status?.toLowerCase()] ?? map["pending"];
  
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border", cfg.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface BookingSummaryWidgetProps {
  role: 'guest' | 'host' | 'admin';
  limit?: number;
  title?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const BookingSummaryWidget: React.FC<BookingSummaryWidgetProps> = ({
  role,
  limit = 5,
  title,
}) => {
  const router = useRouter()
  const { t } = useLanguage()
  const s = (t as any)?.bookings?.summaryWidget || {}
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetch = async () => {
      setLoading(true)
      const safeLimit = Math.min(limit, 100)
      try {
        let res: any
        if (role === 'admin') {
          res = await apiClient.request({
            method: 'GET',
            url: '/bookings/admin/all',
            params: { limit: safeLimit, page: 1, sortOrder: 'desc' },
          })
        } else if (role === 'host') {
          res = await apiClient.request({
            method: 'GET',
            url: '/bookings/hosting',
            params: { limit: safeLimit, page: 1, sortOrder: 'desc' },
          })
        } else {
          res = await apiClient.request({
            method: 'GET',
            url: '/bookings/my',
            params: { limit: safeLimit, page: 1, sortOrder: 'desc' },
          })
        }

        if (!mounted) return

        const raw: any[] = res?.bookings ?? res?.data ?? []

        const safe: Booking[] = raw
          .filter((b) => b && typeof b === 'object' && typeof b._id === 'string')
          .map((b) => ({
            _id: b._id,
            status: typeof b.status === 'string' ? b.status : 'unknown',
            checkIn: typeof b.checkIn === 'string' ? b.checkIn : '',
            checkOut: typeof b.checkOut === 'string' ? b.checkOut : '',
            createdAt: typeof b.createdAt === 'string' ? b.createdAt : '',
            nights: typeof b.nights === 'number' ? b.nights : undefined,
            priceBreakdown: b.priceBreakdown ?? undefined,
            currency: typeof b.currency === 'string' ? b.currency : 'XAF',
            propertyId: b.propertyId && typeof b.propertyId === 'object' ? b.propertyId : null,
            guestId: b.guestId && typeof b.guestId === 'object' ? b.guestId : null,
            hostId: b.hostId && typeof b.hostId === 'object' ? b.hostId : null,
          }))

        setBookings(safe)
      } catch (err) {
        console.error('BookingSummaryWidget fetch error:', err)
        if (mounted) setBookings([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [role, limit])

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-[24px] border border-[#DDDDDD] p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#222222]">
            {title || s.recentBookings || 'Pending requests'}
          </h2>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-12 w-12 bg-[#F7F7F7] rounded-xl shrink-0" />
              <div className="space-y-3 w-full py-1">
                <div className="h-4 bg-[#F7F7F7] rounded-md w-1/3" />
                <div className="h-3 bg-[#F7F7F7] rounded-md w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-[24px] border border-[#DDDDDD] p-6 md:p-8 shadow-sm h-full flex flex-col font-sans antialiased">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#222222]">
          {title || s.recentBookings || 'Pending requests'}
        </h2>
        <button 
          onClick={() => router.push('/dashboard/bookings')}
          className="text-[14px] font-medium underline text-[#222222] hover:text-[#717171] transition-colors"
        >
          {s.viewAll || 'View all'}
        </button>
      </div>

      <div className="flex-1">
        {bookings.length === 0 ? (
          <div className="text-center py-10">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-[#B0B0B0]" strokeWidth={1} />
            <p className="text-[15px] font-medium text-[#717171]">
              {s.noRecentBookings || 'No recent bookings found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const propertyTitle = getPropertyTitle(booking.propertyId)
              const propertyImage = getPropertyImage(booking.propertyId)
              const personName = role === 'host'
                ? getUserName(booking.guestId)
                : getUserName(booking.hostId)
              
              const checkInStr = safeDate(booking.checkIn, 'MMM d')
              const checkOutStr = safeDate(booking.checkOut, 'MMM d')

              return (
                <div
                  key={booking._id}
                  className="group flex items-start gap-4 pb-6 border-b border-[#EBEBEB] last:border-0 last:pb-0 cursor-pointer"
                  onClick={() => router.push('/dashboard/bookings')}
                >
                  {/* Property thumbnail */}
                  <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-[#F7F7F7]">
                    {propertyImage ? (
                      <img
                        src={propertyImage}
                        alt={propertyTitle}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-[#B0B0B0]" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[16px] font-medium text-[#222222] truncate pr-2 group-hover:underline decoration-1 underline-offset-2">
                        {propertyTitle}
                      </p>
                    </div>
                    <p className="text-[14px] text-[#717171] truncate mb-2">
                      Hosted by {personName}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-medium text-[#717171]">
                        {checkInStr} - {checkOutStr}
                      </p>
                      <BookingBadge status={booking.status} />
                    </div>
                  </div>

                  {/* Chevron on Hover */}
                  <div className="pt-3 pr-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                     <ChevronRight className="h-5 w-5 text-[#222222]" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {bookings.length > 0 && (
        <div className="pt-6 border-t border-[#EBEBEB] mt-6">
          <p className="text-[13px] text-[#717171] flex items-center gap-1.5 font-medium">
            <Clock className="h-4 w-4" strokeWidth={1.5} />
            {s.lastBooking || 'Last updated'} {safeDate(bookings[0].createdAt, 'MMM d, h:mm a')}
          </p>
        </div>
      )}
    </div>
  )
}