'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    Calendar, MapPin, Users, Clock, CheckCircle2,
    XCircle, RotateCcw, Loader2, ArrowLeft,
    Phone, Mail, Copy, MessageCircle, AlertCircle, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
    [BookingStatus.PENDING]: { label: 'Awaiting Your Review', color: 'text-amber-700', bg: 'bg-amber-100/50' },
    [BookingStatus.CONFIRMED]: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-100/50' },
    [BookingStatus.REJECTED]: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-100/50' },
    [BookingStatus.CANCELLED]: { label: 'Cancelled by Guest', color: 'text-slate-600', bg: 'bg-slate-100/50' },
    [BookingStatus.COMPLETED]: { label: 'Stay Completed', color: 'text-blue-700', bg: 'bg-blue-100/50' },
    [BookingStatus.NO_SHOW]: { label: 'No Show', color: 'text-orange-700', bg: 'bg-orange-100/50' },
};

export default function HostBookingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'confirm' | 'reject' | null }>({ open: false, type: null });
    const [actionNote, setActionNote] = useState('');
    const [actioning, setActioning] = useState(false);

    useEffect(() => {
        fetchBooking();
    }, [id]);

    const fetchBooking = async () => {
        try {
            const res = await apiClient.getBookingById(id);
            setBooking(res);
        } catch {
            toast.error('Could not load booking details.');
        } finally {
            setLoading(false);
        }
    };

    const copyId = () => {
        navigator.clipboard.writeText(id);
        toast.success('Booking ID copied');
    };

    const handleAction = async () => {
        if (!booking || !actionDialog.type) return;
        setActioning(true);
        try {
            if (actionDialog.type === 'confirm') {
                await apiClient.confirmBooking(booking._id, { hostNote: actionNote });
                toast.success('Reservation confirmed!');
            } else {
                await apiClient.rejectBooking(booking._id, { reason: actionNote });
                toast.success('Reservation declined.');
            }
            setActionDialog({ open: false, type: null });
            setActionNote('');
            fetchBooking();
        } catch {
            toast.error('Action failed. Please try again.');
        } finally {
            setActioning(false);
        }
    };

    const handleComplete = async () => {
        if (!booking) return;
        try {
            await apiClient.completeBooking(booking._id);
            toast.success('Stay marked as completed.');
            fetchBooking();
        } catch {
            toast.error('Failed to update status.');
        }
    };

    if (loading) return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent"><NavDash /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500/20" /></div></SidebarInset>
            </div>
        </SidebarProvider>
    );

    if (!booking) return <div className="p-20 text-center">Booking not found.</div>;

    const prop = booking.propertyId;
    const guest = typeof booking.guestId === 'object' ? booking.guestId : null;
    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));
    const statusInfo = STATUS_CONFIG[booking.status] || STATUS_CONFIG[BookingStatus.PENDING];

    // Assuming a 10% platform fee for the host for display purposes. 
    // In reality, this should come directly from the backend booking.priceBreakdown if available.
    const serviceFeePercent = 0.10;
    const expectedPayout = booking.priceBreakdown?.subtotal
        ? booking.priceBreakdown.subtotal * (1 - serviceFeePercent)
        : (booking.priceBreakdown?.totalAmount || 0) * (1 - serviceFeePercent);
    const platformFee = (booking.priceBreakdown?.subtotal || booking.priceBreakdown?.totalAmount || 0) - expectedPayout;

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />

                    <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
                        {/* ── Top Navigation & ID ── */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" className="rounded-2xl bg-white border border-slate-200 shadow-sm" onClick={() => router.push('/dashboard/host/bookings')}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Reservation</h1>
                                    <button onClick={copyId} className="group flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-indigo-600 transition-colors">
                                        ID: {booking._id} <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={`${statusInfo.bg} ${statusInfo.color} border-none px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]`}>
                                    {statusInfo.label}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* ── LEFT COLUMN: Guest & Stay Details ── */}
                            <div className="lg:col-span-2 space-y-8">

                                {/* Guest Card */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm p-8">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Guest Profile</h3>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                        <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-black text-indigo-600 shrink-0">
                                            {guest?.name?.[0] || 'G'}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h2 className="text-3xl font-black text-slate-900">{guest?.name || 'Anonymous Guest'}</h2>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                {guest?.email && (
                                                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                                        <Mail className="h-4 w-4 text-slate-400" /> {guest.email}
                                                    </span>
                                                )}
                                                {guest?.phoneNumber && (
                                                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                                        <Phone className="h-4 w-4 text-slate-400" /> {guest.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                                            <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
                                                <MessageCircle className="h-4 w-4 mr-2" /> Message Guest
                                            </Button>
                                            <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
                                                <ShieldCheck className="h-4 w-4 mr-2 text-emerald-500" /> View ID Verification
                                            </Button>
                                        </div>
                                    </div>
                                    {booking.guestNote && (
                                        <div className="mt-8 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Message from Guest</p>
                                            <p className="text-slate-700 font-medium italic">"{booking.guestNote}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Stay & Property Details */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Stay Details</h3>

                                    <div className="flex items-center gap-4 mb-8 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="h-16 w-16 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                                            {prop?.images?.[0]?.url && <img src={prop.images[0].url} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{prop?.title}</p>
                                            <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {prop?.address}, {prop?.city}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Check-in</p>
                                            <p className="font-bold text-slate-900">{format(parseISO(booking.checkIn), 'MMM d, yyyy')}</p>
                                            <p className="text-xs text-slate-500">{prop?.shortTermAmenities?.checkInTime || '14:00'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Check-out</p>
                                            <p className="font-bold text-slate-900">{format(parseISO(booking.checkOut), 'MMM d, yyyy')}</p>
                                            <p className="text-xs text-slate-500">{prop?.shortTermAmenities?.checkOutTime || '11:00'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Guests</p>
                                            <p className="font-bold text-slate-900">{booking.guests.adults} Adults</p>
                                            {booking.guests.children > 0 && <p className="text-xs text-slate-500">{booking.guests.children} Children</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Duration</p>
                                            <p className="font-bold text-slate-900">{nights} Nights</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── RIGHT COLUMN: Actions & Payout ── */}
                            <div className="space-y-6 lg:sticky lg:top-8 self-start">

                                {/* Actions Card */}
                                <div className="bg-white rounded-[2.5rem] border-2 border-slate-900 p-8 shadow-2xl shadow-indigo-100">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Host Actions</h3>

                                    <div className="space-y-3">
                                        {booking.status === BookingStatus.PENDING && (
                                            <>
                                                <Button
                                                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100"
                                                    onClick={() => setActionDialog({ open: true, type: 'confirm' })}
                                                >
                                                    <CheckCircle2 className="h-5 w-5 mr-2" /> Accept Request
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-14 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-black text-lg"
                                                    onClick={() => setActionDialog({ open: true, type: 'reject' })}
                                                >
                                                    <XCircle className="h-5 w-5 mr-2" /> Decline Request
                                                </Button>
                                            </>
                                        )}

                                        {booking.status === BookingStatus.CONFIRMED && (
                                            <Button
                                                className="w-full h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-black text-lg"
                                                onClick={handleComplete}
                                            >
                                                <CheckCircle2 className="h-5 w-5 mr-2" /> Mark Stay Completed
                                            </Button>
                                        )}

                                        {[BookingStatus.COMPLETED, BookingStatus.REJECTED, BookingStatus.CANCELLED].includes(booking.status) && (
                                            <div className="py-4 text-center rounded-2xl bg-slate-50 border border-slate-100">
                                                <p className="text-sm font-bold text-slate-500">No actions available.</p>
                                                <p className="text-xs text-slate-400 mt-1">This booking is {booking.status.toLowerCase()}.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payout Summary */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Expected Payout</h3>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-sm font-bold">
                                            <span className="text-slate-500">{booking.priceBreakdown?.pricePerNight?.toLocaleString() ?? 0} x {nights} nights</span>
                                            <span className="text-slate-900">{(booking.priceBreakdown?.subtotal ?? 0).toLocaleString()} {booking.currency}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold">
                                            <span className="text-slate-500">HoroHouse Fee (10%)</span>
                                            <span className="text-red-500">-{platformFee.toLocaleString()} {booking.currency}</span>
                                        </div>
                                        <Separator className="bg-slate-100" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-black text-slate-900">Your Payout</span>
                                            <span className="text-2xl font-black text-emerald-600 border-b-2 border-emerald-200">
                                                {expectedPayout.toLocaleString()} {booking.currency}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider ${booking.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <ShieldCheck className="h-4 w-4" /> Guest Payment: {booking.paymentStatus === 'paid' ? 'Secured' : 'Pending'}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </div>

            {/* ── Action Dialog ── */}
            <Dialog open={actionDialog.open} onOpenChange={(o) => (!o || !actioning) && setActionDialog({ open: false, type: null })}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-none p-0 overflow-hidden shadow-2xl">
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
                                    <span className="font-bold text-slate-900">{guest?.name}</span>.
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
                            <Button variant="outline" className="rounded-xl h-12 w-full sm:w-1/2 font-semibold border-slate-200 hover:bg-slate-50" onClick={() => setActionDialog({ open: false, type: null })}>
                                Cancel
                            </Button>
                            <Button
                                className={`rounded-xl h-12 w-full sm:w-1/2 font-semibold shadow-md ${actionDialog.type === 'confirm' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 text-white' : 'bg-red-600 hover:bg-red-700 shadow-red-100 text-white'}`}
                                onClick={handleAction}
                                disabled={actioning}
                            >
                                {actioning ? <Loader2 className="h-5 w-5 animate-spin" /> : (actionDialog.type === 'confirm' ? 'Accept Request' : 'Decline Request')}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

        </SidebarProvider>
    );
}
