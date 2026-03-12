'use client';

import { Booking } from '@/types/booking';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

interface BookingReceiptViewProps {
    booking: Booking;
}

export default function BookingReceiptView({ booking }: BookingReceiptViewProps) {
    if (!booking) return null;

    const prop = booking.propertyId;
    const nights = booking.nights ?? differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));
    const guest = typeof booking.guestId === 'object' ? booking.guestId : null;
    const host = typeof booking.hostId === 'object' ? booking.hostId : null;

    return (
        // 'hidden print:block' ensures this component is ONLY visible when printing.
        <div className="hidden print:block w-full max-w-4xl mx-auto bg-white p-8 font-sans text-slate-800">

            {/* ── Header: Logo & Receipt Title ── */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-8">
                <div>
                    {/* Using text logo here. In production, an img src to the brand logo is better. */}
                    <h1 className="text-3xl font-black tracking-tighter text-indigo-600 uppercase">HoroHouse</h1>
                    <p className="text-sm font-medium text-slate-500 tracking-widest mt-1 uppercase">Booking Receipt</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">Receipt No: <span className="font-mono">{booking._id?.slice(-8).toUpperCase()}</span></p>
                    <p className="text-xs text-slate-500 mt-1">Date: {format(new Date(), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-slate-500 mt-1">Status: <span className="uppercase font-bold text-slate-900">{booking.status}</span></p>
                </div>
            </div>

            {/* ── 2 Columns: Guest Info vs Host/Property Info ── */}
            <div className="grid grid-cols-2 gap-12 mb-10">

                {/* Guest Information */}
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">Billed To (Guest)</h3>
                    <p className="text-lg font-bold text-slate-900 mb-1">{guest?.name || 'Guest'}</p>
                    {guest?.email && <p className="text-sm flex items-center gap-2 text-slate-600 mt-1"><Mail className="h-3.5 w-3.5" /> {guest.email}</p>}
                    {guest?.phoneNumber && <p className="text-sm flex items-center gap-2 text-slate-600 mt-1"><Phone className="h-3.5 w-3.5" /> {guest.phoneNumber}</p>}
                </div>

                {/* Property & Host Information */}
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">Property Details</h3>
                    <p className="text-lg font-bold text-slate-900 mb-1">{prop?.title}</p>
                    <p className="text-sm flex items-start gap-2 text-slate-600 mt-1">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{prop?.address}, {prop?.city} {prop?.country}</span>
                    </p>
                    {host && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Hosted By</p>
                            <p className="text-sm font-medium text-slate-900">{host.name}</p>
                            {host.phoneNumber && <p className="text-xs flex items-center gap-2 text-slate-600 mt-1"><Phone className="h-3 w-3" /> {host.phoneNumber}</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Stay Details ── */}
            <div className="bg-slate-50 rounded-xl p-6 mb-10 border border-slate-200">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Reservation Details</h3>
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Check-in</p>
                        <p className="font-bold text-slate-900">{format(parseISO(booking.checkIn), 'MMM d, yyyy')}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{prop?.shortTermAmenities?.checkInTime || '14:00'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Check-out</p>
                        <p className="font-bold text-slate-900">{format(parseISO(booking.checkOut), 'MMM d, yyyy')}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{prop?.shortTermAmenities?.checkOutTime || '11:00'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Duration</p>
                        <p className="font-bold text-slate-900">{nights} Nights</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Guests</p>
                        <p className="font-bold text-slate-900">
                            {booking.guests?.adults} Adults
                            {booking.guests?.children ? `, ${booking.guests.children} Children` : ''}
                            {booking.guests?.infants ? `, ${booking.guests.infants} Infants` : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Price Breakdown Table ── */}
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-900 pb-2">Payment Summary</h3>
            <table className="w-full text-sm mb-10">
                <tbody>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-slate-600">{booking.priceBreakdown?.pricePerNight?.toLocaleString()} {booking.currency} x {nights} nights</td>
                        <td className="py-3 text-right font-medium text-slate-900">{booking.priceBreakdown?.subtotal?.toLocaleString()} {booking.currency}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-3 text-slate-600">Service Fee</td>
                        <td className="py-3 text-right font-medium text-slate-900">{booking.priceBreakdown?.serviceFee?.toLocaleString()} {booking.currency}</td>
                    </tr>
                    <tr>
                        <td className="py-4 text-base font-black text-slate-900 uppercase tracking-widest">Total Amount</td>
                        <td className="py-4 text-right text-xl font-black text-indigo-600">{booking.priceBreakdown?.totalAmount?.toLocaleString()} {booking.currency}</td>
                    </tr>
                </tbody>
            </table>

            {/* ── Payment Status ── */}
            <div className="flex items-center justify-between border-t-2 border-slate-900 pt-6">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Status</p>
                    <p className={`text-lg font-black uppercase tracking-widest ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {booking.paymentStatus === 'paid' ? 'Paid in Full' : 'Payment Pending'}
                    </p>
                    {booking.paymentReference && (
                        <p className="text-xs text-slate-500 mt-1 font-mono">Ref: {booking.paymentReference}</p>
                    )}
                </div>

                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Need Help?</p>
                    <p className="text-xs flex items-center justify-end gap-1 text-slate-600"><Globe className="h-3 w-3" /> support.horohouse.com</p>
                    <p className="text-xs flex items-center justify-end gap-1 text-slate-600 mt-1"><Mail className="h-3 w-3" /> bookings@horohouse.com</p>
                </div>
            </div>

        </div>
    );
}
