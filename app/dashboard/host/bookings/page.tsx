'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    Calendar, Users, CheckCircle2, XCircle, Clock, Loader2,
    BedDouble, AlertCircle, RotateCcw, Filter, ChevronRight, MapPin,
    Search, CalendarDays, DollarSign, Inbox, LayoutGrid, List, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Separator } from '@/components/ui/separator';

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string; icon: React.ReactNode }> = {
    [BookingStatus.PENDING]: { label: 'Pending review', className: 'bg-[#F7F7F7] text-[#222222] border-[#DDDDDD]', icon: <Clock className="h-3.5 w-3.5" /> },
    [BookingStatus.CONFIRMED]: { label: 'Confirmed', className: 'bg-white text-[#008A05] border-[#008A05]/30', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    [BookingStatus.REJECTED]: { label: 'Declined', className: 'bg-[#FFF8F8] text-[#E50000] border-[#FFDFDF]', icon: <XCircle className="h-3.5 w-3.5" /> },
    [BookingStatus.CANCELLED]: { label: 'Cancelled', className: 'bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]', icon: <RotateCcw className="h-3.5 w-3.5" /> },
    [BookingStatus.COMPLETED]: { label: 'Completed', className: 'bg-[#F7F7F7] text-[#222222] border-[#DDDDDD]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    [BookingStatus.NO_SHOW]: { label: 'No show', className: 'bg-[#F7F7F7] text-[#717171] border-[#DDDDDD]', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

export default function HostBookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionDialog, setActionDialog] = useState<{
        open: boolean; type: 'confirm' | 'reject'; booking: Booking | null;
    }>({ open: false, type: 'confirm', booking: null });
    const [actionNote, setActionNote] = useState('');
    const [actioning, setActioning] = useState(false);
    const [layoutMode, setLayoutMode] = useState<'card' | 'table'>('table');

    // Stats Calculation
    const stats = useMemo(() => {
        const totalRevenue = bookings.reduce((acc, curr) => acc + (curr.priceBreakdown?.totalAmount || 0), 0);
        const pendingCount = bookings.filter(b => b.status === BookingStatus.PENDING).length;
        const confirmedCount = bookings.filter(b => b.status === BookingStatus.CONFIRMED).length;
        return { totalRevenue, pendingCount, confirmedCount };
    }, [bookings]);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.getHostBookings({
                page, limit: 10,
                status: filter === 'all' ? undefined : filter,
            });
            setBookings(res.bookings ?? []);
            setTotalPages(res.totalPages ?? 1);
        } catch {
            toast.error('Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const filteredBookings = bookings.filter(b =>
        b.guestId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.propertyId?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    async function handleAction() {
        if (!actionDialog.booking) return;
        setActioning(true);
        try {
            if (actionDialog.type === 'confirm') {
                await apiClient.confirmBooking(actionDialog.booking._id, { hostNote: actionNote });
                toast.success('Reservation confirmed!');
            } else {
                await apiClient.rejectBooking(actionDialog.booking._id, { reason: actionNote });
                toast.success('Reservation declined.');
            }
            setActionDialog({ open: false, type: 'confirm', booking: null });
            setActionNote('');
            fetchBookings();
        } catch {
            toast.error('Action failed.');
        } finally {
            setActioning(false);
        }
    }

    async function handleComplete(booking: Booking) {
        try {
            await apiClient.completeBooking(booking._id);
            toast.success('Stay marked as completed.');
            fetchBookings();
        } catch {
            toast.error('Failed to update status.');
        }
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-white">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />
                    <main className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">

                        {/* ── Header ── */}
                        <div>
                            <h1 className="text-[32px] font-semibold tracking-tight text-[#222222]">Reservations</h1>
                            <p className="text-[16px] text-[#717171] mt-1">Manage your property reservations, track revenue, and monitor guest stays.</p>
                        </div>

                        {/* ── Dashboard Stats ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Total earnings', value: `${stats.totalRevenue.toLocaleString()} XAF`, icon: DollarSign },
                                { label: 'Pending requests', value: stats.pendingCount, icon: Inbox },
                                { label: 'Confirmed stays', value: stats.confirmedCount, icon: CalendarDays },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-[#DDDDDD] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
                                    <div className="flex justify-between items-start mb-4 text-[#222222]">
                                        <p className="text-[14px] font-medium text-[#717171]">{stat.label}</p>
                                        <stat.icon className="h-6 w-6 stroke-[1.5]" />
                                    </div>
                                    <p className="text-[32px] font-semibold text-[#222222] tracking-tight leading-none">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Control Bar ── */}
                        <div className="bg-white p-2.5 rounded-2xl border border-[#DDDDDD] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sticky top-4 z-30">
                            <div className="relative w-full flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#717171] stroke-[2]" />
                                <Input
                                    placeholder="Search by guest or property name..."
                                    className="pl-11 h-12 w-full bg-[#F7F7F7] border-none hover:bg-[#EBEBEB] text-[#222222] placeholder:text-[#717171] focus-visible:ring-1 focus-visible:ring-[#222222] rounded-xl text-[15px] transition-colors"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Separator orientation="vertical" className="hidden md:block h-12 bg-[#DDDDDD]" />

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex bg-[#F7F7F7] p-1 rounded-xl border border-[#DDDDDD] shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-10 w-10 p-0 rounded-lg", layoutMode === 'card' ? "bg-white text-[#222222] shadow-sm" : "text-[#717171] hover:text-[#222222]")}
                                        onClick={() => setLayoutMode('card')}
                                    >
                                        <LayoutGrid className="h-4 w-4 stroke-[2]" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-10 w-10 p-0 rounded-lg", layoutMode === 'table' ? "bg-white text-[#222222] shadow-sm" : "text-[#717171] hover:text-[#222222]")}
                                        onClick={() => setLayoutMode('table')}
                                    >
                                        <List className="h-4 w-4 stroke-[2]" />
                                    </Button>
                                </div>
                                <div className="w-full md:w-[180px]">
                                    <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-12 w-full bg-white border border-[#DDDDDD] text-[#222222] text-[15px] font-medium hover:border-blue-600 focus:ring-0 focus:ring-offset-0 rounded-xl transition-colors">
                                            <div className="flex items-center">
                                                <Filter className="h-4 w-4 mr-2 text-[#717171] stroke-[2]" />
                                                <SelectValue placeholder="Filter status" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-[#DDDDDD] shadow-lg">
                                            <SelectItem value="all" className="focus:bg-[#F7F7F7] cursor-pointer text-[14px]">All stays</SelectItem>
                                            {Object.values(BookingStatus).map((s) => (
                                                <SelectItem key={s} value={s} className="focus:bg-[#F7F7F7] cursor-pointer text-[14px]">{STATUS_CONFIG[s].label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* ── Booking Cards ── */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-[#222222]" />
                                <p className="text-[15px] font-medium text-[#717171] animate-pulse">Loading reservations...</p>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F7F7F7] border border-[#DDDDDD] py-24 px-6 text-center">
                                <div className="h-16 w-16 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <BedDouble className="h-7 w-7 text-[#222222] stroke-[1.5]" />
                                </div>
                                <h3 className="text-[22px] font-semibold text-[#222222] mb-2">No reservations found</h3>
                                <p className="text-[16px] text-[#717171] max-w-md">We couldn't find any bookings matching your current filters. Try adjusting your search criteria.</p>
                                <Button variant="outline" className="mt-8 h-12 px-8 rounded-lg font-semibold text-[15px] border-blue-600 text-[#222222] hover:bg-blue-600 hover:text-white transition-colors" onClick={() => { setFilter('all'); setSearchQuery(''); }}>
                                    Clear all filters
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {layoutMode === 'card' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {filteredBookings.map((booking) => {
                                            const prop = booking.propertyId;
                                            const guest = booking.guestId;
                                            const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG[BookingStatus.PENDING];
                                            const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));

                                            return (
                                                <div key={booking._id} className="flex flex-col bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden hover:shadow-md transition-shadow duration-300">
                                                    <div className="flex flex-col sm:flex-row h-full">
                                                        {/* Image Area */}
                                                        <div className="relative h-48 sm:h-auto sm:w-[220px] shrink-0 bg-[#F7F7F7] border-b sm:border-b-0 sm:border-r border-[#DDDDDD]">
                                                            {prop?.images?.[0]?.url ? (
                                                                <img src={prop.images[0].url} alt={prop.title} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center">
                                                                    <BedDouble className="h-8 w-8 text-[#DDDDDD]" />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-4 left-4">
                                                                <Badge className={`${status.className} border px-2.5 py-1 text-[12px] font-semibold rounded-md flex items-center gap-1.5`}>
                                                                    {status.icon}
                                                                    {status.label}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Content Area */}
                                                        <div className="flex flex-col flex-1 p-5 sm:p-6 justify-between">
                                                            <div>
                                                                <h3 className="text-[18px] font-semibold text-[#222222] mb-1 line-clamp-1">{prop?.title}</h3>
                                                                <p className="flex items-center text-[14px] text-[#717171] mb-5">
                                                                    {prop?.city || 'Location not specified'} • {guest?.name || 'Anonymous'}
                                                                </p>

                                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                                    <div>
                                                                        <p className="text-[12px] font-medium text-[#717171] mb-0.5">Dates</p>
                                                                        <p className="text-[15px] font-medium text-[#222222]">{format(parseISO(booking.checkIn), 'MMM d')} - {format(parseISO(booking.checkOut), 'MMM d')}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[12px] font-medium text-[#717171] mb-0.5">Duration</p>
                                                                        <p className="text-[15px] font-medium text-[#222222]">{nights} night{nights !== 1 && 's'} • {(booking.guests?.adults ?? 1)} guest{(booking.guests?.adults ?? 1) !== 1 && 's'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="pt-5 border-t border-[#DDDDDD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
                                                                <div>
                                                                    <p className="text-[12px] font-medium text-[#717171] mb-0.5">Total payout</p>
                                                                    <p className="text-[16px] font-semibold text-[#222222]">
                                                                        {booking.priceBreakdown?.totalAmount?.toLocaleString()} <span className="font-normal">{booking.currency ?? 'XAF'}</span>
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                                    {booking.status === BookingStatus.PENDING && (
                                                                        <>
                                                                            <Button size="sm" variant="outline" className="flex-1 sm:flex-none h-10 px-4 rounded-lg font-semibold text-[14px] border-[#DDDDDD] text-[#E50000] hover:bg-[#FFF8F8] hover:border-[#E50000]/30" onClick={() => setActionDialog({ open: true, type: 'reject', booking })}>
                                                                                Decline
                                                                            </Button>
                                                                            <Button size="sm" className="flex-1 sm:flex-none h-10 px-4 rounded-lg font-semibold text-[14px] bg-blue-600 text-white hover:bg-blue-700" onClick={() => setActionDialog({ open: true, type: 'confirm', booking })}>
                                                                                Accept
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    {booking.status === BookingStatus.CONFIRMED && (
                                                                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none h-10 px-4 rounded-lg font-semibold text-[14px] border-blue-600 text-[#222222] hover:bg-[#F7F7F7]" onClick={() => handleComplete(booking)}>
                                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark complete
                                                                        </Button>
                                                                    )}
                                                                    {booking.status !== BookingStatus.PENDING && (
                                                                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none h-10 px-4 rounded-lg font-semibold text-[14px] border-[#DDDDDD] text-[#222222] hover:border-blue-600 hover:bg-[#F7F7F7]" onClick={() => router.push(`/dashboard/host/bookings/${booking._id}`)}>
                                                                            Details
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden w-full">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[900px]">
                                                <thead className="bg-[#F7F7F7] border-b border-[#DDDDDD]">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Property</th>
                                                        <th className="px-6 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Guest</th>
                                                        <th className="px-6 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Dates</th>
                                                        <th className="px-6 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Total payout</th>
                                                        <th className="px-6 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-4 text-[12px] font-semibold text-[#717171] uppercase tracking-wider text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#DDDDDD]">
                                                    {filteredBookings.map((booking) => (
                                                        <HostBookingTableRow
                                                            key={booking._id}
                                                            booking={booking}
                                                            onViewDetail={() => router.push(`/dashboard/host/bookings/${booking._id}`)}
                                                            onAction={(type, booking) => setActionDialog({ open: true, type, booking })}
                                                            onComplete={() => handleComplete(booking)}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between pt-6 mt-8 border-t border-[#DDDDDD] gap-4">
                                        <p className="text-[15px] text-[#717171] font-medium order-2 sm:order-1">
                                            Showing page <span className="text-[#222222] font-semibold">{page}</span> of <span className="text-[#222222] font-semibold">{totalPages}</span>
                                        </p>
                                        <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto">
                                            <Button variant="outline" className="flex-1 sm:flex-none h-11 px-5 rounded-lg font-semibold text-[15px] border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] hover:border-blue-600" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                                Previous
                                            </Button>
                                            <Button variant="outline" className="flex-1 sm:flex-none h-11 px-5 rounded-lg font-semibold text-[15px] border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] hover:border-blue-600" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </SidebarInset>
            </div>

            {/* ── Action Dialog ── */}
            <Dialog open={actionDialog.open} onOpenChange={(o) => !o && setActionDialog({ ...actionDialog, open: false })}>
                <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] mx-auto rounded-2xl border-[#DDDDDD] p-0 overflow-hidden shadow-2xl">
                    <div className="p-8">
                        <DialogHeader className="space-y-4 mb-6 text-left">
                            <div className="w-12 h-12 bg-[#F7F7F7] border border-[#DDDDDD] rounded-full flex items-center justify-center">
                                {actionDialog.type === 'confirm' ? <CheckCircle2 className="h-6 w-6 text-[#222222] stroke-[1.5]" /> : <AlertCircle className="h-6 w-6 text-[#222222] stroke-[1.5]" />}
                            </div>
                            <div>
                                <DialogTitle className="text-[22px] font-semibold text-[#222222] tracking-tight">
                                    {actionDialog.type === 'confirm' ? 'Accept reservation' : 'Decline request'}
                                </DialogTitle>
                                <p className="text-[#717171] mt-2 text-[15px] leading-relaxed">
                                    {actionDialog.type === 'confirm' ? 'You are about to accept the reservation request from ' : 'You are about to decline the reservation request from '}
                                    <span className="font-semibold text-[#222222]">{actionDialog.booking?.guestId?.name}</span>.
                                </p>
                            </div>
                        </DialogHeader>

                        <div className="space-y-3 mb-8">
                            <label className="text-[14px] font-semibold text-[#222222]">
                                {actionDialog.type === 'confirm' ? 'Welcome message (optional)' : 'Reason for declining (optional)'}
                            </label>
                            <Textarea
                                placeholder={actionDialog.type === 'confirm' ? 'E.g. "Looking forward to hosting you. Here are some instructions..."' : 'E.g. "Unfortunately, the property is unavailable during these dates..."'}
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                className="min-h-[120px] rounded-xl border-[#DDDDDD] bg-white p-4 text-[15px] text-[#222222] placeholder:text-[#717171] focus-visible:ring-1 focus-visible:ring-[#222222] focus-visible:border-blue-600 resize-none"
                            />
                        </div>

                        <DialogFooter className="gap-3 sm:space-x-0 sm:flex-nowrap mt-4">
                            <Button variant="outline" className="rounded-lg h-12 w-full sm:w-1/2 text-[15px] font-semibold border-blue-600 text-[#222222] hover:bg-[#F7F7F7]" onClick={() => setActionDialog({ ...actionDialog, open: false })}>
                                Cancel
                            </Button>
                            <Button
                                className={cn(
                                    "rounded-lg h-12 w-full sm:w-1/2 text-[15px] font-semibold text-white transition-colors",
                                    actionDialog.type === 'confirm' ? "bg-blue-600 hover:bg-blue-700" : "blue-blue-600 blue-blue-700"
                                )}
                                onClick={handleAction}
                                disabled={actioning}
                            >
                                {actioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {actionDialog.type === 'confirm' ? 'Accept request' : 'Decline request'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}

function HostBookingTableRow({
    booking, onViewDetail, onAction, onComplete
}: {
    booking: Booking;
    onViewDetail: () => void;
    onAction: (type: 'confirm' | 'reject', booking: Booking) => void;
    onComplete: () => void;
}) {
    const prop = booking.propertyId;
    const guest = booking.guestId;
    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG[BookingStatus.PENDING];
    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));

    return (
        <tr className="hover:bg-[#F7F7F7] transition-colors group">
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-16 bg-[#F7F7F7] border border-[#DDDDDD] rounded-lg overflow-hidden shrink-0">
                        {prop?.images?.[0]?.url ? (
                            <img src={prop.images[0].url} alt={prop?.title} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <BedDouble className="h-5 w-5 text-[#DDDDDD]" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-[15px] text-[#222222] truncate max-w-[180px] lg:max-w-xs">{prop?.title}</p>
                        <p className="text-[13px] text-[#717171] mt-0.5 truncate max-w-[150px]">{prop?.city || 'Location not specified'}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <p className="font-medium text-[15px] text-[#222222]">{guest?.name || 'Anonymous'}</p>
                <p className="text-[13px] text-[#717171] mt-0.5">
                    {(booking.guests?.adults ?? 1) + (booking.guests?.children ?? 0)} guest{(booking.guests?.adults ?? 1) > 1 || (booking.guests?.children ?? 0) > 0 ? 's' : ''}
                </p>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <p className="font-medium text-[15px] text-[#222222]">{format(parseISO(booking.checkIn), 'MMM d, yyyy')}</p>
                <p className="text-[13px] text-[#717171] mt-0.5">
                    {nights} night{nights !== 1 ? 's' : ''} (until {format(parseISO(booking.checkOut), 'MMM d')})
                </p>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <p className="font-semibold text-[15px] text-[#222222]">
                    {booking.priceBreakdown?.totalAmount?.toLocaleString()} <span className="text-[13px] text-[#717171] font-normal">{booking.currency ?? 'XAF'}</span>
                </p>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-semibold ${status.className}`}>
                    {status.icon}
                    {status.label}
                </span>
            </td>
            <td className="px-6 py-5 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                    {booking.status === BookingStatus.PENDING && (
                        <>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-[#222222] border border-[#DDDDDD] hover:border-blue-600 hover:bg-white rounded-full" onClick={(e) => { e.stopPropagation(); onAction('confirm', booking); }} title="Accept">
                                <Check className="h-4 w-4 stroke-[2]" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-[#E50000] border border-[#DDDDDD] hover:border-[#E50000] hover:bg-[#FFF8F8] rounded-full" onClick={(e) => { e.stopPropagation(); onAction('reject', booking); }} title="Decline">
                                <X className="h-4 w-4 stroke-[2]" />
                            </Button>
                        </>
                    )}
                    {booking.status === BookingStatus.CONFIRMED && (
                        <Button size="sm" variant="outline" className="h-9 px-4 rounded-lg text-[13px] font-semibold border-blue-600 text-[#222222] hover:bg-[#F7F7F7]" onClick={(e) => { e.stopPropagation(); onComplete(); }}>
                            Mark complete
                        </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-9 px-4 rounded-lg text-[13px] font-semibold border-[#DDDDDD] text-[#222222] hover:border-blue-600 hover:bg-[#F7F7F7]" onClick={onViewDetail}>
                        Details
                    </Button>
                </div>
            </td>
        </tr>
    );
}