'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Loader2, Building2, CalendarDays,
  Users, Clock, CheckCircle2, XCircle, AlertCircle, Eye,
  Filter, RefreshCw, ArrowRight, Bed,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, getDay, isSameDay, isSameMonth,
  parseISO, isToday, startOfDay, isWithinInterval,
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  _id: string;
  title: string;
  city?: string;
  images?: Array<{ url: string }>;
}

interface Booking {
  _id: string;
  propertyId: string | { _id: string; title: string };
  guestId: { name: string; email?: string; profilePicture?: string } | string;
  checkIn: string;
  checkOut: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  guests?: { adults?: number; children?: number };
  totalAmount?: number;
  currency?: string;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; dot: string; icon: any }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400',   icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]',  dot: 'bg-[#AAAAAA]',  icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-400',    icon: XCircle },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-400',    icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border', cfg.color)}>
      <Icon className="h-3 w-3 stroke-[2.5]" />
      {cfg.label}
    </span>
  );
}

// ─── Mini month calendar ──────────────────────────────────────────────────────

interface CalendarDayMeta {
  date: Date;
  bookings: Booking[];
  isCurrentMonth: boolean;
}

function MiniCalendar({
  viewing,
  bookings,
  selectedDate,
  onSelectDate,
}: {
  viewing: Date;
  bookings: Booking[];
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
}) {
  const monthStart = startOfMonth(viewing);
  const days: (CalendarDayMeta | null)[] = [];
  const offset = getDay(monthStart);

  for (let i = 0; i < offset; i++) days.push(null);

  eachDayOfInterval({ start: monthStart, end: endOfMonth(viewing) }).forEach(date => {
    const dayBookings = bookings.filter(b => {
      const ci = startOfDay(parseISO(b.checkIn));
      const co = startOfDay(parseISO(b.checkOut));
      return isWithinInterval(date, { start: ci, end: co });
    });
    days.push({ date, bookings: dayBookings, isCurrentMonth: true });
  });

  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-[#AAAAAA] py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((meta, i) => {
          if (!meta) return <div key={`blank-${i}`} />;
          const { date, bookings: dayBkgs } = meta;
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const hasBkg = dayBkgs.length > 0;
          const pending = dayBkgs.some(b => b.status === 'pending');
          const today = isToday(date);

          return (
            <button
              key={format(date, 'yyyy-MM-dd')}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                'relative flex flex-col items-center justify-start pt-1 pb-0.5 h-10 rounded-lg transition-all text-[13px] font-medium',
                isSelected
                  ? 'bg-[#222222] text-white'
                  : today
                    ? 'text-blue-600 font-bold bg-blue-50 hover:bg-blue-100'
                    : hasBkg
                      ? 'text-[#222222] hover:bg-[#F7F7F7]'
                      : 'text-[#717171] hover:bg-[#F7F7F7]',
              )}
            >
              <span>{format(date, 'd')}</span>
              {hasBkg && !isSelected && (
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full mt-auto mb-0.5',
                  pending ? 'bg-amber-400' : 'bg-emerald-500',
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onAction,
}: {
  booking: Booking;
  onAction: (id: string, action: 'confirm' | 'reject') => void;
}) {
  const router = useRouter();
  const { formatMoney } = useCurrency();
  const guest = typeof booking.guestId === 'object' ? booking.guestId : { name: 'Guest' };
  const propId = typeof booking.propertyId === 'object' ? booking.propertyId._id : booking.propertyId;
  const propTitle = typeof booking.propertyId === 'object' ? booking.propertyId.title : 'Property';
  const nights = Math.max(1, Math.round(
    (parseISO(booking.checkOut).getTime() - parseISO(booking.checkIn).getTime()) / 86400000,
  ));
  const totalGuests = (booking.guests?.adults ?? 1) + (booking.guests?.children ?? 0);

  return (
    <div className={cn(
      'bg-white border rounded-2xl p-5 space-y-4 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]',
      booking.status === 'pending' ? 'border-amber-200' : 'border-[#DDDDDD]',
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Guest avatar */}
          <div className="w-10 h-10 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center shrink-0 text-sm font-bold text-[#222222]">
            {guest.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#222222] truncate">{guest.name}</p>
            <p className="text-[13px] text-[#717171] truncate">{propTitle}</p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Dates */}
      <div className="flex items-center gap-3 bg-[#F7F7F7] rounded-xl px-4 py-3">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA]">Check-in</p>
          <p className="text-[14px] font-semibold text-[#222222]">{format(parseISO(booking.checkIn), 'MMM d')}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-[#AAAAAA] shrink-0 mx-1" />
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA]">Check-out</p>
          <p className="text-[14px] font-semibold text-[#222222]">{format(parseISO(booking.checkOut), 'MMM d')}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA]">Duration</p>
          <p className="text-[14px] font-semibold text-[#222222]">{nights} night{nights > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-5 text-[13px] text-[#717171]">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {totalGuests} guest{totalGuests > 1 ? 's' : ''}
        </span>
        {booking.totalAmount && (
          <span className="flex items-center gap-1.5 font-semibold text-[#222222]">
            {formatMoney(booking.totalAmount)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#EBEBEB]">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[#222222] hover:text-blue-600 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View details
        </button>
        {booking.status === 'pending' && (
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => onAction(booking._id, 'reject')}
              className="h-9 px-4 rounded-lg border border-[#DDDDDD] text-[13px] font-semibold text-[#717171] hover:border-[#222222] hover:text-[#222222] transition-colors"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => onAction(booking._id, 'confirm')}
              className="h-9 px-4 rounded-lg bg-[#222222] text-white text-[13px] font-semibold hover:bg-black transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HostBookingCalendar() {
  const [viewing, setViewing] = useState(startOfMonth(new Date()));
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingBkgs, setLoadingBkgs] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actioning, setActioning] = useState<string | null>(null);

  // ── Fetch short_term properties ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getMyProperties({ listingType: 'short_term' });
        setProperties(res.properties ?? []);
      } catch {
        toast.error('Could not load your properties.');
      } finally {
        setLoadingProps(false);
      }
    })();
  }, []);

  // ── Fetch bookings ───────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setLoadingBkgs(true);
    try {
      const from = format(startOfMonth(viewing), 'yyyy-MM-dd');
      const to   = format(endOfMonth(addMonths(viewing, 1)), 'yyyy-MM-dd');
      // Note: /bookings/hosting does not accept `propertyId` — filter client-side
      const res  = await apiClient.getHostBookings({ fromDate: from, toDate: to, limit: 100 });
      const raw: Booking[] = Array.isArray(res) ? res : (res?.bookings ?? res?.data ?? []);
      // Filter by selected property on the client if needed
      const filtered = selectedPropertyId === 'all'
        ? raw
        : raw.filter(b => {
            const bPropId = typeof b.propertyId === 'object' ? b.propertyId._id : b.propertyId;
            return bPropId === selectedPropertyId;
          });
      setBookings(filtered);
    } catch {
      toast.error('Could not load bookings.');
    } finally {
      setLoadingBkgs(false);
    }
  }, [viewing, selectedPropertyId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── action: confirm / reject ─────────────────────────────────────────────
  const handleAction = useCallback(async (id: string, action: 'confirm' | 'reject') => {
    setActioning(id);
    try {
      if (action === 'confirm') await apiClient.confirmBooking(id, {});
      else await apiClient.rejectBooking(id, {});
      toast.success(action === 'confirm' ? 'Booking confirmed!' : 'Booking declined.');
      fetchBookings();
    } catch (err: any) {
      // Surface the real backend message (e.g. date conflict details)
      const msg: string =
        err?.response?.data?.message ??
        err?.message ??
        'Action failed. Please try again.';
      toast.error(msg);
      fetchBookings(); // refresh so UI reflects current DB state
    } finally {
      setActioning(null);
    }
  }, [fetchBookings]);

  // ── Visible bookings ─────────────────────────────────────────────────────
  const visibleBookings = useMemo(() => {
    let list = bookings;
    if (selectedDate) {
      const sd = startOfDay(selectedDate);
      list = list.filter(b => {
        const ci = startOfDay(parseISO(b.checkIn));
        const co = startOfDay(parseISO(b.checkOut));
        return isWithinInterval(sd, { start: ci, end: co });
      });
    }
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
    return list;
  }, [bookings, selectedDate, statusFilter]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    arrivals: bookings.filter(b => isToday(parseISO(b.checkIn))).length,
  }), [bookings]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-8 font-sans text-[#222222]">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b border-[#DDDDDD]">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-[#222222] mb-1">Booking Calendar</h1>
          <p className="text-[15px] text-[#717171]">Manage all guest reservations across your short-stay properties.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Property selector */}
          {loadingProps ? (
            <div className="h-11 w-48 rounded-xl bg-[#F7F7F7] animate-pulse" />
          ) : (
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="h-11 w-52 rounded-xl border-[#DDDDDD] text-[14px] font-medium text-[#222222] px-4 focus:ring-0 focus:border-[#222222]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[#DDDDDD] shadow-[0_8px_28px_rgba(0,0,0,0.15)]">
                <SelectItem value="all" className="text-[14px] py-2.5">All properties</SelectItem>
                {properties.map(p => (
                  <SelectItem key={p._id} value={p._id} className="text-[14px] py-2.5">{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <button
            type="button"
            onClick={fetchBookings}
            disabled={loadingBkgs}
            className="h-11 w-11 rounded-xl border border-[#DDDDDD] flex items-center justify-center text-[#717171] hover:border-[#222222] hover:text-[#222222] transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn('h-4 w-4', loadingBkgs && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'This period',  value: stats.total,     icon: CalendarDays, color: 'bg-[#F7F7F7]' },
          { label: 'Pending',      value: stats.pending,   icon: AlertCircle,  color: 'bg-amber-50' },
          { label: 'Confirmed',    value: stats.confirmed, icon: CheckCircle2, color: 'bg-emerald-50' },
          { label: 'Arriving today', value: stats.arrivals, icon: Bed,          color: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-[#DDDDDD] rounded-2xl p-5 flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
              <Icon className="h-5 w-5 text-[#222222]" />
            </div>
            <div>
              <p className="text-[26px] font-bold tracking-tight text-[#222222] leading-none">{value}</p>
              <p className="text-[13px] text-[#717171] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── Left: Calendar ──────────────────────────────────────────── */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white border border-[#DDDDDD] rounded-2xl shadow-sm p-6">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => setViewing(v => subMonths(v, 1))}
                className="p-2 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#717171] hover:text-[#222222]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[15px] font-bold text-[#222222]">
                {format(viewing, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setViewing(v => addMonths(v, 1))}
                className="p-2 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#717171] hover:text-[#222222]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {loadingBkgs ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-[#AAAAAA]" />
              </div>
            ) : (
              <MiniCalendar
                viewing={viewing}
                bookings={bookings}
                selectedDate={selectedDate}
                onSelectDate={d => setSelectedDate(prev => prev && isSameDay(prev, d) ? null : d)}
              />
            )}

            {/* Legend */}
            <div className="flex items-center gap-5 mt-5 pt-4 border-t border-[#EBEBEB] text-[12px] text-[#717171]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Confirmed
              </span>
            </div>

            {/* Clear date selection */}
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="mt-3 w-full text-center text-[13px] font-semibold text-[#717171] hover:text-[#222222] underline underline-offset-2 transition-colors"
              >
                Clear selection — show all
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Reservation list ──────────────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* List header */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-bold text-[#222222]">
              {selectedDate ? `Reservations on ${format(selectedDate, 'MMMM d')}` : 'All Reservations'}
              {visibleBookings.length > 0 && (
                <span className="ml-2 text-[14px] font-normal text-[#717171]">({visibleBookings.length})</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#717171]" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36 rounded-xl border-[#DDDDDD] text-[13px] font-medium text-[#222222] px-3 focus:ring-0 focus:border-[#222222]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDDDDD] shadow-lg">
                  <SelectItem value="all" className="text-[13px] py-2">All statuses</SelectItem>
                  <SelectItem value="pending" className="text-[13px] py-2">Pending</SelectItem>
                  <SelectItem value="confirmed" className="text-[13px] py-2">Confirmed</SelectItem>
                  <SelectItem value="completed" className="text-[13px] py-2">Completed</SelectItem>
                  <SelectItem value="cancelled" className="text-[13px] py-2">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingBkgs ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#F7F7F7] rounded-2xl h-40 animate-pulse border border-[#EBEBEB]" />
              ))}
            </div>
          ) : visibleBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#DDDDDD] rounded-2xl text-center">
              <div className="w-14 h-14 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4 border border-[#DDDDDD]">
                <CalendarDays className="h-6 w-6 text-[#AAAAAA]" />
              </div>
              <p className="text-[16px] font-semibold text-[#222222]">No reservations found</p>
              <p className="text-[14px] text-[#717171] mt-1">
                {selectedDate ? 'No bookings overlap with the selected date.' : 'No bookings for this period.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleBookings.map(booking => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
