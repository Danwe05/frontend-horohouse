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
import { Separator } from '@/components/ui/separator';

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
    [BookingStatus.PENDING]: { label: 'Pending Review', color: 'bg-amber-100/50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> },
    [BookingStatus.CONFIRMED]: { label: 'Confirmed', color: 'bg-emerald-100/50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
    [BookingStatus.REJECTED]: { label: 'Declined', color: 'bg-red-100/50 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" /> },
    [BookingStatus.CANCELLED]: { label: 'Cancelled', color: 'bg-slate-100/50 text-slate-600 border-slate-200', icon: <RotateCcw className="h-3 w-3" /> },
    [BookingStatus.COMPLETED]: { label: 'Completed', color: 'bg-blue-100/50 text-blue-700 border-blue-200', icon: <CheckCircle2 className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: BookingStatus }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[BookingStatus.PENDING];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg border backdrop-blur-md px-3 py-1.5 text-xs font-semibold shadow-sm ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
    const router = useRouter();
    const { isAdmin, isAgent, isLandlord } = useUserRole();
    const isHost = isAgent || isLandlord || isAdmin;

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
            toast.error('Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    }, [page, filter, viewMode]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    async function handleAction() {
        if (!selectedBooking || !actionDialogOpen) return;
        setSubmitting(true);
        try {
            if (actionDialogOpen === 'cancel') {
                await apiClient.cancelBooking(selectedBooking._id, { reason: note });
                toast.success('Booking cancelled.');
            } else if (actionDialogOpen === 'confirm') {
                await apiClient.confirmBooking(selectedBooking._id, { hostNote: note });
                toast.success('Booking confirmed.');
            } else if (actionDialogOpen === 'reject') {
                await apiClient.rejectBooking(selectedBooking._id, { reason: note });
                toast.success('Booking rejected.');
            }
            setActionDialogOpen(null);
            setNote('');
            fetchBookings();
        } catch {
            toast.error(`Could not ${actionDialogOpen} the booking. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    }

    const title = useMemo(() => {
        if (viewMode === 'admin') return 'Global Bookings';
        if (viewMode === 'host') return 'Hosted Bookings';
        return 'My Stays';
    }, [viewMode]);

    const badgeLabel = useMemo(() => {
        if (viewMode === 'admin') return 'Admin View';
        if (viewMode === 'host') return 'Host View';
        return 'Guest View';
    }, [viewMode]);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#FAFAFA]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <main className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-8">

                        {/* ── Header ── */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3.5 mb-2">
                                    <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-100/50 shadow-sm">
                                        <BedDouble className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                                    <Badge className="bg-indigo-100/50 text-indigo-700 border border-indigo-200/50 hover:bg-indigo-100/80 text-xs px-2.5 py-1 rounded-md shadow-sm font-semibold">
                                        {badgeLabel}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                    {viewMode === 'guest' ? 'Manage and review your upcoming travel stays.' : 'Monitor short-term property bookings and guest requests.'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                                {/* Role View Switcher */}
                                {isHost && (
                                    <div className="flex rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-sm p-1 shadow-sm w-full sm:w-auto">
                                        <Button
                                            variant={viewMode === 'guest' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className={cn("h-9 text-xs font-semibold rounded-lg flex-1 sm:flex-none transition-all", viewMode === 'guest' ? "bg-white shadow-sm border border-slate-200/50 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}
                                            onClick={() => { setViewMode('guest'); setPage(1); }}
                                        >
                                            As Guest
                                        </Button>
                                        <Button
                                            variant={viewMode === 'host' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className={cn("h-9 text-xs font-semibold rounded-lg flex-1 sm:flex-none transition-all", viewMode === 'host' ? "bg-white shadow-sm border border-slate-200/50 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}
                                            onClick={() => { setViewMode('host'); setPage(1); }}
                                        >
                                            As Host
                                        </Button>
                                        {isAdmin && (
                                            <Button
                                                variant={viewMode === 'admin' ? 'secondary' : 'ghost'}
                                                size="sm"
                                                className={cn("h-9 text-xs font-semibold rounded-lg flex-1 sm:flex-none transition-all", viewMode === 'admin' ? "bg-indigo-50 shadow-sm border border-indigo-100/50 text-indigo-700 hover:bg-indigo-100/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}
                                                onClick={() => { setViewMode('admin'); setPage(1); }}
                                            >
                                                Admin Mode
                                            </Button>
                                        )}
                                    </div>
                                )}

                                <div className="w-full sm:w-[180px]">
                                    <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-11 w-full bg-white border border-slate-200/60 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all shadow-sm">
                                            <div className="flex items-center">
                                                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                                                <SelectValue placeholder="Filter Status" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                            <SelectItem value="all" className="rounded-lg">All Stays</SelectItem>
                                            {Object.values(BookingStatus).map((s) => (
                                                <SelectItem key={s} value={s} className="rounded-lg">{STATUS_CONFIG[s].label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* ── Content ── */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                                <p className="text-sm font-medium text-slate-500 animate-pulse">Loading bookings data...</p>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-20 text-center shadow-sm">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <BedDouble className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900">No bookings found</h3>
                                <p className="mt-2 text-sm text-slate-500 max-w-sm">
                                    {viewMode === 'guest' ? 'Looks like you don\'t have any upcoming stays booked yet. Start exploring properties to plan your next trip!' : 'We couldn\'t find any reservations matching your current criteria.'}
                                </p>
                                {viewMode === 'guest' && (
                                    <Button className="mt-8 h-12 px-8 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 text-white transition-all hover:-translate-y-0.5" onClick={() => router.push('/properties?listingType=short_term')}>
                                        Browse Short-Term Stays
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {bookings.map((booking) => (
                                    <BookingCard
                                        key={booking._id}
                                        booking={booking}
                                        viewMode={viewMode}
                                        onViewDetail={() => router.push(`/dashboard/bookings/${booking._id}`)}
                                        onAction={(action) => {
                                            setSelectedBooking(booking);
                                            setActionDialogOpen(action);
                                            setNote('');
                                        }}
                                    />
                                ))}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-6 mt-6">
                                        <p className="text-sm text-slate-500 font-medium">
                                            Showing page <span className="font-semibold text-slate-900">{page}</span> of <span className="font-semibold text-slate-900">{totalPages}</span>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" className="h-10 rounded-xl font-semibold border-slate-200" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                                            <Button variant="outline" className="h-10 rounded-xl font-semibold border-slate-200" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </SidebarInset>
            </div>

            {/* ── Action dialog (Cancel/Confirm/Reject) ── */}
            <Dialog open={!!actionDialogOpen} onOpenChange={(open) => !open && setActionDialogOpen(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-8">
                        <DialogHeader className="space-y-4 mb-6 text-left">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center",
                                actionDialogOpen === 'cancel' || actionDialogOpen === 'reject' ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"
                            )}>
                                {actionDialogOpen === 'cancel' && <AlertCircle className="h-7 w-7" />}
                                {actionDialogOpen === 'confirm' && <CheckCircle2 className="h-7 w-7" />}
                                {actionDialogOpen === 'reject' && <XCircle className="h-7 w-7" />}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight capitalize">
                                    {actionDialogOpen} Reservation
                                </DialogTitle>
                                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                                    Are you sure you want to <span className="font-bold text-slate-900">{actionDialogOpen}</span> this booking for{' '}
                                    <span className="font-bold text-slate-900">{selectedBooking?.propertyId?.title}</span>?
                                </p>
                            </div>
                        </DialogHeader>

                        <div className="space-y-3 mb-8">
                            <label className="text-sm font-semibold text-slate-700">
                                {actionDialogOpen === 'confirm' ? 'Add a message to the guest (Optional)' : 'Reason (Optional)'}
                            </label>
                            <Textarea
                                placeholder={actionDialogOpen === 'confirm' ? 'E.g. "Looking forward to hosting you!"' : 'E.g. "We need to cancel due to unforeseen maintenance..."'}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50/80 p-4 focus-visible:ring-indigo-500 focus-visible:bg-white transition-all resize-none shadow-sm"
                            />
                        </div>

                        <DialogFooter className="gap-3 sm:space-x-0 sm:flex-nowrap">
                            <Button variant="outline" className="rounded-xl h-12 w-full sm:w-1/2 font-semibold border-slate-200 hover:bg-slate-50" onClick={() => setActionDialogOpen(null)}>
                                Go Back
                            </Button>
                            <Button
                                className={cn(
                                    "rounded-xl h-12 w-full sm:w-1/2 font-semibold shadow-md text-white transition-all",
                                    actionDialogOpen === 'confirm' ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100" : "bg-red-600 hover:bg-red-700 shadow-red-100"
                                )}
                                onClick={handleAction}
                                disabled={submitting}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {`${actionDialogOpen?.toUpperCase()}`}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}

// ─── Booking card sub-component ───────────────────────────────────────────────

function BookingCard({
    booking, onViewDetail, onAction, viewMode
}: {
    booking: Booking;
    onViewDetail: () => void;
    onAction: (type: 'cancel' | 'confirm' | 'reject') => void;
    viewMode: 'guest' | 'host' | 'admin';
}) {
    const prop = booking.propertyId;
    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));

    const isPending = booking.status === BookingStatus.PENDING;
    const isConfirmed = booking.status === BookingStatus.CONFIRMED;

    const showHostActions = (viewMode === 'host' || viewMode === 'admin') && isPending;
    const canCancel = (viewMode === 'guest' && (isPending || isConfirmed)) ||
        ((viewMode === 'host' || viewMode === 'admin') && isConfirmed);

    return (
        <div className="group relative overflow-hidden flex flex-col sm:flex-row bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
            {/* Image */}
            <div className="relative h-48 sm:h-auto sm:w-64 shrink-0 bg-slate-100 overflow-hidden">
                {prop?.images?.[0]?.url ? (
                    <img src={prop.images[0].url} alt={prop.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                    <div className="flex h-full min-h-[160px] items-center justify-center">
                        <BedDouble className="h-10 w-10 text-slate-300" />
                    </div>
                )}
                <div className="absolute top-4 left-4 sm:hidden">
                    <StatusBadge status={booking.status} />
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col justify-between p-6 sm:p-7 bg-white">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{prop?.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                            {prop?.city && (
                                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                                    <MapPin className="h-4 w-4 text-indigo-400" />{prop.city}
                                </p>
                            )}
                            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                                <Users className="h-4 w-4 text-emerald-500/80" />
                                {viewMode === 'guest' ? <><span className="text-slate-400 font-normal">Host:</span> {booking.hostId?.name}</> : <><span className="text-slate-400 font-normal">Guest:</span> {booking.guestId?.name}</>}
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <StatusBadge status={booking.status} />
                    </div>
                </div>

                <Separator className="my-4 bg-slate-100" />

                {/* Dates + guests */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar className="h-3 w-3 text-indigo-400" /> Dates</p>
                        <p className="text-sm font-semibold text-slate-900">
                            {format(parseISO(booking.checkIn), 'MMM d')} — {format(parseISO(booking.checkOut), 'MMM d')}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="h-3 w-3 text-indigo-400" /> Duration</p>
                        <p className="text-sm font-semibold text-slate-900">{nights} night{nights !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Users className="h-3 w-3 text-indigo-400" /> Party</p>
                        <p className="text-sm font-semibold text-slate-900">{(booking.guests?.adults ?? 1) + (booking.guests?.children ?? 0)} guest{(booking.guests?.adults ?? 1) > 1 || (booking.guests?.children ?? 0) > 0 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto pt-2">
                    <div className="bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-100 w-full sm:w-auto">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Price</p>
                        <p className="text-lg font-bold text-slate-900 -mt-0.5">
                            {booking.priceBreakdown?.totalAmount?.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{booking.currency ?? 'XAF'}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                        {showHostActions && (
                            <>
                                <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                                    onClick={() => onAction('confirm')}>
                                    <Check className="mr-1.5 h-4 w-4" /> Confirm
                                </Button>
                                <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl font-semibold border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors"
                                    onClick={() => onAction('reject')}>
                                    <X className="mr-1.5 h-4 w-4" /> Decline
                                </Button>
                            </>
                        )}

                        {booking.status === BookingStatus.COMPLETED && !booking.guestReviewLeft && viewMode === 'guest' && (
                            <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl font-semibold border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 transition-colors"
                                onClick={() => onViewDetail()}>
                                <Star className="mr-1.5 h-4 w-4 fill-amber-500/20 text-amber-500" /> Review
                            </Button>
                        )}
                        {canCancel && (
                            <Button size="sm" variant="ghost" className="h-10 px-4 rounded-xl font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                onClick={(e) => { e.stopPropagation(); onAction('cancel'); }}>
                                Cancel
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-10 px-4 rounded-xl font-semibold hover:bg-slate-100 text-slate-600 transition-all flex items-center group-hover:text-indigo-600" onClick={onViewDetail}>
                            Details <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}