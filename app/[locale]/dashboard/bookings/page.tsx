"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    Calendar, MapPin, Users, Clock, Star, ChevronRight,
    AlertCircle, CheckCircle2, XCircle, Loader2, Filter,
    BedDouble, RotateCcw, Check, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { color: string; icon: React.ReactNode }> = {
    [BookingStatus.PENDING]: { color: 'bg-[#F7F7F7] text-[#222222] border-[#DDDDDD]', icon: <Clock className="h-3.5 w-3.5" /> },
    [BookingStatus.CONFIRMED]: { color: 'bg-white text-[#008A05] border-[#008A05]/30', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    [BookingStatus.REJECTED]: { color: 'bg-[#FFF8F8] text-[#E50000] border-[#FFDFDF]', icon: <XCircle className="h-3.5 w-3.5" /> },
    [BookingStatus.CANCELLED]: { color: 'bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]', icon: <RotateCcw className="h-3.5 w-3.5" /> },
    [BookingStatus.COMPLETED]: { color: 'bg-[#F7F7F7] text-[#222222] border-[#DDDDDD]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    [BookingStatus.NO_SHOW]: { color: 'bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

function StatusBadge({ status, label }: { status: BookingStatus, label: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[BookingStatus.PENDING];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-semibold ${cfg.color}`}>
            {cfg.icon}
            {label}
        </span>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
    const router = useRouter();
    const { isAdmin, isAgent, isLandlord } = useUserRole();
    const isHost = isAgent || isLandlord || isAdmin;
    const { t } = useLanguage();
    const _t = t as any;
    const s = _t.bookings || {};

    const getStatusLabel = (status: BookingStatus) => {
        const labels: Record<BookingStatus, string> = {
            [BookingStatus.PENDING]: s.status?.pending || 'Pending Review',
            [BookingStatus.CONFIRMED]: s.status?.confirmed || 'Confirmed',
            [BookingStatus.REJECTED]: s.status?.rejected || 'Declined',
            [BookingStatus.CANCELLED]: s.status?.cancelled || 'Cancelled',
            [BookingStatus.COMPLETED]: s.status?.completed || 'Completed',
            [BookingStatus.NO_SHOW]: s.status?.noShow || 'No Show',
        };
        return labels[status];
    };

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [viewMode, setViewMode] = useState<'guest' | 'host' | 'admin'>(
        isAdmin ? 'admin' : isHost ? 'host' : 'guest'
    );

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [actionDialogOpen, setActionDialogOpen] = useState<'cancel' | 'confirm' | 'reject' | null>(null);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 10,
                status: filter === 'all' ? undefined : filter,
            };

            let res;
            if (viewMode === 'admin') {
                res = await apiClient.getAdminBookings(params);
            } else if (viewMode === 'host') {
                res = await apiClient.getHostBookings(params);
            } else {
                res = await apiClient.getMyBookings(params);
            }

            setBookings(res.bookings ?? []);
            setTotalPages(res.totalPages ?? 1);
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error(s.toasts?.loadError || 'Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    }, [page, filter, viewMode, s]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    async function handleAction() {
        if (!selectedBooking || !actionDialogOpen) return;
        setSubmitting(true);
        try {
            if (actionDialogOpen === 'cancel') {
                await apiClient.cancelBooking(selectedBooking._id, { reason: note });
                toast.success(s.toasts?.cancelSuccess || 'Booking cancelled.');
            } else if (actionDialogOpen === 'confirm') {
                await apiClient.confirmBooking(selectedBooking._id, { hostNote: note });
                toast.success(s.toasts?.confirmSuccess || 'Booking confirmed.');
            } else if (actionDialogOpen === 'reject') {
                await apiClient.rejectBooking(selectedBooking._id, { reason: note });
                toast.success(s.toasts?.rejectSuccess || 'Booking rejected.');
            }
            setActionDialogOpen(null);
            setNote('');
            fetchBookings();
        } catch {
            toast.error(s.toasts?.actionError?.replace('{action}', actionDialogOpen) || `Could not ${actionDialogOpen} the booking. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    }

    const title = useMemo(() => {
        if (viewMode === 'admin') return s.globalBookings || 'Global bookings';
        if (viewMode === 'host') return s.hostedBookings || 'Hosted bookings';
        return s.myStays || 'My stays';
    }, [viewMode, s]);

    const badgeLabel = useMemo(() => {
        if (viewMode === 'admin') return s.adminView || 'Admin View';
        if (viewMode === 'host') return s.hostView || 'Host View';
        return s.guestView || 'Guest View';
    }, [viewMode, s]);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-white overflow-x-hidden">
                <AppSidebar />
                <SidebarInset className="flex flex-col min-w-0 overflow-x-hidden">
                    <NavDash />
                    <main className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10 min-w-0">

                        {/* ── Header ── */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-[32px] font-semibold tracking-tight text-[#222222]">{title}</h1>
                                    <Badge className="bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD] hover:bg-[#EBEBEB] text-[12px] px-2.5 py-1 rounded-md font-medium">
                                        {badgeLabel}
                                    </Badge>
                                </div>
                                <p className="text-[16px] text-[#717171]">
                                    {viewMode === 'guest' ? (s.guestDesc || 'Manage and review your upcoming travel stays.') : (s.hostDesc || 'Monitor short-term property bookings and guest requests.')}
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto mt-2 lg:mt-0">
                                {/* Role View Switcher */}
                                {isHost && (
                                    <div className="flex bg-[#F7F7F7] rounded-xl border border-[#DDDDDD] p-1 w-full sm:w-auto">
                                        <Button
                                            variant="ghost"
                                            className={cn("h-10 text-[14px] font-medium rounded-lg flex-1 sm:flex-none transition-all px-5", viewMode === 'guest' ? "bg-white shadow-sm text-[#222222]" : "text-[#717171] hover:text-[#222222]")}
                                            onClick={() => { setViewMode('guest'); setPage(1); }}
                                        >
                                            {s.asGuest || 'As Guest'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className={cn("h-10 text-[14px] font-medium rounded-lg flex-1 sm:flex-none transition-all px-5", viewMode === 'host' ? "bg-white shadow-sm text-[#222222]" : "text-[#717171] hover:text-[#222222]")}
                                            onClick={() => { setViewMode('host'); setPage(1); }}
                                        >
                                            {s.asHost || 'As Host'}
                                        </Button>
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                className={cn("h-10 text-[14px] font-medium rounded-lg flex-1 sm:flex-none transition-all px-5", viewMode === 'admin' ? "bg-white shadow-sm text-[#222222]" : "text-[#717171] hover:text-[#222222]")}
                                                onClick={() => { setViewMode('admin'); setPage(1); }}
                                            >
                                                {s.adminMode || 'Admin Mode'}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center w-full md:w-[200px]">
                                    <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-12 w-full bg-white border border-[#DDDDDD] text-[#222222] text-[15px] font-medium hover:border-blue-600 focus:ring-0 focus:ring-offset-0 rounded-xl transition-colors">
                                            <div className="flex items-center">
                                                <Filter className="h-4 w-4 mr-2 text-[#717171] stroke-[2]" />
                                                <SelectValue placeholder={s.filterStatus || "Filter Status"} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-[#DDDDDD] shadow-lg">
                                            <SelectItem value="all" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px]">{s.allStays || 'All stays'}</SelectItem>
                                            {Object.values(BookingStatus).map((stat) => (
                                                <SelectItem key={stat} value={stat} className="focus:bg-[#F7F7F7] cursor-pointer text-[14px]">{getStatusLabel(stat)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* ── Content ── */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-[#222222]" />
                                <p className="text-[15px] font-medium text-[#717171] animate-pulse">{s.loading || 'Loading bookings...'}</p>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F7F7F7] border border-[#DDDDDD] py-24 px-6 text-center">
                                <div className="h-16 w-16 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <BedDouble className="h-7 w-7 text-[#222222] stroke-[1.5]" />
                                </div>
                                <h3 className="text-[22px] font-semibold text-[#222222] mb-2">{s.noBookings || 'No bookings found'}</h3>
                                <p className="text-[16px] text-[#717171] max-w-md">
                                    {viewMode === 'guest' ? (s.noStaysGuest || 'Looks like you don\'t have any upcoming stays booked yet. Start exploring properties to plan your next trip!') : (s.noStaysHost || 'We couldn\'t find any reservations matching your current criteria.')}
                                </p>
                                {viewMode === 'guest' && (
                                    <Button className="mt-8 h-12 px-8 rounded-lg font-semibold text-[15px] blue-blue-600 blue-blue-700 text-white transition-colors" onClick={() => router.push('/properties?listingType=short_term')}>
                                        {s.browseStays || 'Start searching'}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">

                                {/* ── Mobile: stacked cards (hidden on md+) ── */}
                                <div className="flex flex-col gap-4 md:hidden">
                                    {bookings.map((booking) => (
                                        <BookingMobileCard
                                            key={booking._id}
                                            booking={booking}
                                            viewMode={viewMode}
                                            getStatusLabel={getStatusLabel}
                                            s={s}
                                            onViewDetail={() => router.push(`/dashboard/bookings/${booking._id}`)}
                                            onAction={(action) => {
                                                setSelectedBooking(booking);
                                                setActionDialogOpen(action);
                                                setNote('');
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* ── Desktop: table (hidden on mobile) ── */}
                                <div className="hidden md:block bg-white rounded-2xl border border-[#DDDDDD] overflow-x-auto w-full">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#F7F7F7] border-b border-[#DDDDDD]">
                                            <tr>
                                                <th className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">{s.tableProperty || 'Property'}</th>
                                                <th className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">{viewMode === 'guest' ? (s.tableHost || 'Host') : (s.tableGuest || 'Guest')}</th>
                                                <th className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">{s.tableDates || 'Dates'}</th>
                                                <th className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">{s.tablePrice || 'Total'}</th>
                                                <th className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">{s.tableStatus || 'Status'}</th>
                                                <th className="px-5 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider text-right">{s.tableActions || 'Actions'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#DDDDDD]">
                                            {bookings.map((booking) => (
                                                <BookingTableRow
                                                    key={booking._id}
                                                    booking={booking}
                                                    viewMode={viewMode}
                                                    getStatusLabel={getStatusLabel}
                                                    s={s}
                                                    onViewDetail={() => router.push(`/dashboard/bookings/${booking._id}`)}
                                                    onAction={(action) => {
                                                        setSelectedBooking(booking);
                                                        setActionDialogOpen(action);
                                                        setNote('');
                                                    }}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-[#DDDDDD] gap-4">
                                        <p className="text-[15px] text-[#717171] font-medium order-2 sm:order-1">
                                            {s.showingPage || 'Showing page'} <span className="text-[#222222] font-semibold">{page}</span> {s.of || 'of'} <span className="text-[#222222] font-semibold">{totalPages}</span>
                                        </p>
                                        <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto">
                                            <Button variant="outline" className="flex-1 sm:flex-none h-11 px-5 rounded-lg font-semibold text-[15px] border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] hover:border-blue-600" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                                {s.previous || 'Previous'}
                                            </Button>
                                            <Button variant="outline" className="flex-1 sm:flex-none h-11 px-5 rounded-lg font-semibold text-[15px] border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] hover:border-blue-600" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                                {s.next || 'Next'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </SidebarInset>
            </div>

            {/* ── Action dialog ── */}
            <Dialog open={!!actionDialogOpen} onOpenChange={(open) => !open && setActionDialogOpen(null)}>
                <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] mx-auto rounded-2xl border-[#DDDDDD] p-0 overflow-hidden shadow-2xl">
                    <div className="p-8">
                        <DialogHeader className="space-y-4 mb-6 text-left">
                            <div className="w-12 h-12 bg-[#F7F7F7] border border-[#DDDDDD] rounded-full flex items-center justify-center">
                                {actionDialogOpen === 'cancel' && <AlertCircle className="h-6 w-6 text-[#222222] stroke-[1.5]" />}
                                {actionDialogOpen === 'confirm' && <CheckCircle2 className="h-6 w-6 text-[#222222] stroke-[1.5]" />}
                                {actionDialogOpen === 'reject' && <XCircle className="h-6 w-6 text-[#222222] stroke-[1.5]" />}
                            </div>
                            <div>
                                <DialogTitle className="text-[22px] font-semibold text-[#222222] tracking-tight capitalize">
                                    {actionDialogOpen === 'cancel' ? (s.dialogTokens?.cancel || 'cancel') : actionDialogOpen === 'confirm' ? (s.dialogTokens?.confirm || 'confirm') : (s.dialogTokens?.reject || 'reject')} {s.dialogReservation || 'reservation'}
                                </DialogTitle>
                                <p className="text-[#717171] mt-2 text-[15px] leading-relaxed">
                                    {s.dialogAreYouSure || 'Are you sure you want to'} <span className="font-semibold text-[#222222]">{actionDialogOpen === 'cancel' ? (s.dialogTokens?.cancel || 'cancel') : actionDialogOpen === 'confirm' ? (s.dialogTokens?.confirm || 'confirm') : (s.dialogTokens?.reject || 'reject')}</span> {s.dialogThisBookingFor || 'this booking for'}{' '}
                                    <span className="font-semibold text-[#222222]">{selectedBooking?.propertyId?.title}</span>?
                                </p>
                            </div>
                        </DialogHeader>

                        <div className="space-y-3 mb-8">
                            <label className="text-[14px] font-semibold text-[#222222]">
                                {actionDialogOpen === 'confirm' ? (s.dialogAddMessage || 'Message to guest (optional)') : (s.dialogReason || 'Reason (optional)')}
                            </label>
                            <Textarea
                                placeholder={actionDialogOpen === 'confirm' ? (s.dialogMessagePlaceholder || 'E.g. "Looking forward to hosting you!"') : (s.dialogReasonPlaceholder || 'E.g. "We need to cancel due to unforeseen maintenance..."')}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="min-h-[120px] rounded-xl border-[#DDDDDD] bg-white p-4 text-[15px] text-[#222222] placeholder:text-[#717171] focus-visible:ring-1 focus-visible:ring-[#222222] focus-visible:border-blue-600 resize-none"
                            />
                        </div>

                        <DialogFooter className="gap-3 sm:space-x-0 sm:flex-nowrap mt-4">
                            <Button variant="outline" className="rounded-lg h-12 w-full sm:w-1/2 text-[15px] font-semibold border-blue-600 text-[#222222] hover:bg-[#F7F7F7]" onClick={() => setActionDialogOpen(null)}>
                                {s.goBack || 'Cancel'}
                            </Button>
                            <Button
                                className={cn(
                                    "rounded-lg h-12 w-full sm:w-1/2 text-[15px] font-semibold text-white transition-colors",
                                    actionDialogOpen === 'confirm' ? "bg-blue-600 hover:bg-blue-700" : "blue-blue-600 blue-blue-700"
                                )}
                                onClick={handleAction}
                                disabled={submitting}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {actionDialogOpen === 'cancel' ? (s.dialogTokens?.cancel?.toUpperCase() || 'CANCEL') : actionDialogOpen === 'confirm' ? (s.dialogTokens?.confirm?.toUpperCase() || 'CONFIRM') : (s.dialogTokens?.reject?.toUpperCase() || 'REJECT')}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}

// ─── Booking table row sub-component ──────────────────────────────────────────

function BookingTableRow({
    booking, onViewDetail, onAction, viewMode, getStatusLabel, s
}: {
    booking: Booking;
    onViewDetail: () => void;
    onAction: (type: 'cancel' | 'confirm' | 'reject') => void;
    viewMode: 'guest' | 'host' | 'admin';
    getStatusLabel: (s: BookingStatus) => string;
    s: any;
}) {
    const prop = booking.propertyId;
    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));

    const isPending = booking.status === BookingStatus.PENDING;
    const isConfirmed = booking.status === BookingStatus.CONFIRMED;

    const showHostActions = (viewMode === 'host' || viewMode === 'admin') && isPending;
    const canCancel = (viewMode === 'guest' && (isPending || isConfirmed)) ||
        ((viewMode === 'host' || viewMode === 'admin') && isConfirmed);

    return (
        <tr className="hover:bg-[#F7F7F7] transition-colors group">
            {/* Property */}
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-16 bg-[#F7F7F7] border border-[#DDDDDD] rounded-lg overflow-hidden shrink-0">
                        {prop?.images?.[0]?.url ? (
                            <img src={prop.images[0].url} alt={prop.title} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <BedDouble className="h-5 w-5 text-[#DDDDDD]" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-[15px] text-[#222222] truncate max-w-[180px] lg:max-w-xs">{prop?.title}</p>
                        <p className="text-[13px] text-[#717171] mt-0.5 truncate max-w-[150px]">{prop?.city}</p>
                    </div>
                </div>
            </td>

            {/* Guest/Host */}
            <td className="px-6 py-5 whitespace-nowrap">
                <p className="font-medium text-[15px] text-[#222222]">
                    {viewMode === 'guest' ? booking.hostId?.name : booking.guestId?.name}
                </p>
                <p className="text-[13px] text-[#717171] mt-0.5">
                    {(booking.guests?.adults ?? 1) + (booking.guests?.children ?? 0)} {(booking.guests?.adults ?? 1) > 1 || (booking.guests?.children ?? 0) > 0 ? (s.cardGuests || 'guests') : (s.cardGuestText || 'guest')}
                </p>
            </td>

            {/* Dates */}
            <td className="px-6 py-5 whitespace-nowrap">
                <p className="font-medium text-[15px] text-[#222222]">
                    {format(parseISO(booking.checkIn), 'MMM d, yyyy')}
                </p>
                <p className="text-[13px] text-[#717171] mt-0.5">
                    {nights} {nights !== 1 ? (s.cardNights || 'nights') : (s.cardNight || 'night')}
                </p>
            </td>

            {/* Total Price */}
            <td className="px-6 py-5 whitespace-nowrap">
                <p className="font-semibold text-[15px] text-[#222222]">
                    {booking.priceBreakdown?.totalAmount?.toLocaleString()} <span className="text-[13px] text-[#717171] font-normal">{booking.currency ?? 'XAF'}</span>
                </p>
            </td>

            {/* Status */}
            <td className="px-6 py-5 whitespace-nowrap">
                <StatusBadge status={booking.status} label={getStatusLabel(booking.status)} />
            </td>

            {/* Actions */}
            <td className="px-6 py-5 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-3">
                    {showHostActions && (
                        <>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-[#222222] border border-[#DDDDDD] hover:border-blue-600 hover:bg-white rounded-full" onClick={(e) => { e.stopPropagation(); onAction('confirm'); }} title={s.actionAccept || "Accept"}>
                                <Check className="h-4 w-4 stroke-[2]" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-[#E50000] border border-[#DDDDDD] hover:border-[#E50000] hover:bg-[#FFF8F8] rounded-full" onClick={(e) => { e.stopPropagation(); onAction('reject'); }} title={s.actionDecline || "Decline"}>
                                <X className="h-4 w-4 stroke-[2]" />
                            </Button>
                        </>
                    )}

                    {booking.status === BookingStatus.COMPLETED && !booking.guestReviewLeft && viewMode === 'guest' && (
                        <Button size="sm" variant="outline" className="h-9 px-4 rounded-lg text-[13px] font-semibold border-blue-600 text-[#222222] hover:bg-[#F7F7F7]" onClick={(e) => { e.stopPropagation(); onViewDetail(); }}>
                            {s.actionReview || 'Review'}
                        </Button>
                    )}

                    {canCancel && (
                        <Button size="sm" variant="ghost" className="h-9 px-0 text-[14px] font-semibold text-[#222222] underline hover:bg-transparent hover:text-black" onClick={(e) => { e.stopPropagation(); onAction('cancel'); }}>
                            {s.actionCancel || 'Cancel'}
                        </Button>
                    )}

                    <Button size="sm" className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-blue-600 text-white hover:bg-blue-700 ml-2" onClick={onViewDetail}>
                        {s.actionDetails || 'Details'}
                    </Button>
                </div>
            </td>
        </tr>
    );
}

// ─── Mobile booking card ───────────────────────────────────────────────────────

function BookingMobileCard({
    booking, onViewDetail, onAction, viewMode, getStatusLabel, s
}: {
    booking: Booking;
    onViewDetail: () => void;
    onAction: (type: 'cancel' | 'confirm' | 'reject') => void;
    viewMode: 'guest' | 'host' | 'admin';
    getStatusLabel: (s: BookingStatus) => string;
    s: any;
}) {
    const prop = booking.propertyId;
    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));
    const isPending = booking.status === BookingStatus.PENDING;
    const isConfirmed = booking.status === BookingStatus.CONFIRMED;
    const showHostActions = (viewMode === 'host' || viewMode === 'admin') && isPending;
    const canCancel = (viewMode === 'guest' && (isPending || isConfirmed)) ||
        ((viewMode === 'host' || viewMode === 'admin') && isConfirmed);

    return (
        <div className="bg-white border border-[#DDDDDD] rounded-2xl overflow-hidden">
            {prop?.images?.[0]?.url && (
                <div className="h-44 w-full overflow-hidden">
                    <img src={prop.images[0].url} alt={prop.title} className="h-full w-full object-cover" />
                </div>
            )}

            <div className="p-4 space-y-4">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-semibold text-[16px] text-[#222222] leading-tight truncate">{prop?.title}</p>
                        <p className="text-[13px] text-[#717171] mt-0.5">{prop?.city}</p>
                    </div>
                    <div className="shrink-0">
                        <StatusBadge status={booking.status} label={getStatusLabel(booking.status)} />
                    </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 border-t border-[#EBEBEB] pt-4">
                    <div>
                        <p className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Dates
                        </p>
                        <p className="text-[14px] font-medium text-[#222222]">
                            {format(parseISO(booking.checkIn), 'MMM d')} – {format(parseISO(booking.checkOut), 'MMM d')}
                        </p>
                        <p className="text-[12px] text-[#717171]">{nights} {nights !== 1 ? (s.cardNights || 'nights') : (s.cardNight || 'night')}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Users className="h-3 w-3" /> {viewMode === 'guest' ? (s.tableHost || 'Host') : (s.tableGuest || 'Guest')}
                        </p>
                        <p className="text-[14px] font-medium text-[#222222] truncate">
                            {viewMode === 'guest' ? booking.hostId?.name : booking.guestId?.name}
                        </p>
                        <p className="text-[12px] text-[#717171]">
                            {(booking.guests?.adults ?? 1) + (booking.guests?.children ?? 0)}{' '}
                            {(booking.guests?.adults ?? 1) > 1 ? (s.cardGuests || 'guests') : (s.cardGuestText || 'guest')}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider mb-1">Total</p>
                        <p className="text-[18px] font-semibold text-[#222222]">
                            {booking.priceBreakdown?.totalAmount?.toLocaleString()}{' '}
                            <span className="text-[13px] font-normal text-[#717171]">{booking.currency ?? 'XAF'}</span>
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-t border-[#EBEBEB] pt-4">
                    {showHostActions && (
                        <>
                            <Button size="sm" variant="outline"
                                className="flex-1 h-10 rounded-xl text-[14px] font-semibold border-blue-600 text-[#222222] hover:bg-[#F7F7F7]"
                                onClick={() => onAction('confirm')}>
                                <Check className="mr-1.5 h-4 w-4 stroke-[2]" /> {s.actionConfirm || 'Accept'}
                            </Button>
                            <Button size="sm" variant="outline"
                                className="flex-1 h-10 rounded-xl text-[14px] font-semibold border-[#FFDFDF] text-[#E50000] hover:bg-[#FFF8F8]"
                                onClick={() => onAction('reject')}>
                                <X className="mr-1.5 h-4 w-4 stroke-[2]" /> {s.actionDecline || 'Decline'}
                            </Button>
                        </>
                    )}
                    {booking.status === BookingStatus.COMPLETED && !booking.guestReviewLeft && viewMode === 'guest' && (
                        <Button size="sm" variant="outline"
                            className="h-10 px-4 rounded-xl text-[14px] font-semibold border-blue-600 text-[#222222] hover:bg-[#F7F7F7]"
                            onClick={onViewDetail}>
                            {s.actionReview || 'Leave review'}
                        </Button>
                    )}
                    {canCancel && (
                        <Button size="sm" variant="ghost"
                            className="h-10 px-3 text-[14px] font-semibold text-[#222222] underline hover:bg-transparent"
                            onClick={() => onAction('cancel')}>
                            {s.actionCancel || 'Cancel'}
                        </Button>
                    )}
                    <Button size="sm"
                        className="flex-1 h-10 rounded-xl text-[14px] font-semibold bg-blue-600 text-white hover:bg-blue-700"
                        onClick={onViewDetail}>
                        {s.actionDetails || 'View details'}
                    </Button>
                </div>
            </div>
        </div>
    );
}