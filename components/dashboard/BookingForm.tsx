'use client';

/**
 * BookingForm — rendered by BookingPanel when property.listingType === 'short_term'
 *
 * Flow:
 *   1. Guest selects dates + guest count
 *   2. Clicks "Book" → createBooking()
 *   3. BookingPaymentModal opens immediately (inline Flutterwave modal)
 *   4. On success → redirect to /dashboard/bookings/[id]
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  format, differenceInDays, addDays,
  isBefore, isAfter, startOfDay,
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  Calendar, Users, Zap, ShieldCheck,
  ChevronDown, ChevronUp, Loader2, Lock, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import BookingPaymentModal from './Bookingpaymentmodal';

// ─── Types (mirror what BookingPanel passes) ──────────────────────────────────

interface Property {
  _id: string;
  price: number;
  currency?: string;
  minNights?: number;
  maxNights?: number;
  cleaningFee?: number;
  serviceFee?: number;
  isInstantBookable?: boolean;
  cancellationPolicy?: string;
  advanceNoticeDays?: number;
  shortTermAmenities?: {
    maxGuests?: number;
    checkInTime?: string;
    checkOutTime?: string;
  };
  // Populated from bookings availability checks
  unavailableDates?: Array<{ from: string; to: string }>;
}

interface Props {
  property: Property;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDateBlocked(
  date: Date,
  unavailableDates: Array<{ from: string; to: string }> = [],
  advanceNoticeDays = 0,
): boolean {
  const minDate = addDays(startOfDay(new Date()), advanceNoticeDays);
  if (isBefore(date, minDate)) return true;
  return unavailableDates.some(({ from, to }) => {
    const f = startOfDay(new Date(from));
    const t = startOfDay(new Date(to));
    return !isBefore(date, f) && !isAfter(date, t);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingForm({ property }: Props) {
  const router                    = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [dateRange, setDateRange]         = useState<DateRange | undefined>();
  const [guestCount, setGuestCount]       = useState({ adults: 1, children: 0, infants: 0 });
  const [guestOpen, setGuestOpen]         = useState(false);
  const [dateOpen, setDateOpen]           = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Payment modal
  const [paymentOpen, setPaymentOpen]       = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return Math.max(differenceInDays(dateRange.to, dateRange.from), 0);
  }, [dateRange]);

  const pricePerNight = property.price;
  const cleaningFee   = property.cleaningFee ?? 0;
  const serviceFee    = property.serviceFee  ?? 0;
  const subtotal      = pricePerNight * nights;
  const total         = subtotal + cleaningFee + serviceFee;
  const currency      = property.currency ?? 'XAF';
  const maxGuests     = property.shortTermAmenities?.maxGuests ?? 20;
  const minNights     = property.minNights ?? 1;
  const maxNights     = property.maxNights ?? 365;
  const totalGuests   = guestCount.adults + guestCount.children;

  const validationError = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return null;
    if (nights < minNights) return `Minimum stay is ${minNights} night${minNights > 1 ? 's' : ''}`;
    if (nights > maxNights) return `Maximum stay is ${maxNights} nights`;
    if (totalGuests > maxGuests) return `Maximum ${maxGuests} guests allowed`;
    return null;
  }, [dateRange, nights, minNights, maxNights, totalGuests, maxGuests]);

  const canBook = isAuthenticated && dateRange?.from && dateRange?.to && nights > 0 && !validationError;

  // ── Guest counter ─────────────────────────────────────────────────────────
  function adjustGuests(key: keyof typeof guestCount, delta: number) {
    setGuestCount(prev => {
      const next = Math.max(0, prev[key] + delta);
      if (key === 'adults' && next < 1) return prev;
      const newTotal = (key === 'adults' ? next : prev.adults) +
                       (key === 'children' ? next : prev.children);
      if (newTotal > maxGuests) return prev;
      return { ...prev, [key]: next };
    });
  }

  // ── Book: createBooking then open payment modal ───────────────────────────
  const handleBook = useCallback(async () => {
    if (!canBook || !dateRange?.from || !dateRange?.to) return;
    if (!isAuthenticated) { toast.error('Please log in to make a booking'); router.push('/auth/login'); return; }

    setSubmitting(true);
    try {
      const booking = await apiClient.createBooking({
        propertyId: property._id,
        checkIn:    format(dateRange.from, 'yyyy-MM-dd'),
        checkOut:   format(dateRange.to,   'yyyy-MM-dd'),
        guests: {
          adults:   guestCount.adults,
          children: guestCount.children > 0 ? guestCount.children : undefined,
          infants:  guestCount.infants  > 0 ? guestCount.infants  : undefined,
        },
        currency,
      });

      setCreatedBooking(booking);
      setPaymentOpen(true);               // ← open payment modal
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      toast.error(typeof raw === 'string' ? raw : 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [canBook, dateRange, guestCount, property._id, currency, isAuthenticated, router]);

  // ── Payment success ───────────────────────────────────────────────────────
  const handlePaymentSuccess = useCallback(() => {
    setPaymentOpen(false);
    toast.success('Booking confirmed!');
    if (createdBooking?._id) router.push(`/dashboard/bookings/${createdBooking._id}`);
  }, [createdBooking, router]);

  // ── Payment modal dismissed without paying ────────────────────────────────
  const handlePaymentClose = useCallback(() => {
    setPaymentOpen(false);
    toast.info('Your booking is saved. Pay anytime from your bookings page.');
    if (createdBooking?._id) router.push(`/dashboard/bookings/${createdBooking._id}`);
  }, [createdBooking, router]);

  const isDisabled = useCallback(
    (date: Date) => isDateBlocked(date, property.unavailableDates, property.advanceNoticeDays),
    [property.unavailableDates, property.advanceNoticeDays],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">

        {/* Price header */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {pricePerNight.toLocaleString()} {currency}
            </span>
            <span className="text-slate-400 ml-1 font-medium">/ night</span>
          </div>
          {property.isInstantBookable && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Zap className="h-3 w-3" /> Instant Book
            </span>
          )}
        </div>

        {/* Date picker */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-blue-400 transition-colors">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Check-in → Check-out
              </p>
              {dateRange?.from ? (
                <p className="text-sm font-semibold text-slate-900">
                  {format(dateRange.from, 'MMM d')}
                  {dateRange.to ? ` → ${format(dateRange.to, 'MMM d, yyyy')}` : ' → Select checkout'}
                  {nights > 0 && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Select dates
                </p>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarUI
              mode="range"
              selected={dateRange}
              onSelect={range => { setDateRange(range); if (range?.from && range?.to) setDateOpen(false); }}
              disabled={isDisabled}
              numberOfMonths={2}
              initialFocus
            />
            {minNights > 1 && (
              <p className="px-4 pb-3 text-xs text-slate-400 flex items-center gap-1">
                <Info className="h-3 w-3" /> Minimum {minNights} nights
              </p>
            )}
          </PopoverContent>
        </Popover>

        {/* Guest counter */}
        <Popover open={guestOpen} onOpenChange={setGuestOpen}>
          <PopoverTrigger asChild>
            <button className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-blue-400 transition-colors">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Guests</p>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                {guestCount.adults} adult{guestCount.adults > 1 ? 's' : ''}
                {guestCount.children > 0 && `, ${guestCount.children} child${guestCount.children > 1 ? 'ren' : ''}`}
                {guestCount.infants  > 0 && `, ${guestCount.infants} infant${guestCount.infants > 1 ? 's' : ''}`}
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-4" align="start">
            {([
              { key: 'adults',   label: 'Adults',   sub: 'Age 13+',   min: 1 },
              { key: 'children', label: 'Children', sub: 'Ages 2–12', min: 0 },
              { key: 'infants',  label: 'Infants',  sub: 'Under 2',   min: 0 },
            ] as const).map(({ key, label, sub, min }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full"
                    onClick={() => adjustGuests(key, -1)} disabled={guestCount[key] <= min}>−</Button>
                  <span className="w-4 text-center text-sm font-bold">{guestCount[key]}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full"
                    onClick={() => adjustGuests(key, 1)}
                    disabled={totalGuests >= maxGuests && key !== 'infants'}>+</Button>
                </div>
              </div>
            ))}
            {maxGuests < 99 && (
              <p className="text-xs text-slate-400 pt-1">Max {maxGuests} guests allowed.</p>
            )}
          </PopoverContent>
        </Popover>

        {/* Validation error */}
        {validationError && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <Info className="h-4 w-4 shrink-0" /> {validationError}
          </p>
        )}

        {/* Price breakdown (expandable) */}
        {nights > 0 && (
          <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
            <button
              className="w-full flex items-center justify-between text-slate-700 font-medium"
              onClick={() => setShowBreakdown(b => !b)}
            >
              <span>Price breakdown</span>
              {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showBreakdown && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>{pricePerNight.toLocaleString()} × {nights} nights</span>
                  <span>{subtotal.toLocaleString()} {currency}</span>
                </div>
                {cleaningFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Cleaning fee</span><span>{cleaningFee.toLocaleString()} {currency}</span>
                  </div>
                )}
                {serviceFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Service fee</span><span>{serviceFee.toLocaleString()} {currency}</span>
                  </div>
                )}
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Total</span><span>{total.toLocaleString()} {currency}</span>
            </div>
          </div>
        )}

        {/* Check-in/out times */}
        {(property.shortTermAmenities?.checkInTime || property.shortTermAmenities?.checkOutTime) && (
          <div className="flex gap-4 text-xs text-slate-400">
            {property.shortTermAmenities.checkInTime  && <span>Check-in after {property.shortTermAmenities.checkInTime}</span>}
            {property.shortTermAmenities.checkOutTime && <span>Check-out before {property.shortTermAmenities.checkOutTime}</span>}
          </div>
        )}

        {/* CTA */}
        {isAuthenticated ? (
          <Button
            className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            disabled={!canBook || submitting}
            onClick={handleBook}
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating booking…</>
              : nights > 0
              ? `Book · ${total.toLocaleString()} ${currency}`
              : 'Select dates to book'
            }
          </Button>
        ) : (
          <Button
            className="w-full h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            onClick={() => router.push('/auth/login')}
          >
            <Lock className="h-4 w-4 mr-2" /> Log in to Book
          </Button>
        )}

        {/* Cancellation note */}
        {property.cancellationPolicy && (
          <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="capitalize">{property.cancellationPolicy.replace(/_/g, ' ')}</span> cancellation policy
          </p>
        )}
      </div>

      {/* Payment modal — opens right after booking is created */}
      {createdBooking && (
        <BookingPaymentModal
          booking={createdBooking}
          open={paymentOpen}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}