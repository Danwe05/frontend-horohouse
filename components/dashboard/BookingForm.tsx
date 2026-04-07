'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  format, differenceInDays, addDays,
  isBefore, isAfter, startOfDay,
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  ChevronDown, ChevronUp, Loader2, AlertCircle, ChevronLeft, Star,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import BookingPaymentModal from './Bookingpaymentmodal';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Room } from '@/types/room';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  propertyType?: string;
  rating?: number;
  reviewCount?: number;
  shortTermAmenities?: {
    maxGuests?: number;
    checkInTime?: string;
    checkOutTime?: string;
  };
  unavailableDates?: Array<{ from: string; to: string }>;
  pricingUnit?: 'nightly' | 'weekly' | 'monthly';
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
  const minDate = addDays(today, advanceNoticeDays);
  if (isBefore(date, minDate)) return true;
  if (bookingWindowDays > 0) {
    const maxDate = addDays(today, bookingWindowDays);
    if (isAfter(date, maxDate)) return true;
  }
  return unavailableDates.some(({ from, to }) => {
    const f = startOfDay(new Date(from));
    const t = startOfDay(new Date(to));
    return !isBefore(date, f) && !isAfter(date, t);
  });
}

// ─── CSS grid-rows accordion ──────────────────────────────────────────────────
//
// Animates grid-template-rows: 0fr → 1fr.
// overflow:hidden lives on the INNER div only — the outer grid wrapper has no
// clipping, so rounded borders on the parent container are never affected.
// No JS scrollHeight measurement needed — no stale-height or paint-race bugs.
//
function Accordion({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type MobilePanel = 'date' | 'guests' | null;

export default function BookingForm({ property }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { formatMoney } = useCurrency();
  const { t } = useLanguage();
  const s = (t as any)?.bookings?.bookingForm || {};

  const safeTitle = (val: any, fallback: string) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.title) return val.title;
    return fallback;
  };

  // Single enum for mobile panels — prevents both ever being open simultaneously
  // and avoids the state-race that caused the old dateOpen/guestOpen conflict.
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const toggleMobilePanel = (panel: MobilePanel) =>
    setMobilePanel((prev) => (prev === panel ? null : panel));

  // Desktop popovers are completely separate — they live outside the Dialog
  // so they have no portal/focus-trap conflict.
  const [desktopDateOpen, setDesktopDateOpen] = useState(false);
  const [desktopGuestOpen, setDesktopGuestOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState({ adults: 1, children: 0, infants: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  useEffect(() => {
    if (isMobileModalOpen) setMobilePanel(null);
  }, [isMobileModalOpen]);

  const isMultiRoom = ['hotel', 'motel', 'hostel', 'guesthouse'].includes(
    property.propertyType?.toLowerCase() || '',
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [roomUnavailableDates, setRoomUnavailableDates] = useState<
    Array<{ from: string; to: string }>
  >([]);

  useEffect(() => {
    if (isMultiRoom && property._id) {
      apiClient
        .getRoomsByProperty(property._id)
        .then((res: any) => {
          const roomsData = Array.isArray(res) ? res : res.rooms || [];
          if (roomsData.length > 0) {
            setRooms(roomsData);
            setSelectedRoomId(roomsData[0]._id);
          }
        })
        .catch((err) => console.error('Failed to load rooms', err));
    }
  }, [isMultiRoom, property._id]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r._id === selectedRoomId),
    [rooms, selectedRoomId],
  );

  useEffect(() => {
    if (!property._id) return;
    const from = format(new Date(), 'yyyy-MM-dd');
    const to = format(addDays(new Date(), property.bookingWindowDays ?? 365), 'yyyy-MM-dd');
    apiClient
      .getPropertyAvailability(property._id, from, to, selectedRoomId ?? undefined)
      .then((res) => {
        const dates: Array<{ from: string; to: string }> = [];
        if (res.unavailableDates) dates.push(...res.unavailableDates);
        if (res.bookedRanges)
          dates.push(...res.bookedRanges.map((r: any) => ({ from: r.checkIn, to: r.checkOut })));
        setRoomUnavailableDates(dates);
      })
      .catch(() => {});
  }, [property._id, selectedRoomId, property.bookingWindowDays]);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return Math.max(differenceInDays(dateRange.to, dateRange.from), 0);
  }, [dateRange]);

  const pricingUnit = property.pricingUnit || 'nightly';
  const unitLabel = pricingUnit === 'weekly' ? 'week' : pricingUnit === 'monthly' ? 'month' : 'night';

  const pricePerUnit = selectedRoom?.price ?? property.price;
  const cleaningFee = selectedRoom?.cleaningFee ?? property.cleaningFee ?? 0;
  const serviceFee = property.serviceFee ?? 0;

  let unitCount = nights;
  if (pricingUnit === 'weekly') unitCount = nights / 7;
  if (pricingUnit === 'monthly') unitCount = nights / 30;

  const subtotalBeforeDiscount = pricePerUnit * unitCount;
  let discountAmount = 0;
  let discountLabel = '';
  if (nights >= 28 && property.monthlyDiscountPercent) {
    discountAmount = subtotalBeforeDiscount * (property.monthlyDiscountPercent / 100);
    discountLabel = `${property.monthlyDiscountPercent}% ${safeTitle(s.monthlyDiscount, 'monthly discount')}`;
  } else if (nights >= 7 && property.weeklyDiscountPercent) {
    discountAmount = subtotalBeforeDiscount * (property.weeklyDiscountPercent / 100);
    discountLabel = `${property.weeklyDiscountPercent}% ${safeTitle(s.weeklyDiscount, 'weekly discount')}`;
  }

  const subtotal = subtotalBeforeDiscount - discountAmount;
  const total = subtotal + cleaningFee + serviceFee;
  const currency = property.currency ?? 'XAF';

  const maxGuests = selectedRoom?.maxGuests ?? property.shortTermAmenities?.maxGuests ?? 20;
  const minNights = property.minNights ?? 1;
  const maxNights = property.maxNights ?? 365;
  const totalGuests = guestCount.adults + guestCount.children;

  const validationError = useMemo(() => {
    if (isMultiRoom && rooms.length > 0 && !selectedRoomId)
      return 'Please select a room to continue';
    if (!dateRange?.from || !dateRange?.to) return null;
    if (nights < minNights)
      return `Minimum stay is ${minNights} night${minNights > 1 ? 's' : ''}`;
    if (nights > maxNights) return `Maximum stay is ${maxNights} nights`;
    if (totalGuests > maxGuests) return `Maximum ${maxGuests} guests allowed`;
    return null;
  }, [dateRange, nights, minNights, maxNights, totalGuests, maxGuests, isMultiRoom, selectedRoomId, rooms.length]);

  const canBook =
    isAuthenticated && dateRange?.from && dateRange?.to && nights > 0 && !validationError;

  function adjustGuests(key: keyof typeof guestCount, delta: number) {
    setGuestCount((prev) => {
      const next = Math.max(0, prev[key] + delta);
      if (key === 'adults' && next < 1) return prev;
      const newTotal =
        (key === 'adults' ? next : prev.adults) +
        (key === 'children' ? next : prev.children);
      if (newTotal > maxGuests) return prev;
      return { ...prev, [key]: next };
    });
  }

  const isDisabled = useCallback(
    (date: Date) =>
      isDateBlocked(
        date,
        isMultiRoom && selectedRoomId ? roomUnavailableDates : property.unavailableDates,
        property.advanceNoticeDays,
        property.bookingWindowDays,
      ),
    [isMultiRoom, selectedRoomId, roomUnavailableDates, property],
  );

  const handleBook = useCallback(async () => {
    if (!canBook || !dateRange?.from || !dateRange?.to) return;
    if (!isAuthenticated) {
      toast.error('Please log in to make a booking');
      router.push('/auth/login');
      return;
    }
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
      setIsMobileModalOpen(false);
      setPaymentOpen(true);
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      toast.error(typeof raw === 'string' ? raw : 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [canBook, dateRange, guestCount, property._id, currency, isAuthenticated, router, selectedRoomId]);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentOpen(false);
    toast.success('Booking confirmed!');
    if (createdBooking?._id) router.push(`/dashboard/bookings/${createdBooking._id}`);
  }, [createdBooking, router]);

  const handlePaymentClose = useCallback(() => {
    setPaymentOpen(false);
    toast.info('Your booking is saved. Pay anytime from your bookings page.');
    if (createdBooking?._id) router.push(`/dashboard/bookings/${createdBooking._id}`);
  }, [createdBooking, router]);

  // ─── SHARED PIECES ────────────────────────────────────────────────────────

  const renderPriceHeader = () => (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-baseline gap-1">
        <span className="text-[22px] font-semibold text-[#222222] tracking-tight">
          {formatMoney(pricePerUnit)}
        </span>
        <span className="text-[#222222] text-[15px]">{unitLabel}</span>
      </div>
      {property.rating && (
        <div className="flex items-center gap-1 text-[14px] text-[#222222]">
          <Star className="w-3.5 h-3.5 fill-[#222222]" />
          <span className="font-semibold">{property.rating.toFixed(2)}</span>
          {property.reviewCount && (
            <span className="text-[#717171]">
              &nbsp;·&nbsp;
              <span className="underline underline-offset-2 cursor-pointer">
                {property.reviewCount} review{property.reviewCount !== 1 ? 's' : ''}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderRoomSelector = () =>
    isMultiRoom && rooms.length > 0 ? (
      <div className="mb-3">
        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
          <SelectTrigger className="w-full h-[52px] rounded-xl border border-[#222222] text-[14px] font-medium text-[#222222] px-4 focus:ring-0 focus:border-[#222222]">
            <SelectValue placeholder="Choose a room type" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-[#DDDDDD] shadow-[0_8px_28px_rgba(0,0,0,0.15)] z-[9999]">
            {rooms.map((room) => (
              <SelectItem
                key={room._id}
                value={room._id}
                disabled={!room.isActive}
                className="text-[14px] py-3"
              >
                {room.name}{room.roomNumber && ` · #${room.roomNumber}`} · {room.maxGuests} guests max
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ) : null;

  // Shared guest counter content — used by both desktop popover and mobile accordion
  const renderGuestContent = () => (
    <div className="p-4">
      <div className="space-y-0">
        {(
          [
            { key: 'adults', label: 'Adults', sub: 'Ages 13 or above', min: 1 },
            { key: 'children', label: 'Children', sub: 'Ages 2–12', min: 0 },
            { key: 'infants', label: 'Infants', sub: 'Under 2', min: 0 },
          ] as const
        ).map(({ key, label, sub, min }, i, arr) => (
          <div
            key={key}
            className={cn(
              'flex items-center justify-between py-4',
              i < arr.length - 1 && 'border-b border-[#EBEBEB]',
            )}
          >
            <div>
              <p className="text-[15px] font-medium text-[#222222]">{label}</p>
              <p className="text-[13px] text-[#717171] mt-0.5">{sub}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => adjustGuests(key, -1)}
                disabled={guestCount[key] <= min}
                className="w-8 h-8 rounded-full border border-[#B0B0B0] flex items-center justify-center text-[#717171] hover:border-[#222222] hover:text-[#222222] disabled:opacity-25 transition-colors"
              >
                <span className="text-lg leading-none select-none">−</span>
              </button>
              <span className="w-5 text-center text-[15px] font-medium text-[#222222]">
                {guestCount[key]}
              </span>
              <button
                type="button"
                onClick={() => adjustGuests(key, 1)}
                disabled={totalGuests >= maxGuests && key !== 'infants'}
                className="w-8 h-8 rounded-full border border-[#B0B0B0] flex items-center justify-center text-[#717171] hover:border-[#222222] hover:text-[#222222] disabled:opacity-25 transition-colors"
              >
                <span className="text-lg leading-none select-none">+</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-[#717171] mt-2 leading-relaxed">
        This place has a maximum of {maxGuests} guests, not including infants. Pets aren't allowed.
      </p>
    </div>
  );

  const renderValidationError = () =>
    validationError ? (
      <div className="mb-4 text-[13px] text-[#C13515] flex items-start gap-2 bg-[#FFF1EE] rounded-xl px-4 py-3 border border-[#FECDC5]">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{validationError}</span>
      </div>
    ) : null;

  const renderCTA = () =>
    isAuthenticated ? (
      <button
        type="button"
        disabled={!canBook || submitting}
        onClick={handleBook}
        className={cn(
          'w-full h-[52px] rounded-xl font-semibold text-[16px] transition-all mb-4',
          canBook && !submitting
            ? 'bg-blue-600 hover:opacity-90 text-white shadow-sm'
            : 'bg-[#DDDDDD] text-[#717171] cursor-not-allowed',
        )}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        ) : nights > 0 ? (
          'Reserve'
        ) : (
          'Check availability'
        )}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => router.push('/auth/login')}
        className="w-full h-[52px] rounded-xl font-semibold text-[16px] text-white bg-blue-600 hover:opacity-90 transition-opacity shadow-sm mb-4"
      >
        Log in to reserve
      </button>
    );

  const renderBreakdown = () =>
    nights > 0 ? (
      <div className="space-y-3.5 text-[15px] text-[#222222]">
        <div className="flex justify-between">
          <span className="underline underline-offset-2 cursor-pointer">
            {formatMoney(pricePerUnit)} × {Number.isInteger(unitCount) ? unitCount : unitCount.toFixed(1)} {unitLabel}{unitCount !== 1 ? 's' : ''}
          </span>
          <span>{formatMoney(subtotalBeforeDiscount)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-[#008A05]">
            <span className="underline underline-offset-2 capitalize cursor-pointer">
              {discountLabel}
            </span>
            <span>−{formatMoney(discountAmount)}</span>
          </div>
        )}
        {cleaningFee > 0 && (
          <div className="flex justify-between">
            <span className="underline underline-offset-2 cursor-pointer">Cleaning fee</span>
            <span>{formatMoney(cleaningFee)}</span>
          </div>
        )}
        {serviceFee > 0 && (
          <div className="flex justify-between">
            <span className="underline underline-offset-2 cursor-pointer">Horo House service fee</span>
            <span>{formatMoney(serviceFee)}</span>
          </div>
        )}
        <div className="pt-4 border-t border-[#DDDDDD] flex justify-between font-semibold text-[16px]">
          <span>Total before taxes</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>
    ) : null;

  // ─── DESKTOP FORM ─────────────────────────────────────────────────────────
  // Popovers are safe here — they live outside the Dialog entirely.

  const renderDesktopForm = () => (
    <div>
      {renderPriceHeader()}
      {renderRoomSelector()}

      <div className="border border-[#222222] rounded-xl overflow-visible mb-4">
        <Popover open={desktopDateOpen} onOpenChange={setDesktopDateOpen}>
          <div className="grid grid-cols-2 border-b border-[#B0B0B0]">
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex flex-col px-4 py-3 text-left hover:bg-[#F7F7F7] rounded-tl-xl border-r border-[#B0B0B0] transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#222222] mb-0.5">
                  Check-in
                </span>
                <span className={cn('text-[14px] font-medium', dateRange?.from ? 'text-[#222222]' : 'text-[#717171]')}>
                  {dateRange?.from ? format(dateRange.from, 'MM/dd/yyyy') : 'Add date'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex flex-col px-4 py-3 text-left hover:bg-[#F7F7F7] rounded-tr-xl transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#222222] mb-0.5">
                  Checkout
                </span>
                <span className={cn('text-[14px] font-medium', dateRange?.to ? 'text-[#222222]' : 'text-[#717171]')}>
                  {dateRange?.to ? format(dateRange.to, 'MM/dd/yyyy') : 'Add date'}
                </span>
              </button>
            </PopoverTrigger>
          </div>
          <PopoverContent
            className="p-0 rounded-3xl border border-[#DDDDDD] shadow-[0_8px_28px_rgba(0,0,0,0.18)] z-[9999] mt-1 w-auto"
            align="center"
            sideOffset={6}
          >
            <CalendarUI
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.from && range?.to) setDesktopDateOpen(false);
              }}
              disabled={isDisabled}
              numberOfMonths={2}
              className="p-4"
            />
          </PopoverContent>
        </Popover>

        <Popover open={desktopGuestOpen} onOpenChange={setDesktopGuestOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F7F7F7] rounded-b-xl transition-colors text-left"
            >
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-[#222222] mb-0.5">
                  Guests
                </span>
                <span className="text-[14px] font-medium text-[#222222]">
                  {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                  {guestCount.infants > 0 &&
                    `, ${guestCount.infants} infant${guestCount.infants > 1 ? 's' : ''}`}
                </span>
              </div>
              {desktopGuestOpen
                ? <ChevronUp className="w-4 h-4 text-[#222222] shrink-0" />
                : <ChevronDown className="w-4 h-4 text-[#222222] shrink-0" />}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="rounded-3xl border border-[#DDDDDD] shadow-[0_8px_28px_rgba(0,0,0,0.15)] z-[9999] mt-1 w-[340px] p-0"
            align="start"
            sideOffset={6}
          >
            {renderGuestContent()}
          </PopoverContent>
        </Popover>
      </div>

      {renderValidationError()}
      {renderCTA()}
      {nights > 0 && isAuthenticated && !validationError && (
        <p className="text-center text-[14px] text-[#222222] mb-5">You won't be charged yet</p>
      )}
      {renderBreakdown()}
    </div>
  );

  // ─── MOBILE FORM ──────────────────────────────────────────────────────────
  //
  // Zero Popovers. Calendar and guest counter expand via CSS grid-rows Accordion.
  //
  // Border structure:
  //   ┌─────────────────────────┐  ← rounded-t-xl border (always)
  //   │  Check-in  │  Checkout  │
  //   ├─────────────────────────┤
  //   │  [calendar accordion]   │  ← left+right border only (no top, no bottom)
  //   ├─────────────────────────┤  ← border-t when calendar closed
  //   │  Guests ↕               │
  //   ├─────────────────────────┤
  //   │  [guests accordion]     │  ← left+right+bottom border, rounded-b-xl
  //   └─────────────────────────┘
  //
  // NO overflow-hidden on the outer wrapper — that's what was clipping panels.

  const renderMobileForm = () => (
    <div>
      {renderPriceHeader()}
      {renderRoomSelector()}

      <div className="mb-4">

        {/* Date trigger row — always has top border + side borders */}
        <div className="grid grid-cols-2 border border-[#222222] rounded-t-xl">
          <button
            type="button"
            onClick={() => toggleMobilePanel('date')}
            className={cn(
              'flex flex-col px-4 py-3 text-left border-r border-[#B0B0B0] rounded-tl-xl transition-colors',
              mobilePanel === 'date' ? 'bg-[#F0F0F0]' : 'hover:bg-[#F7F7F7]',
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#222222] mb-0.5">
              Check-in
            </span>
            <span className={cn('text-[14px] font-medium', dateRange?.from ? 'text-[#222222]' : 'text-[#717171]')}>
              {dateRange?.from ? format(dateRange.from, 'MM/dd/yyyy') : 'Add date'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => toggleMobilePanel('date')}
            className={cn(
              'flex flex-col px-4 py-3 text-left rounded-tr-xl transition-colors',
              mobilePanel === 'date' ? 'bg-[#F0F0F0]' : 'hover:bg-[#F7F7F7]',
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#222222] mb-0.5">
              Checkout
            </span>
            <span className={cn('text-[14px] font-medium', dateRange?.to ? 'text-[#222222]' : 'text-[#717171]')}>
              {dateRange?.to ? format(dateRange.to, 'MM/dd/yyyy') : 'Add date'}
            </span>
          </button>
        </div>

        {/* Calendar accordion — side borders only, no top/bottom */}
        <Accordion open={mobilePanel === 'date'}>
          <div className="border-l border-r border-[#222222] bg-white">
            <CalendarUI
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.from && range?.to) setMobilePanel(null);
              }}
              disabled={isDisabled}
              numberOfMonths={1}
              className="p-3 w-full"
            />
          </div>
        </Accordion>

        {/* Guests trigger — side borders always; top border when calendar is closed */}
        <button
          type="button"
          onClick={() => toggleMobilePanel('guests')}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 transition-colors text-left',
            'border-l border-r border-[#222222]',
            mobilePanel !== 'date' && 'border-t border-[#B0B0B0]',
            // Bottom border + rounding only when guest panel is closed
            mobilePanel !== 'guests' && 'border-b border-[#222222] rounded-b-xl',
            mobilePanel === 'guests' ? 'bg-[#F0F0F0]' : 'hover:bg-[#F7F7F7]',
          )}
        >
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-[#222222] mb-0.5">
              Guests
            </span>
            <span className="text-[14px] font-medium text-[#222222]">
              {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
              {guestCount.infants > 0 &&
                `, ${guestCount.infants} infant${guestCount.infants > 1 ? 's' : ''}`}
            </span>
          </div>
          {mobilePanel === 'guests'
            ? <ChevronUp className="w-4 h-4 text-[#222222] shrink-0" />
            : <ChevronDown className="w-4 h-4 text-[#222222] shrink-0" />}
        </button>

        {/* Guest accordion — side + bottom borders, rounded-b-xl */}
        <Accordion open={mobilePanel === 'guests'}>
          <div className="border-l border-r border-b border-[#222222] rounded-b-xl bg-white">
            {renderGuestContent()}
          </div>
        </Accordion>

      </div>

      {renderValidationError()}
      {renderCTA()}
      {nights > 0 && isAuthenticated && !validationError && (
        <p className="text-center text-[14px] text-[#222222] mb-5">You won't be charged yet</p>
      )}
      {renderBreakdown()}
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Desktop sticky card */}
      <div className="hidden md:block bg-white border border-[#DDDDDD] rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.12)] p-6 sticky top-[88px]">
        {renderDesktopForm()}
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] px-5 py-3.5 z-40 shadow-[0_-2px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[17px] font-semibold text-[#222222]">
                {formatMoney(pricePerUnit)}
              </span>
              <span className="text-[14px] text-[#222222]">{unitLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(true)}
              className="text-[13px] text-[#222222] underline underline-offset-2 mt-0.5"
            >
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
                : 'Add dates'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileModalOpen(true)}
            className="h-[48px] px-7 rounded-xl bg-blue-600 text-white font-semibold text-[15px] shadow-sm hover:opacity-90 transition-opacity"
          >
            Reserve
          </button>
        </div>
      </div>

      {/* Mobile full-screen sheet — zero Popovers inside, no portal collision */}
      <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="md:hidden w-full h-[100dvh] max-w-none m-0 rounded-none p-0 flex flex-col bg-white border-0 z-[100] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom duration-300"
        >
          <DialogTitle className="sr-only">Reserve your stay</DialogTitle>

          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBEBEB] shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(false)}
              className="p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] transition-colors"
              aria-label="Close"
            >
              <ChevronLeft className="w-5 h-5 text-[#222222]" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDateRange(undefined);
                setGuestCount({ adults: 1, children: 0, infants: 0 });
                setMobilePanel(null);
              }}
              className="text-[14px] font-semibold text-[#222222] underline underline-offset-2"
            >
              Clear all
            </button>
          </div>

          {/* Scrollable body — inline accordions, no portals, no clipping */}
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-36">
            {renderMobileForm()}
          </div>
        </DialogContent>
      </Dialog>

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