'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    Calendar, MapPin, Users, Clock, Star, ArrowLeft, CheckCircle2,
    XCircle, RotateCcw, Loader2, BedDouble, Wifi,
    Sparkles, AlertCircle, Phone, Mail,
    X, Utensils, Wind, WashingMachine,
    Car, ShieldCheck, Download, Copy,
    MessageCircle, Printer, Map as MapIcon, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import StayReviewForm from '@/components/dashboard/StayReviewForm';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { Badge } from '@/components/ui/badge';
import BookingReceiptView from '@/components/dashboard/BookingReceiptView';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: any; bg: string }> = {
    [BookingStatus.PENDING]: { label: 'Awaiting Host', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
    [BookingStatus.CONFIRMED]: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
    [BookingStatus.REJECTED]: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
    [BookingStatus.CANCELLED]: { label: 'Cancelled', color: 'text-slate-600', bg: 'bg-slate-50', icon: RotateCcw },
    [BookingStatus.COMPLETED]: { label: 'Stay Completed', color: 'text-blue-700', bg: 'bg-blue-50', icon: Sparkles },
    [BookingStatus.NO_SHOW]: { label: 'No Show', color: 'text-orange-700', bg: 'bg-orange-50', icon: AlertCircle },
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

const BookingTimeline = ({ status }: { status: BookingStatus }) => {
    const steps = ['Requested', 'Confirmed', 'Stay', 'Review'];
    const currentStep = useMemo(() => {
        if (status === BookingStatus.PENDING) return 0;
        if (status === BookingStatus.CONFIRMED) return 1;
        if (status === BookingStatus.COMPLETED) return 3;
        return 1;
    }, [status]);

    return (
        <div className="relative flex justify-between w-full max-w-md mx-auto mb-8">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            <div
                className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-1000"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step, i) => (
                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`h-4 w-4 rounded-full border-2 transition-colors ${i <= currentStep ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'
                        }`} />
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${i <= currentStep ? 'text-indigo-600' : 'text-slate-400'
                        }`}>{step}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [payingNow, setPayingNow] = useState(false);


    useEffect(() => {
        (async () => {
            try {
                const res = await apiClient.getBookingById(id);
                setBooking(res);
            } catch {
                toast.error('Could not load booking details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const copyId = () => {
        navigator.clipboard.writeText(id);
        toast.success('Booking ID copied');
    };

    if (loading) return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f8fafc]">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500/20" />
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );

    if (!booking) return <div className="p-20 text-center">Booking not found.</div>;

    const prop = booking.propertyId;
    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));
    const statusInfo = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG[BookingStatus.PENDING];

    // ── Robust guest check ────────────────────────────────────────────────────
    // user.id and guestId._id are both ObjectId strings — normalise to string
    // before comparing so mismatched types don't silently return false.
    const guestIdStr = typeof booking.guestId === 'string'
        ? booking.guestId
        : (booking.guestId?.id ?? (booking.guestId as any)?._id)?.toString() ?? '';
    const currentUserId = user?.id?.toString() ?? '';
    const isGuest = !!currentUserId && currentUserId === guestIdStr;

    // ── Action guards ─────────────────────────────────────────────────────────
    const canCancel = isGuest &&
        [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status);

    const canReview = isGuest &&
        booking.status === BookingStatus.COMPLETED &&
        !booking.guestReviewLeft;

    // Show Pay button whenever:
    //   • caller is the guest
    //   • booking hasn't been paid yet
    //   • booking is not in a terminal rejected/cancelled state
    const canPay = isGuest &&
        booking.paymentStatus !== 'paid' &&
        ![BookingStatus.CANCELLED, BookingStatus.REJECTED, BookingStatus.NO_SHOW]
            .includes(booking.status);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handlePay = async () => {
        try {
            setPayingNow(true);
            const res = await apiClient.initiateBookingPayment(id);
            // Redirect to Flutterwave hosted checkout
            window.location.href = res.paymentLink;
        } catch (err: any) {
            toast.error('Payment failed', {
                description: err?.response?.data?.message ??
                    'Could not initialize payment. Please try again.',
            });
            setPayingNow(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await apiClient.cancelBooking(id, { reason: 'Cancelled by guest' });
            toast.success('Booking cancelled.');
            setBooking(b => b ? { ...b, status: BookingStatus.CANCELLED } : b);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Could not cancel booking.');
        } finally {
            setCancelling(false);
        }
    };

    console.log('🔍 PAY BUTTON DEBUG', {
        'user': user,
        'user.id': user?.id,
        'booking.guestId': booking.guestId,
        'guestIdStr': typeof booking.guestId === 'string'
            ? booking.guestId
            : (booking.guestId as any)?._id?.toString(),
        'isGuest': isGuest,
        'canPay': canPay,
        'paymentStatus': booking.paymentStatus,
        'bookingStatus': booking.status,
    });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <SidebarProvider>
            <BookingReceiptView booking={booking} />

            <div className="flex min-h-screen w-full bg-[#f8fafc] print:hidden">
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <NavDash />

                    <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">

                        {/* ── Top bar ── */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost" size="icon"
                                    className="rounded-2xl bg-white border border-slate-200 shadow-sm"
                                    onClick={() => router.push('/dashboard/bookings')}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Details</h1>
                                    <button
                                        onClick={copyId}
                                        className="group flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        ID: {booking._id}
                                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    className="rounded-xl border-slate-200 bg-white font-bold text-xs"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-3.5 w-3.5 mr-2" /> Print Receipt
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white font-bold text-xs">
                                    <Download className="h-3.5 w-3.5 mr-2" /> PDF
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* ── Left column ── */}
                            <div className="lg:col-span-2 space-y-8">

                                {/* Hero image + quick info */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="relative h-[400px]">
                                        <img
                                            src={prop?.images?.[0]?.url}
                                            className="w-full h-full object-cover"
                                            alt={prop?.title ?? 'Property'}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className="absolute bottom-8 left-8 right-8 text-white">
                                            <Badge className={`${statusInfo.bg} ${statusInfo.color} border-none mb-4 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]`}>
                                                {statusInfo.label}
                                            </Badge>
                                            <h2 className="text-3xl font-black mb-2">{prop?.title}</h2>
                                            <p className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                                                <MapPin className="h-4 w-4 text-indigo-400" />
                                                {prop?.address}, {prop?.city}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-slate-100 bg-slate-50/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Check-in</p>
                                            <p className="font-bold text-slate-900">{format(parseISO(booking.checkIn), 'MMM d, yyyy')}</p>
                                            <p className="text-xs text-slate-500">After {prop?.shortTermAmenities?.checkInTime || '14:00'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Check-out</p>
                                            <p className="font-bold text-slate-900">{format(parseISO(booking.checkOut), 'MMM d, yyyy')}</p>
                                            <p className="text-xs text-slate-500">Before {prop?.shortTermAmenities?.checkOutTime || '11:00'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Guests</p>
                                            <p className="font-bold text-slate-900">{booking.guests.adults} Adults</p>
                                            {booking.guests.children > 0 && (
                                                <p className="text-xs text-slate-500">{booking.guests.children} Children</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Stay</p>
                                            <p className="font-bold text-slate-900">{nights} Nights</p>
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 text-center">
                                            Reservation Lifecycle
                                        </h3>
                                        <BookingTimeline status={booking.status} />
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-slate-900">What this place offers</h3>
                                        <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs font-bold text-slate-400">
                                            Verified Amenities
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                                        {prop?.shortTermAmenities?.hasWifi && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                                <Wifi className="h-5 w-5 text-indigo-500" /> High-speed WiFi
                                            </div>
                                        )}
                                        {prop?.shortTermAmenities?.hasAirConditioning && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                                <Wind className="h-5 w-5 text-indigo-500" /> Air Conditioning
                                            </div>
                                        )}
                                        {prop?.shortTermAmenities?.hasParking && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                                <Car className="h-5 w-5 text-indigo-500" /> Free Parking
                                            </div>
                                        )}
                                        {prop?.shortTermAmenities?.hasKitchen && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                                <Utensils className="h-5 w-5 text-indigo-500" /> Full Kitchen
                                            </div>
                                        )}
                                        {prop?.shortTermAmenities?.hasWasher && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                                <WashingMachine className="h-5 w-5 text-indigo-500" /> In-unit Washer
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600 opacity-50">
                                            <ShieldCheck className="h-5 w-5 text-indigo-500" /> Smoke Alarm
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Right column ── */}
                            <div className="space-y-6 lg:sticky lg:top-8 self-start">

                                {/* Payment summary card */}
                                <div className="bg-white rounded-[2.5rem] border-2 border-slate-900 p-8 shadow-2xl shadow-indigo-100">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                                        Payment Summary
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-sm font-bold">
                                            <span className="text-slate-500">
                                                {booking.priceBreakdown?.pricePerNight.toLocaleString()} × {nights} nights
                                            </span>
                                            <span className="text-slate-900">
                                                {booking.priceBreakdown?.subtotal.toLocaleString()} {booking.currency}
                                            </span>
                                        </div>
                                        {(booking.priceBreakdown?.cleaningFee ?? 0) > 0 && (
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-slate-500">Cleaning fee</span>
                                                <span className="text-slate-900">
                                                    {booking.priceBreakdown?.cleaningFee.toLocaleString()} {booking.currency}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-bold">
                                            <span className="text-slate-500">Service fee</span>
                                            <span className="text-slate-900">
                                                {booking.priceBreakdown?.serviceFee.toLocaleString()} {booking.currency}
                                            </span>
                                        </div>
                                        {(booking.priceBreakdown?.discountAmount ?? 0) > 0 && (
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-emerald-600">Discount</span>
                                                <span className="text-emerald-600">
                                                    −{booking.priceBreakdown?.discountAmount.toLocaleString()} {booking.currency}
                                                </span>
                                            </div>
                                        )}
                                        <Separator className="bg-slate-100" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-black text-slate-900">Total</span>
                                            <span className="text-2xl font-black text-indigo-600">
                                                {booking.priceBreakdown?.totalAmount.toLocaleString()} {booking.currency}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment status pill */}
                                    <div className={`rounded-2xl p-4 mb-8 flex items-center justify-between ${booking.paymentStatus === 'paid'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                        }`}>
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                                            <ShieldCheck className="h-4 w-4" />
                                            {booking.paymentStatus === 'paid' ? 'Fully Paid' : 'Payment Pending'}
                                        </div>
                                        <span className="text-[10px] font-bold opacity-60">
                                            REF: {booking.paymentReference || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="space-y-3">

                                        {/* Pay button — shown to guest when unpaid and booking is active */}
                                        {canPay && (
                                            <Button
                                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100 gap-2"
                                                onClick={handlePay}
                                                disabled={payingNow}
                                            >
                                                {payingNow ? (
                                                    <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
                                                ) : (
                                                    <><CreditCard className="h-5 w-5" /> Complete Payment</>
                                                )}
                                            </Button>
                                        )}

                                        {/* Review button */}
                                        {canReview && (
                                            <Button
                                                className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg shadow-xl shadow-amber-100"
                                                onClick={() => setReviewOpen(true)}
                                            >
                                                Rate Experience
                                            </Button>
                                        )}

                                        {/* Cancel button */}
                                        {canCancel && (
                                            <Button
                                                variant="outline"
                                                className="w-full h-14 rounded-2xl border-red-100 text-red-600 hover:bg-red-50 font-black"
                                                onClick={handleCancel}
                                                disabled={cancelling}
                                            >
                                                {cancelling ? (
                                                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Cancelling…</>
                                                ) : (
                                                    'Cancel Reservation'
                                                )}
                                            </Button>
                                        )}

                                        <Button variant="ghost" className="w-full h-12 rounded-2xl text-slate-400 font-bold text-sm">
                                            Help & Support
                                        </Button>
                                    </div>
                                </div>

                                {/* Host card */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Your Host</h3>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600">
                                            {booking.hostId?.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-slate-900">{booking.hostId?.name}</p>
                                            <p className="text-xs text-slate-400 font-bold">Superhost · Joined 2023</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="secondary" className="rounded-xl h-12 bg-slate-50 border border-slate-100 font-bold text-slate-700">
                                            <MessageCircle className="h-4 w-4 mr-2 text-indigo-500" /> Chat
                                        </Button>
                                        <Button variant="secondary" className="rounded-xl h-12 bg-slate-50 border border-slate-100 font-bold text-slate-700" asChild>
                                            <a href={`tel:${booking.hostId?.phoneNumber}`}>
                                                <Phone className="h-4 w-4 mr-2 text-indigo-500" /> Call
                                            </a>
                                        </Button>
                                    </div>
                                </div>

                                {/* Map placeholder */}
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-4 shadow-sm group cursor-pointer overflow-hidden">
                                    <div className="h-40 bg-slate-100 rounded-[1.5rem] flex items-center justify-center flex-col gap-2 transition-colors group-hover:bg-slate-200">
                                        <MapIcon className="h-8 w-8 text-slate-300" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            Open in Google Maps
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </div>

            {booking && (
                <StayReviewForm
                    open={reviewOpen}
                    onClose={() => setReviewOpen(false)}
                    bookingId={booking._id}
                    propertyId={prop?._id ?? ''}
                    propertyTitle={prop?.title ?? ''}
                    onSuccess={() => {
                        setReviewOpen(false);
                        setBooking(b => b ? { ...b, guestReviewLeft: true } : b);
                    }}
                />
            )}
        </SidebarProvider>
    );
}