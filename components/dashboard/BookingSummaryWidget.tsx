'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight, Clock, MapPin, User, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Booking, BookingStatus } from '@/types/booking';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface BookingSummaryWidgetProps {
    role: 'guest' | 'host' | 'admin';
    limit?: number;
    title?: string;
}

const STATUS_COLORS: Record<string, string> = {
    [BookingStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [BookingStatus.CONFIRMED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [BookingStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
    [BookingStatus.CANCELLED]: 'bg-slate-100 text-slate-600 border-slate-200',
    [BookingStatus.COMPLETED]: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const BookingSummaryWidget: React.FC<BookingSummaryWidgetProps> = ({
    role,
    limit = 5,
    title = 'Recent Bookings'
}) => {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentBookings = async () => {
            setLoading(true);
            try {
                let res;
                if (role === 'admin') {
                    res = await apiClient.getAdminBookings({ limit, sortOrder: 'desc' });
                } else if (role === 'host') {
                    res = await apiClient.getHostBookings({ limit, sortOrder: 'desc' });
                } else {
                    res = await apiClient.getMyBookings({ limit, sortOrder: 'desc' });
                }
                setBookings(res.bookings || []);
            } catch (error) {
                console.error('Error fetching recent bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentBookings();
    }, [role, limit]);

    if (loading) {
        return (
            <Card className="shadow-none border h-full">
                <CardHeader className="pb-3 px-6 pt-6">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="h-10 w-10 bg-slate-100 rounded-full shrink-0" />
                                <div className="space-y-2 w-full">
                                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-none border-0 shadow-lg h-full flex flex-col">
            <CardHeader className="pb-3 px-6 pt-6 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    {title}
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => router.push('/dashboard/bookings')}
                >
                    View All
                </Button>
            </CardHeader>
            <CardContent className="px-6 pb-2 flex-1">
                <div className="space-y-1">
                    {bookings.length === 0 ? (
                        <div className="text-center py-10">
                            <Clock className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm text-slate-500">No recent bookings found.</p>
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100"
                                onClick={() => router.push(`/dashboard/bookings`)}
                            >
                                <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-100">
                                    {booking.propertyId?.images?.[0]?.url ? (
                                        <img
                                            src={booking.propertyId.images[0].url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                            <MapPin className="h-5 w-5 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                            {booking.propertyId?.title}
                                        </h4>
                                        <Badge variant="outline" className={`text-[10px] h-5 px-2 font-semibold ${STATUS_COLORS[booking.status]}`}>
                                            {booking.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(parseISO(booking.checkIn), 'MMM d')} - {format(parseISO(booking.checkOut), 'MMM d')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {role === 'host' ? booking.guestId?.name : booking.hostId?.name}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
            {bookings.length > 0 && (
                <CardFooter className="px-6 py-4 border-t bg-slate-50/50 rounded-b-lg mt-auto">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        Last booking received {format(parseISO(bookings[0].createdAt), 'MMM d, h:mm a')}
                    </p>
                </CardFooter>
            )}
        </Card>
    );
};
