'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  format, differenceInDays, addDays,
  isBefore, isAfter, startOfDay,
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  Calendar, Users, Zap, ShieldCheck,
  ChevronDown, ChevronUp, Loader2, Lock, Info, BedDouble
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import BookingPaymentModal from './Bookingpaymentmodal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Room, ROOM_TYPE_LABELS } from '@/types/room';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';

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
  bookingWindowDays?: number;
  weeklyDiscountPercent?: number;
  monthlyDiscountPercent?: number;
  propertyType?: string; // used to detect hotel/hostel
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
  bookingWindowDays = 0,
): boolean {
  const today = startOfDay(new Date());

  // Advance notice
  const minDate = addDays(today, advanceNoticeDays);
  if (isBefore(date, minDate)) return true;

  // Booking window limit
  if (bookingWindowDays > 0) {
    const maxAllowedDate = addDays(today, bookingWindowDays);
    if (isAfter(date, maxAllowedDate)) return true;
  }

  return unavailableDates.some(({ from, to }) => {
    const f = startOfDay(new Date(from));
    const t = startOfDay(new Date(to));
    return !isBefore(date, f) && !isAfter(date, t);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingForm({ property }: Props) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { formatMoney } = useCurrency();
  const { t } = useLanguage();
  const s = (t as any)?.bookings?.bookingForm || {};

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState({ adults: 1, children: 0, infants: 0 });
  const [guestOpen, setGuestOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Multi-room support
  const isMultiRoom = ['hotel', 'motel', 'hostel', 'guesthouse'].includes(property.propertyType?.toLowerCase() || '');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [roomAvailabilityLoading, setRoomAvailabilityLoading] = useState(false);
  const [roomUnavailableDates, setRoomUnavailableDates] = useState<Array<{ from: string; to: string }>>([]);

  // Setup multi-room
  useEffect(() => {
    if (isMultiRoom && property._id) {
      apiClient.getRoomsByProperty(property._id).then((res: any) => {
        const roomsData = Array.isArray(res) ? res : (res.rooms || []);
        if (roomsData.length > 0) {
          setRooms(roomsData);
          setSelectedRoomId(roomsData[0]._id);
        }
      }).catch(err => console.error("Failed to load rooms", err));
    }
  }, [isMultiRoom, property._id]);

  const selectedRoom = useMemo(() => rooms.find(r => r._id === selectedRoomId), [rooms, selectedRoomId]);

  // Refresh calendar blocks based on selected room
  // Load initial blocked dates whenever room changes
  useEffect(() => {
    if (!property._id) return;

    const from = format(new Date(), 'yyyy-MM-dd');
    const to = format(addDays(new Date(), property.bookingWindowDays ?? 365), 'yyyy-MM-dd');

    apiClient.getPropertyAvailability(property._id, from, to, selectedRoomId ?? undefined)
      .then(res => {
        if (res.unavailableDates) setRoomUnavailableDates(res.unavailableDates);
        if (res.bookedRanges) {
          // Merge bookedRanges into unavailableDates format
          setRoomUnavailableDates(prev => [
            ...prev,
            ...res.bookedRanges.map((r: any) => ({ from: r.checkIn, to: r.checkOut }))
          ]);
        }
      })
      .catch(() => { });
  }, [property._id, selectedRoomId, property.bookingWindowDays]);

  // Payment modal
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return Math.max(differenceInDays(dateRange.to, dateRange.from), 0);
  }, [dateRange]);

  const pricePerNight = selectedRoom?.price ?? property.price;
  const cleaningFee = selectedRoom?.cleaningFee ?? property.cleaningFee ?? 0;
  const serviceFee = property.serviceFee ?? 0;

  const subtotalBeforeDiscount = pricePerNight * nights;

  // Calculate Discounts
  let discountAmount = 0;
  let discountLabel = '';

  if (nights >= 28 && property.monthlyDiscountPercent) {
    discountAmount = subtotalBeforeDiscount * (property.monthlyDiscountPercent / 100);
    discountLabel = `${property.monthlyDiscountPercent}% ${s.monthlyDiscount || 'Monthly Discount'}`;
  } else if (nights >= 7 && property.weeklyDiscountPercent) {
    discountAmount = subtotalBeforeDiscount * (property.weeklyDiscountPercent / 100);
    discountLabel = `${property.weeklyDiscountPercent}% ${s.weeklyDiscount || 'Weekly Discount'}`;
  }

  const subtotal = subtotalBeforeDiscount - discountAmount;
  const total = subtotal + cleaningFee + serviceFee;
  const currency = property.currency ?? 'XAF';

  const maxGuests = selectedRoom?.maxGuests ?? property.shortTermAmenities?.maxGuests ?? 20;
  const minNights = property.minNights ?? 1;
  const maxNights = property.maxNights ?? 365;
  const totalGuests = guestCount.adults + guestCount.children;

  const validationError = useMemo(() => {
    if (isMultiRoom && rooms.length > 0 && !selectedRoomId) return "Please select a room to continue";
    if (!dateRange?.from || !dateRange?.to) return null;
    if (nights < minNights) return `Minimum stay is ${minNights} night${minNights > 1 ? 's' : ''}`;
    if (nights > maxNights) return `Maximum stay is ${maxNights} nights`;
    if (totalGuests > maxGuests) return `Maximum ${maxGuests} guests allowed for this ${isMultiRoom ? 'room' : 'property'}`;
    return null;
  }, [dateRange, nights, minNights, maxNights, totalGuests, maxGuests, isMultiRoom, selectedRoomId, rooms.length]);

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
        checkIn: format(dateRange.from, 'yyyy-MM-dd'),
        checkOut: format(dateRange.to, 'yyyy-MM-dd'),
        guests: {
          adults: guestCount.adults,
          children: guestCount.children > 0 ? guestCount.children : undefined,
          infants: guestCount.infants > 0 ? guestCount.infants : undefined,
        },
        currency,
        roomId: selectedRoomId,
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
    (date: Date) => isDateBlocked(date, isMultiRoom && selectedRoomId ? roomUnavailableDates : property.unavailableDates, property.advanceNoticeDays, property.bookingWindowDays),
    [isMultiRoom, selectedRoomId, roomUnavailableDates, property.unavailableDates, property.advanceNoticeDays, property.bookingWindowDays],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 -sm space-y-5">

        {/* Price header */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatMoney(pricePerNight)}
            </span>
            <span className="text-slate-400 ml-1 font-medium">/ {s.night || 'night'}</span>
          </div>
          {property.isInstantBookable && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Zap className="h-3 w-3" /> {s.instantBook || 'Instant Book'}
            </span>
          )}
        </div>

        {/* Room Selector (Hotels / Hostels) */}
        {isMultiRoom && rooms.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.selectRoom || 'Select Room'}</label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger className="w-full h-12 rounded-xl border-slate-200">
                  <SelectValue placeholder={s.chooseRoom || 'Choose a room'} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room._id} value={room._id} disabled={!room.isActive}>
                      <div className="flex items-center gap-3 w-full py-1">
                        <BedDouble className="h-4 w-4 text-slate-400" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-slate-900">{room.name} {room.roomNumber && `(#${room.roomNumber})`}</span>
                          <span className="text-xs text-slate-500">{ROOM_TYPE_LABELS[room.roomType]} • Max {room.maxGuests} {s.guests || 'guests'} {room.price ? `• ${formatMoney(room.price)}/${s.night || 'night'}` : ''}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Room Details (Images/Amenities Preview) */}
            {selectedRoom && selectedRoom.images && selectedRoom.images.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.roomPhotos || 'Room Photos'}</p>
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar scroll-smooth">
                  {selectedRoom.images.map((img, i) => (
                    <div key={img.publicId || i} className="relative aspect-[4/3] w-32 flex-shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img
                        src={img.url}
                        alt={`${selectedRoom.name} photo ${i + 1}`}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date picker */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-blue-400 transition-colors">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                {s.checkInCheckOut || 'Check-in → Check-out'}
              </p>
              {dateRange?.from ? (
                <p className="text-sm font-semibold text-slate-900">
                  {format(dateRange.from, 'MMM d')}
                  {dateRange.to ? ` → ${format(dateRange.to, 'MMM d, yyyy')}` : ` → ${s.selectCheckout || 'Select checkout'}`}
                  {nights > 0 && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {nights} {nights !== 1 ? (s.nights || 'nights') : (s.night || 'night')}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {s.selectDates || 'Select dates'}
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
                <Info className="h-3 w-3" /> {s.minimumNights?.replace('{minNights}', minNights.toString()) || `Minimum ${minNights} nights`}
              </p>
            )}
          </PopoverContent>
        </Popover>

        {/* Guest counter */}
        <Popover open={guestOpen} onOpenChange={setGuestOpen}>
          <PopoverTrigger asChild>
            <button className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-blue-400 transition-colors">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{s.guests || 'Guests'}</p>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                {guestCount.adults} {guestCount.adults > 1 ? (s.adults || 'adults') : (s.adult || 'adult')}
                {guestCount.children > 0 && `, ${guestCount.children} ${guestCount.children > 1 ? (s.children || 'children') : (s.child || 'child')}`}
                {guestCount.infants > 0 && `, ${guestCount.infants} ${guestCount.infants > 1 ? (s.infants || 'infants') : (s.infant || 'infant')}`}
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-4" align="start">
            {([
              { key: 'adults', label: s.lblAdults || 'Adults', sub: s.lblAge13 || 'Age 13+', min: 1 },
              { key: 'children', label: s.lblChildren || 'Children', sub: s.lblAge2_12 || 'Ages 2–12', min: 0 },
              { key: 'infants', label: s.lblInfants || 'Infants', sub: s.lblUnder2 || 'Under 2', min: 0 },
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
              <p className="text-xs text-slate-400 pt-1">{s.maxGuestsAllowed?.replace('{maxGuests}', maxGuests.toString()) || `Max ${maxGuests} guests allowed.`}</p>
            )}
          </PopoverContent>
        </Popover>

        {/* Validation error */}
        {validationError && (
          <p className="text-sm text-red-500 flex items-center gap-1.5 p-3 rounded-lg bg-red-50">
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
              <span>{s.priceBreakdown || 'Price breakdown'}</span>
              {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showBreakdown && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>{formatMoney(pricePerNight)} × {nights} {s.nights || 'nights'}</span>
                  <span>{formatMoney(subtotalBeforeDiscount)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>{discountLabel}</span>
                    <span>-{formatMoney(discountAmount)}</span>
                  </div>
                )}
                {cleaningFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{s.cleaningFee || 'Cleaning fee'}</span><span>{formatMoney(cleaningFee)}</span>
                  </div>
                )}
                {serviceFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{s.serviceFee || 'Service fee'}</span><span>{formatMoney(serviceFee)}</span>
                  </div>
                )}
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>{s.total || 'Total'}</span><span>{formatMoney(total)}</span>
            </div>
          </div>
        )}

        {/* Check-in/out times */}
        {(property.shortTermAmenities?.checkInTime || property.shortTermAmenities?.checkOutTime) && (
          <div className="flex gap-4 text-xs text-slate-400">
            {property.shortTermAmenities.checkInTime && <span>{s.checkInAfter || 'Check-in after'} {property.shortTermAmenities.checkInTime}</span>}
            {property.shortTermAmenities.checkOutTime && <span>{s.checkOutBefore || 'Check-out before'} {property.shortTermAmenities.checkOutTime}</span>}
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
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {s.creatingBooking || 'Creating booking…'}</>
              : nights > 0
                ? `${s.book || 'Book'} · ${formatMoney(total)}`
                : (s.selectDatesToBook || 'Select dates to book')
            }
          </Button>
        ) : (
          <Button
            className="w-full h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            onClick={() => router.push('/auth/login')}
          >
            <Lock className="h-4 w-4 mr-2" /> {s.loggedInToBook || 'Log in to Book'}
          </Button>
        )}

        {/* Cancellation note */}
        {property.cancellationPolicy && (
          <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="capitalize">{property.cancellationPolicy.replace(/_/g, ' ')}</span> {s.cancellationPolicy || 'cancellation policy'}
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