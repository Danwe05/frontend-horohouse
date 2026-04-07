'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
    Calendar, MapPin, Users, Clock, Star, ArrowLeft, CheckCircle2,
    XCircle, RotateCcw, Loader2, BedDouble, Wifi,
    Sparkles, AlertCircle, Phone, MessageCircle,
    Utensils, Wind, WashingMachine, Car, ShieldCheck,
    Download, Copy, Printer, Map as MapIcon, CreditCard
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
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { color: string; icon: any; bg: string }> = {
    [BookingStatus.PENDING]: { color: 'text-[#222222]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]', icon: Clock },
    [BookingStatus.CONFIRMED]: { color: 'text-[#008A05]', bg: 'bg-[#ECFDF5] border border-[#008A05]/20', icon: CheckCircle2 },
    [BookingStatus.REJECTED]: { color: 'text-[#E50000]', bg: 'bg-[#FFF8F8] border border-[#FFDFDF]', icon: XCircle },
    [BookingStatus.CANCELLED]: { color: 'text-[#717171]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]', icon: RotateCcw },
    [BookingStatus.COMPLETED]: { color: 'text-[#222222]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]', icon: Sparkles },
    [BookingStatus.NO_SHOW]: { color: 'text-[#717171]', bg: 'bg-[#F7F7F7] border border-[#DDDDDD]', icon: AlertCircle },
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

const BookingTimeline = ({ status, s }: { status: BookingStatus, s: any }) => {
    const steps = [s.timelineReq || 'Requested', s.timelineConf || 'Confirmed', s.timelineStay || 'Stay', s.timelineRev || 'Review'];
    const currentStep = useMemo(() => {
        if (status === BookingStatus.PENDING) return 0;
        if (status === BookingStatus.CONFIRMED) return 1;
        if (status === BookingStatus.COMPLETED) return 3;
        return 1;
    }, [status]);

    return (
        <div className="relative flex justify-between w-full mt-4 mb-2">
            <div className="absolute top-[7px] left-0 w-full h-[2px] bg-[#DDDDDD] z-0" />
            <div
                className="absolute top-[7px] left-0 h-[2px] bg-blue-600 z-0 transition-all duration-1000"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                    <div className={`h-3.5 w-3.5 rounded-full transition-colors ${i <= currentStep ? 'bg-blue-600' : 'bg-[#DDDDDD]'}`} />
                    <span className={`text-[12px] font-medium ${i <= currentStep ? 'text-[#222222]' : 'text-[#717171]'}`}>
                        {step}
                    </span>
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
    const { t } = useLanguage();
    const _t = t as any;
    const s = _t.bookings || {};
    const sd = s.details || {};

    const getStatusLabel = (status: BookingStatus) => {
        const labels: Record<BookingStatus, string> = {
            [BookingStatus.PENDING]: s.status?.pending || 'Awaiting Host',
            [BookingStatus.CONFIRMED]: s.status?.confirmed || 'Confirmed',
            [BookingStatus.REJECTED]: s.status?.rejected || 'Declined',
            [BookingStatus.CANCELLED]: s.status?.cancelled || 'Cancelled',
            [BookingStatus.COMPLETED]: s.status?.completed || 'Stay Completed',
            [BookingStatus.NO_SHOW]: s.status?.noShow || 'No Show',
        };
        return labels[status];
    };

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
                toast.error(sd.loadError || 'Could not load booking details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, sd]);

    const copyId = () => {
        navigator.clipboard.writeText(id);
        toast.success(sd.copied || 'Booking ID copied');
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
                    <div className="p-20 text-center text-[#717171] text-[16px]">{sd.notFound || 'Booking not found.'}</div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );

    const prop = booking.propertyId;
    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));
    const statusInfo = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG[BookingStatus.PENDING];

    // Robust guest check
    const guestIdStr = typeof booking.guestId === 'string'
        ? booking.guestId
        : (booking.guestId?.id ?? (booking.guestId as any)?._id)?.toString() ?? '';
    const currentUserId = user?.id?.toString() ?? '';
    const isGuest = !!currentUserId && currentUserId === guestIdStr;

    // Action guards
    const canCancel = isGuest && [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status);
    const canReview = isGuest && booking.status === BookingStatus.COMPLETED && !booking.guestReviewLeft;
    const canPay = isGuest && booking.paymentStatus !== 'paid' && ![BookingStatus.CANCELLED, BookingStatus.REJECTED, BookingStatus.NO_SHOW].includes(booking.status);

    // Handlers
    const handlePay = async () => {
        try {
            setPayingNow(true);
            const res = await apiClient.initiateBookingPayment(id);
            window.location.href = res.paymentLink;
        } catch (err: any) {
            toast.error(sd.payFail || 'Payment failed', {
                description: err?.response?.data?.message ?? (sd.payInitFail || 'Could not initialize payment. Please try again.'),
            });
            setPayingNow(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await apiClient.cancelBooking(id, { reason: sd.guestCancel || 'Cancelled by guest' });
            toast.success(s.toasts?.cancelSuccess || 'Booking cancelled.');
            setBooking(b => b ? { ...b, status: BookingStatus.CANCELLED } : b);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? (sd.cancelFail || 'Could not cancel booking.'));
        } finally {
            setCancelling(false);
        }
    };

    return (
        <SidebarProvider>
            <BookingReceiptView booking={booking} />

            <div className="flex min-h-screen w-full bg-white print:hidden">
                <AppSidebar />
                <SidebarInset>
                    <NavDash />

                    <main className="p-6 md:p-10 max-w-7xl mx-auto w-full">

                        {/* ── Top bar ── */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost" size="icon"
                                    className="rounded-full hover:bg-[#F7F7F7] text-[#222222]"
                                    onClick={() => router.push('/dashboard/bookings')}
                                >
                                    <ArrowLeft className="h-5 w-5 stroke-[2]" />
                                </Button>
                                <div>
                                    <h1 className="text-[32px] font-semibold text-[#222222] tracking-tight leading-none mb-1">
                                        {sd.title || 'Booking Details'}
                                    </h1>
                                    <button
                                        onClick={copyId}
                                        className="group flex items-center gap-2 text-[14px] text-[#717171] hover:text-[#222222] transition-colors"
                                    >
                                        {sd.bookingId || 'Confirmation code'}: {booking._id}
                                        <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline" size="sm"
                                    className="rounded-lg border-blue-600 text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[14px] h-10 px-4"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4 mr-2 stroke-[2]" /> {sd.print || 'Print Receipt'}
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-lg border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[14px] h-10 px-4">
                                    <Download className="h-4 w-4 mr-2 stroke-[2]" /> PDF
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                            {/* ── Left column ── */}
                            <div className="lg:col-span-2 space-y-10">

                                {/* Hero image + quick info */}
                                <div>
                                    <div className="relative h-[350px] md:h-[450px] w-full rounded-2xl overflow-hidden mb-6 bg-[#F7F7F7]">
                                        <img
                                            src={prop?.images?.[0]?.url}
                                            className="w-full h-full object-cover"
                                            alt={prop?.title ?? 'Property'}
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className={`${statusInfo.bg} ${statusInfo.color} px-3 py-1.5 rounded-lg font-semibold text-[12px]`}>
                                                {getStatusLabel(booking.status)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <h2 className="text-[26px] font-semibold text-[#222222] mb-1">{prop?.title}</h2>
                                    <p className="text-[16px] text-[#717171] mb-8">
                                        {prop?.city}, {prop?.address}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-[#DDDDDD]">
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold text-[#222222]">{sd.checkIn || 'Check-in'}</p>
                                            <p className="text-[15px] text-[#717171]">{format(parseISO(booking.checkIn), 'MMM d, yyyy')}</p>
                                            <p className="text-[13px] text-[#717171]">{prop?.shortTermAmenities?.checkInTime || '14:00'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold text-[#222222]">{sd.checkOut || 'Checkout'}</p>
                                            <p className="text-[15px] text-[#717171]">{format(parseISO(booking.checkOut), 'MMM d, yyyy')}</p>
                                            <p className="text-[13px] text-[#717171]">{prop?.shortTermAmenities?.checkOutTime || '11:00'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold text-[#222222]">{sd.guests || 'Guests'}</p>
                                            <p className="text-[15px] text-[#717171]">{booking.guests.adults} {sd.adults || 'adults'}</p>
                                            {booking.guests.children > 0 && (
                                                <p className="text-[13px] text-[#717171]">{booking.guests.children} {sd.children || 'children'}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold text-[#222222]">{sd.totalStay || 'Length of stay'}</p>
                                            <p className="text-[15px] text-[#717171]">{nights} {sd.nights || 'nights'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div>
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">
                                        {sd.lifecycle || 'Reservation status'}
                                    </h3>
                                    <BookingTimeline status={booking.status} s={sd} />
                                </div>

                                <Separator className="bg-[#DDDDDD]" />

                                {/* Amenities */}
                                <div>
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">{sd.whatOffers || 'What this place offers'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                        {prop?.shortTermAmenities?.hasWifi && (
                                            <div className="flex items-center gap-4 text-[16px] text-[#222222]">
                                                <Wifi className="h-6 w-6 stroke-[1.5] text-[#222222]" /> {sd.wifi || 'Wifi'}
                                            </div>
                                        )}
                                        {prop?.shortTermAmenities?.hasAirConditioning && (
                                            <div className="flex items-center gap-4 text-[16px] text-[#222222]">
                                                <Wind className="h-6 w-6 stroke-[1.5] text-[#222222]" /> {sd.ac || 'Air conditioning'}
                                            </div>
                                        )}
                                        {prop?.shortTermAmenities?.hasParking && (
                                            <div className="flex items-center gap-4 text-[16px] text-[#222222]">
                                                <Car className="h-6 w-6 stroke-[1.5] text-[#222222]" /> {sd.parking || 'Free parking on premises'}
                                            </div>
                                        )}
                                        {prop?.shortTermAmenities?.hasKitchen && (
                                            <div className="flex items-center gap-4 text-[16px] text-[#222222]">
                                                <Utensils className="h-6 w-6 stroke-[1.5] text-[#222222]" /> {sd.kitchen || 'Kitchen'}
                                            </div>
                                        )}
                                        {prop?.shortTermAmenities?.hasWasher && (
                                            <div className="flex items-center gap-4 text-[16px] text-[#222222]">
                                                <WashingMachine className="h-6 w-6 stroke-[1.5] text-[#222222]" /> {sd.washer || 'Washer'}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4 text-[16px] text-[#717171] line-through">
                                            <ShieldCheck className="h-6 w-6 stroke-[1.5] text-[#717171]" /> {sd.smoke || 'Smoke alarm'}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-[#DDDDDD]" />

                                {/* Map placeholder */}
                                <div>
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">{sd.location || 'Where you’ll be'}</h3>
                                    <div className="h-[250px] w-full bg-[#F7F7F7] border border-[#DDDDDD] rounded-2xl flex items-center justify-center flex-col gap-3 transition-colors hover:bg-[#EBEBEB] cursor-pointer">
                                        <MapIcon className="h-8 w-8 text-[#222222] stroke-[1.5]" />
                                        <p className="text-[14px] font-medium text-[#222222]">
                                            {sd.openMap || 'Open in Google Maps'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Right column ── */}
                            <div className="space-y-6 lg:sticky lg:top-10 self-start mt-8 lg:mt-0">

                                {/* Payment summary card */}
                                <div className="bg-white rounded-2xl border border-[#DDDDDD] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">
                                        {sd.paymentSummary || 'Price details'}
                                    </h3>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-[16px] text-[#222222]">
                                            <span className="underline decoration-[#DDDDDD] underline-offset-4">
                                                {booking.priceBreakdown?.pricePerNight.toLocaleString()} {booking.currency} x {nights} {sd.nights || 'nights'}
                                            </span>
                                            <span>
                                                {booking.priceBreakdown?.subtotal.toLocaleString()} {booking.currency}
                                            </span>
                                        </div>
                                        {(booking.priceBreakdown?.cleaningFee ?? 0) > 0 && (
                                            <div className="flex justify-between text-[16px] text-[#222222]">
                                                <span className="underline decoration-[#DDDDDD] underline-offset-4">{sd.cleaningFee || 'Cleaning fee'}</span>
                                                <span>
                                                    {booking.priceBreakdown?.cleaningFee.toLocaleString()} {booking.currency}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[16px] text-[#222222]">
                                            <span className="underline decoration-[#DDDDDD] underline-offset-4">{sd.serviceFee || 'HoroHouse service fee'}</span>
                                            <span>
                                                {booking.priceBreakdown?.serviceFee.toLocaleString()} {booking.currency}
                                            </span>
                                        </div>
                                        {(booking.priceBreakdown?.discountAmount ?? 0) > 0 && (
                                            <div className="flex justify-between text-[16px] font-semibold text-[#008A05]">
                                                <span>{sd.discount || 'Special offer discount'}</span>
                                                <span>
                                                    −{booking.priceBreakdown?.discountAmount.toLocaleString()} {booking.currency}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="bg-[#DDDDDD] mb-6" />

                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-[16px] font-semibold text-[#222222]">{sd.total || 'Total'} ({booking.currency})</span>
                                        <span className="text-[16px] font-semibold text-[#222222]">
                                            {booking.priceBreakdown?.totalAmount.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Payment status pill */}
                                    <div className="flex items-center gap-3 mb-6">
                                        {booking.paymentStatus === 'paid' ? (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-[#008A05]" />
                                                <span className="text-[14px] font-medium text-[#222222]">{sd.fullyPaid || 'Fully paid'}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-[#222222]" />
                                                <span className="text-[14px] font-medium text-[#222222]">{sd.paymentPending || 'Payment pending'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="space-y-4">
                                        {/* Pay button */}
                                        {canPay && (
                                            <Button
                                                className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] transition-colors"
                                                onClick={handlePay}
                                                disabled={payingNow}
                                            >
                                                {payingNow ? (
                                                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {sd.processing || 'Processing…'}</>
                                                ) : (
                                                    <>{sd.completePayment || 'Pay now'}</>
                                                )}
                                            </Button>
                                        )}

                                        {/* Review button */}
                                        {canReview && (
                                            <Button
                                                className="w-full h-12 rounded-lg border border-blue-600 bg-white hover:bg-[#F7F7F7] text-[#222222] font-semibold text-[16px] transition-colors"
                                                onClick={() => setReviewOpen(true)}
                                            >
                                                {sd.rateExperience || 'Write a review'}
                                            </Button>
                                        )}

                                        {/* Cancel button */}
                                        {canCancel && (
                                            <Button
                                                variant="ghost"
                                                className="w-full h-12 rounded-lg text-[#222222] font-semibold text-[16px] underline hover:bg-transparent hover:text-black transition-colors"
                                                onClick={handleCancel}
                                                disabled={cancelling}
                                            >
                                                {cancelling ? (
                                                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {sd.cancelling || 'Cancelling…'}</>
                                                ) : (
                                                    sd.cancelRes || 'Cancel reservation'
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Host info card */}
                                <div className="bg-white rounded-2xl border border-[#DDDDDD] p-6">
                                    <h3 className="text-[22px] font-semibold text-[#222222] mb-6">{sd.yourHost || 'Hosted by'} {booking.hostId?.name}</h3>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-[20px] font-semibold text-white">
                                            {booking.hostId?.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-semibold text-[#222222]">{booking.hostId?.name}</p>
                                            <p className="text-[14px] text-[#717171]">{sd.joined || 'Joined'} {new Date((booking.hostId as any)?.createdAt || Date.now()).getFullYear()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="outline" className="flex-1 h-12 rounded-lg border-blue-600 text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[15px]">
                                            <MessageCircle className="h-4 w-4 mr-2 stroke-[2]" /> {s.chat || 'Message host'}
                                        </Button>
                                        <Button variant="outline" className="flex-1 h-12 rounded-lg border-blue-600 text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[15px]" asChild>
                                            <a href={`tel:${booking.hostId?.phoneNumber}`}>
                                                <Phone className="h-4 w-4 mr-2 stroke-[2]" /> {s.call || 'Call'}
                                            </a>
                                        </Button>
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