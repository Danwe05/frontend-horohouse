'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    Calendar, Users, CheckCircle2, XCircle, Clock, Loader2,
    BedDouble, AlertCircle, RotateCcw, Filter, ChevronRight, MapPin,
    Search, CalendarDays, DollarSign, Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Separator } from '@/components/ui/separator';

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string; icon: React.ReactNode }> = {
    [BookingStatus.PENDING]: { label: 'Pending Review', className: 'bg-amber-100/50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> },
    [BookingStatus.CONFIRMED]: { label: 'Confirmed', className: 'bg-emerald-100/50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
    [BookingStatus.REJECTED]: { label: 'Declined', className: 'bg-red-100/50 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" /> },
    [BookingStatus.CANCELLED]: { label: 'Cancelled', className: 'bg-slate-100/50 text-slate-600 border-slate-200', icon: <RotateCcw className="h-3 w-3" /> },
    [BookingStatus.COMPLETED]: { label: 'Completed', className: 'bg-blue-100/50 text-blue-700 border-blue-200', icon: <CheckCircle2 className="h-3 w-3" /> },
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
            <div className="flex min-h-screen w-full bg-[#FAFAFA]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <main className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-8">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Bookings Management</h1>
                            <p className="text-sm text-slate-500 mt-2 hover:text-slate-700 transition-colors">Manage your property reservations, track revenue, and monitor guest stays.</p>
                        </div>

                        {/* ── Dashboard Stats ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Total Revenue', value: `${stats.totalRevenue.toLocaleString()} XAF`, icon: DollarSign, color: 'text-slate-900', bg: 'bg-slate-100', iconColor: 'text-slate-700' },
                                { label: 'Pending Requests', value: stats.pendingCount, icon: Inbox, color: 'text-amber-700', bg: 'bg-amber-100/50', iconColor: 'text-amber-600' },
                                { label: 'Confirmed Stays', value: stats.confirmedCount, icon: CalendarDays, color: 'text-emerald-700', bg: 'bg-emerald-100/50', iconColor: 'text-emerald-600' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 relative overflow-hidden group">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                            <p className={`text-3xl font-semibold mt-2 tracking-tight ${stat.color}`}>{stat.value}</p>
                                        </div>
                                        <div className={`p-4 rounded-xl ${stat.bg} transition-colors group-hover:bg-opacity-80`}>
                                            <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                        </div>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-500">
                                        <stat.icon className="h-32 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Control Bar ── */}
                        <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sticky top-4 z-20">
                            <div className="relative w-full md:max-w-md flex-1 group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder="Search by guest or property name..."
                                    className="pl-10 h-11 w-full bg-slate-50/50 border-transparent hover:border-slate-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 rounded-xl transition-all shadow-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
                                    <SelectTrigger className="h-11 w-full md:w-[180px] bg-slate-50/50 border-transparent hover:border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all shadow-none">
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

                        {/* ── Booking Cards ── */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                                <p className="text-sm font-medium text-slate-500 animate-pulse">Loading reservations...</p>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-20 text-center shadow-sm">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <BedDouble className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900">No reservations found</h3>
                                <p className="mt-2 text-slate-500 max-w-sm">We couldn't find any bookings matching your current filters. Try adjusting your search criteria.</p>
                                <Button variant="outline" className="mt-6 rounded-xl font-medium border-slate-200 hover:bg-slate-50 h-11 px-6 transition-all" onClick={() => { setFilter('all'); setSearchQuery(''); }}>
                                    Clear all filters
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredBookings.map((booking) => {
                                    const prop = booking.propertyId;
                                    const guest = booking.guestId;
                                    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG[BookingStatus.PENDING];
                                    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));

                                    return (
                                        <div key={booking._id} className="group flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 overflow-hidden">
                                            {/* Left side: Image & Status */}
                                            <div className="relative h-56 md:h-auto md:w-72 shrink-0 bg-slate-100 overflow-hidden">
                                                {prop?.images?.[0]?.url ? (
                                                    <img src={prop.images[0].url} alt={prop.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <BedDouble className="h-10 w-10 text-slate-300" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <Badge className={`${status.className} border backdrop-blur-md px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Right side: Content */}
                                            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-white">
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{prop?.title}</h3>
                                                        <div className="flex items-center text-sm text-slate-500 mt-2 font-medium">
                                                            <MapPin className="mr-1.5 h-4 w-4 text-indigo-400" />
                                                            {prop?.city || 'Location not specified'}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-100 text-right">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payout</p>
                                                            <p className="text-xl font-bold text-slate-900 mt-1">
                                                                {booking.priceBreakdown?.totalAmount?.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{booking.currency ?? 'XAF'}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Separator className="my-6 bg-slate-100" />

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar className="h-3 w-3 text-indigo-400" /> Check-in</p>
                                                        <p className="text-sm font-semibold text-slate-900">{format(parseISO(booking.checkIn), 'MMM d, yyyy')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar className="h-3 w-3 text-indigo-400" /> Check-out</p>
                                                        <p className="text-sm font-semibold text-slate-900">{format(parseISO(booking.checkOut), 'MMM d, yyyy')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Users className="h-3 w-3 text-indigo-400" /> Guest</p>
                                                        <p className="text-sm font-semibold text-slate-900">{guest?.name || 'Anonymous'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="h-3 w-3 text-indigo-400" /> Duration</p>
                                                        <p className="text-sm font-semibold text-slate-900">{nights} night{nights !== 1 && 's'} · {(booking.guests?.adults ?? 1)} adult{(booking.guests?.adults ?? 1) !== 1 && 's'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto pt-2">
                                                    <div className="flex items-center gap-3">
                                                        {booking.status === BookingStatus.PENDING && (
                                                            <>
                                                                <Button variant="outline" className="h-10 px-5 rounded-xl border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-sm font-semibold transition-all" onClick={() => setActionDialog({ open: true, type: 'reject', booking })}>
                                                                    Decline
                                                                </Button>
                                                                <Button className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition-all hover:-translate-y-0.5" onClick={() => setActionDialog({ open: true, type: 'confirm', booking })}>
                                                                    Accept Request
                                                                </Button>
                                                            </>
                                                        )}
                                                        {booking.status === BookingStatus.CONFIRMED && (
                                                            <Button variant="secondary" className="h-10 px-5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold transition-all border border-indigo-100" onClick={() => handleComplete(booking)}>
                                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Completed
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Button variant="ghost" className="h-10 px-4 rounded-xl hover:bg-slate-100 text-slate-600 font-semibold text-sm transition-all flex items-center gap-1.5 hover:-translate-y-0.5" onClick={() => router.push(`/dashboard/host/bookings/${booking._id}`)}>
                                                        Details <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

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

            {/* ── Action Dialog ── */}
            <Dialog open={actionDialog.open} onOpenChange={(o) => !o && setActionDialog({ ...actionDialog, open: false })}>
                <DialogContent className="sm:max-w-md rounded-2xl border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-8">
                        <DialogHeader className="space-y-4 mb-6 text-left">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${actionDialog.type === 'confirm' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
                                {actionDialog.type === 'confirm' ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {actionDialog.type === 'confirm' ? 'Accept Reservation' : 'Decline Request'}
                                </DialogTitle>
                                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                                    {actionDialog.type === 'confirm' ? 'You are about to accept the reservation request from ' : 'You are about to decline the reservation request from '}
                                    <span className="font-bold text-slate-900">{actionDialog.booking?.guestId?.name}</span>.
                                </p>
                            </div>
                        </DialogHeader>

                        <div className="space-y-3 mb-8">
                            <label className="text-sm font-semibold text-slate-700">
                                {actionDialog.type === 'confirm' ? 'Add a welcome message (Optional)' : 'Reason for declining (Optional)'}
                            </label>
                            <Textarea
                                placeholder={actionDialog.type === 'confirm' ? 'E.g. "Looking forward to hosting you. Here are some instructions..."' : 'E.g. "Unfortunately, the property is unavailable during these dates..."'}
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50/80 p-4 focus-visible:ring-indigo-500 focus-visible:bg-white transition-all resize-none shadow-sm"
                            />
                        </div>

                        <DialogFooter className="gap-3 sm:space-x-0 sm:flex-nowrap">
                            <Button variant="outline" className="rounded-xl h-12 w-full sm:w-1/2 font-semibold border-slate-200 hover:bg-slate-50" onClick={() => setActionDialog({ ...actionDialog, open: false })}>
                                Cancel
                            </Button>
                            <Button
                                className={`rounded-xl h-12 w-full sm:w-1/2 font-semibold shadow-md ${actionDialog.type === 'confirm' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 text-white' : 'bg-red-600 hover:bg-red-700 shadow-red-100 text-white'}`}
                                onClick={handleAction}
                                disabled={actioning}
                            >
                                {actioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {actionDialog.type === 'confirm' ? 'Accept Request' : 'Decline Request'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}