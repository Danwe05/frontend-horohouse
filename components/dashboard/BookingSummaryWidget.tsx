'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { format, parseISO, isValid } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────
// Defined locally so we don't depend on @/types/booking import shapes
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
  // Populated fields — may be string (unpopulated ID) or object
  propertyId?: PopulatedProperty | string | null;
  guestId?: PopulatedUser | string | null;
  hostId?: PopulatedUser | string | null;
}

// ─── Safe field extractors ────────────────────────────────────────────────────
// Populated fields from Mongoose can be either an ObjectId string OR a full object.
// These helpers always return a safe primitive.

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

// ─── Status badge colours ─────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
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
      // NestJS BookingQueryDto has @Max(100) on limit
      const safeLimit = Math.min(limit, 100)
      try {
        // Use apiClient.request() directly so numeric params aren't coerced
        // to strings by the wrapper methods (avoids NestJS DTO 400 errors)
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

        // Response shape: { bookings: Booking[], total, page, totalPages }
        const raw: any[] = res?.bookings ?? res?.data ?? []

        // Sanitise each booking so no raw objects leak into render
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
            // Keep populated objects but only if they are actually objects
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
      <Card className="-none border h-full">
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            {title || s.recentBookings || 'Recent Bookings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-10 w-10 bg-slate-100 rounded-full shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <Card className="border-0 -lg h-full flex flex-col">
      <CardHeader className="pb-3 px-6 pt-6 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          {title || s.recentBookings || 'Recent Bookings'}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => router.push('/dashboard/bookings')}
        >
          {s.viewAll || 'View All'}
        </Button>
      </CardHeader>

      <CardContent className="px-6 pb-2 flex-1">
        <div className="space-y-1">
          {bookings.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">{s.noRecentBookings || 'No recent bookings found.'}</p>
            </div>
          ) : (
            bookings.map((booking) => {
              const propertyTitle = getPropertyTitle(booking.propertyId)
              const propertyImage = getPropertyImage(booking.propertyId)
              const personName = role === 'host'
                ? getUserName(booking.guestId)
                : getUserName(booking.hostId)
              const statusColor = STATUS_COLORS[booking.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
              const checkInStr = safeDate(booking.checkIn, 'MMM d')
              const checkOutStr = safeDate(booking.checkOut, 'MMM d')

              return (
                <div
                  key={booking._id}
                  className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50
                    transition-all cursor-pointer border border-transparent hover:border-slate-100"
                  onClick={() => router.push('/dashboard/bookings')}
                >
                  {/* Property thumbnail */}
                  <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-100">
                    {propertyImage ? (
                      <img
                        src={propertyImage}
                        alt={propertyTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 truncate
                        group-hover:text-blue-600 transition-colors">
                        {propertyTitle}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-2 font-semibold shrink-0 ${statusColor}`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {checkInStr} – {checkOutStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {personName}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 opacity-0
                    group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              )
            })
          )}
        </div>
      </CardContent>

      {bookings.length > 0 && (
        <CardFooter className="px-6 py-4 border-t bg-slate-50/50 rounded-b-lg mt-auto">
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5" />
            {s.lastBooking || 'Last booking'} {safeDate(bookings[0].createdAt, 'MMM d, h:mm a')}
          </p>
        </CardFooter>
      )}
    </Card>
  )
}