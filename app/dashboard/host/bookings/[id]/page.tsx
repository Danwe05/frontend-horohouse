'use client';

import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
    [BookingStatus.PENDING]: { label: 'Awaiting your review', color: 'text-[#222222]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]' },
    [BookingStatus.CONFIRMED]: { label: 'Confirmed', color: 'text-[#008A05]', bg: 'bg-[#ECFDF5] border border-[#008A05]/30' },
    [BookingStatus.REJECTED]: { label: 'Declined', color: 'text-[#E50000]', bg: 'bg-[#FFF8F8] border border-[#FFDFDF]' },
    [BookingStatus.CANCELLED]: { label: 'Cancelled by guest', color: 'text-[#717171]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]' },
    [BookingStatus.COMPLETED]: { label: 'Stay completed', color: 'text-[#222222]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]' },
    [BookingStatus.NO_SHOW]: { label: 'No show', color: 'text-[#717171]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]' },
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
            <div className="flex min-h-screen w-full bg-white">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#222222]" />
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );

    if (!booking) return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-white">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />
                    <div className="p-20 text-center text-[#717171] text-[16px]">Booking not found.</div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );

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
            <div className="flex min-h-screen w-full bg-white">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />

                    <main className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                        {/* ── Top Navigation & ID ── */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost" size="icon"
                                    className="rounded-full hover:bg-[#F7F7F7] text-[#222222]"
                                    onClick={() => router.push('/dashboard/host/bookings')}
                                >
                                    <ArrowLeft className="h-5 w-5 stroke-[2]" />
                                </Button>
                                <div>
                                    <h1 className="text-[32px] font-semibold text-[#222222] tracking-tight leading-none mb-1">
                                        Manage reservation
                                    </h1>
                                    <button
                                        onClick={copyId}
                                        className="group flex items-center gap-2 text-[14px] text-[#717171] hover:text-[#222222] transition-colors"
                                    >
                                        Confirmation code: {booking._id} <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={`${statusInfo.bg} ${statusInfo.color} px-3 py-1.5 rounded-lg font-semibold text-[13px]`}>
                                    {statusInfo.label}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                            {/* ── LEFT COLUMN: Guest & Stay Details ── */}
                            <div className="lg:col-span-2 space-y-10">

                                {/* Guest Card */}
                                <div>
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Guest profile</h3>
                                    <div className="flex items-start gap-6">
                                        <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-[28px] font-semibold text-white shrink-0">
                                            {guest?.name?.[0] || 'G'}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h2 className="text-[26px] font-semibold text-[#222222] leading-none mb-2">{guest?.name || 'Anonymous Guest'}</h2>
                                            <div className="flex flex-col gap-2">
                                                {guest?.email && (
                                                    <span className="flex items-center gap-3 text-[16px] text-[#222222]">
                                                        <Mail className="h-5 w-5 stroke-[1.5]" /> {guest.email}
                                                    </span>
                                                )}
                                                {guest?.phoneNumber && (
                                                    <span className="flex items-center gap-3 text-[16px] text-[#222222]">
                                                        <Phone className="h-5 w-5 stroke-[1.5]" /> {guest.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <Button variant="outline" className="h-12 px-6 rounded-lg border-blue-600 text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[15px]">
                                            <MessageCircle className="h-4 w-4 mr-2 stroke-[2]" /> Message guest
                                        </Button>
                                        <Button variant="outline" className="h-12 px-6 rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] hover:border-blue-600 font-semibold text-[15px]">
                                            <ShieldCheck className="h-4 w-4 mr-2 stroke-[2]" /> View ID verification
                                        </Button>
                                    </div>

                                    {booking.guestNote && (
                                        <div className="mt-8 bg-[#F7F7F7] rounded-2xl p-6 border border-[#DDDDDD]">
                                            <p className="text-[12px] font-bold text-[#717171] uppercase tracking-wider mb-2">Message from guest</p>
                                            <p className="text-[16px] text-[#222222] italic">"{booking.guestNote}"</p>
                                        </div>
                                    )}
                                </div>

                                <Separator className="bg-[#DDDDDD]" />

                                {/* Stay & Property Details */}
                                <div>
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Stay details</h3>

                                    <div className="flex items-center gap-6 mb-8 border border-[#DDDDDD] rounded-2xl p-4 cursor-pointer hover:bg-[#F7F7F7] transition-colors" onClick={() => router.push(`/properties/${prop?._id}`)}>
                                        <div className="h-20 w-24 rounded-lg bg-[#F7F7F7] overflow-hidden shrink-0 border border-[#DDDDDD]">
                                            {prop?.images?.[0]?.url && <img src={prop.images[0].url} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-semibold text-[#222222] mb-1">{prop?.title}</p>
                                            <p className="text-[14px] text-[#717171] flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {prop?.address}, {prop?.city}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold text-[#222222]">Check-in</p>
                                            <p className="text-[15px] text-[#717171]">{format(parseISO(booking.checkIn), 'MMM d, yyyy')}</p>
                                            <p className="text-[13px] text-[#717171]">{prop?.shortTermAmenities?.checkInTime || '14:00'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold text-[#222222]">Checkout</p>
                                            <p className="text-[15px] text-[#717171]">{format(parseISO(booking.checkOut), 'MMM d, yyyy')}</p>
                                            <p className="text-[13px] text-[#717171]">{prop?.shortTermAmenities?.checkOutTime || '11:00'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold text-[#222222]">Guests</p>
                                            <p className="text-[15px] text-[#717171]">{booking.guests.adults} adults</p>
                                            {booking.guests.children > 0 && <p className="text-[13px] text-[#717171]">{booking.guests.children} children</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold text-[#222222]">Duration</p>
                                            <p className="text-[15px] text-[#717171]">{nights} nights</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* ── RIGHT COLUMN: Actions & Payout ── */}
                            <div className="space-y-6 lg:sticky lg:top-10 self-start mt-8 lg:mt-0">

                                {/* Actions Card */}
                                <div className="bg-white rounded-2xl border border-[#DDDDDD] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Host actions</h3>

                                    <div className="space-y-4">
                                        {booking.status === BookingStatus.PENDING && (
                                            <>
                                                <Button
                                                    className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] transition-colors"
                                                    onClick={() => setActionDialog({ open: true, type: 'confirm' })}
                                                >
                                                    Accept request
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-12 rounded-lg border-[#DDDDDD] text-[#E50000] hover:bg-[#FFF8F8] hover:border-[#E50000]/30 font-semibold text-[16px] transition-colors"
                                                    onClick={() => setActionDialog({ open: true, type: 'reject' })}
                                                >
                                                    Decline request
                                                </Button>
                                            </>
                                        )}

                                        {booking.status === BookingStatus.CONFIRMED && (
                                            <Button
                                                className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] transition-colors"
                                                onClick={handleComplete}
                                            >
                                                Mark stay completed
                                            </Button>
                                        )}

                                        {[BookingStatus.COMPLETED, BookingStatus.REJECTED, BookingStatus.CANCELLED].includes(booking.status) && (
                                            <div className="py-6 text-center">
                                                <p className="text-[16px] font-semibold text-[#222222]">No actions available</p>
                                                <p className="text-[14px] text-[#717171] mt-1">This booking is {booking.status.toLowerCase()}.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payout Summary */}
                                <div className="bg-white rounded-2xl border border-[#DDDDDD] p-6">
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Expected payout</h3>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-[16px] text-[#222222]">
                                            <span className="underline decoration-[#DDDDDD] underline-offset-4">{booking.priceBreakdown?.pricePerNight?.toLocaleString() ?? 0} x {nights} nights</span>
                                            <span>{(booking.priceBreakdown?.subtotal ?? 0).toLocaleString()} {booking.currency}</span>
                                        </div>
                                        <div className="flex justify-between text-[16px] text-[#222222]">
                                            <span className="underline decoration-[#DDDDDD] underline-offset-4">HoroHouse service fee (10%)</span>
                                            <span>-{platformFee.toLocaleString()} {booking.currency}</span>
                                        </div>
                                    </div>

                                    <Separator className="bg-[#DDDDDD] mb-6" />

                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-[16px] font-semibold text-[#222222]">Your payout</span>
                                        <span className="text-[16px] font-semibold text-[#222222]">
                                            {expectedPayout.toLocaleString()} {booking.currency}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {booking.paymentStatus === 'paid' ? (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-[#008A05]" />
                                                <span className="text-[14px] font-medium text-[#222222]">Guest payment secured</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-[#222222]" />
                                                <span className="text-[14px] font-medium text-[#222222]">Guest payment pending</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </div>

            {/* ── Action Dialog ── */}
            <Dialog open={actionDialog.open} onOpenChange={(o) => (!o || !actioning) && setActionDialog({ open: false, type: null })}>
                <DialogContent className="sm:max-w-md rounded-2xl border-[#DDDDDD] p-0 overflow-hidden shadow-2xl">
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
                                    <span className="font-semibold text-[#222222]">{guest?.name}</span>.
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
                            <Button variant="outline" className="rounded-lg h-12 w-full sm:w-1/2 text-[15px] font-semibold border-blue-600 text-[#222222] hover:bg-[#F7F7F7]" onClick={() => setActionDialog({ open: false, type: null })}>
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