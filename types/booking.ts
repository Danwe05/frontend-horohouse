export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
}

export enum PaymentStatus {
    UNPAID = 'unpaid',
    PAID = 'paid',
    PARTIAL = 'partial',
    REFUNDED = 'refunded',
}

export enum CancelledBy {
    GUEST = 'guest',
    HOST = 'host',
    ADMIN = 'admin',
}

export interface PriceBreakdown {
    pricePerNight: number;
    nights: number;
    subtotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
}

export interface BookingGuests {
    adults: number;
    children: number;
    infants: number;
}

export interface BookingCancellation {
    cancelledBy: CancelledBy;
    cancelledAt: string;
    reason?: string;
    refundAmount: number;
    refundStatus?: 'pending' | 'processed' | 'failed';
}

// Mirrors ShortTermAmenities in property.schema.ts — keep in sync
export interface ShortTermAmenities {
    // Essentials
    hasWifi?: boolean;
    hasBreakfast?: boolean;
    hasParking?: boolean;
    hasTv?: boolean;
    hasKitchen?: boolean;
    hasKitchenette?: boolean;
    hasWasher?: boolean;
    hasDryer?: boolean;
    hasAirConditioning?: boolean;
    hasHeating?: boolean;
    // Guest policies
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    partiesAllowed?: boolean;
    maxGuests?: number;
    // Check-in details
    checkInTime?: string;
    checkOutTime?: string;
    selfCheckIn?: boolean;
    // Accessibility
    wheelchairAccessible?: boolean;
    // Extra services
    airportTransfer?: boolean;
    conciergeService?: boolean;
    dailyHousekeeping?: boolean;
}

export interface Booking {
    _id: string;
    propertyId: {
        _id: string;
        title: string;
        images?: Array<{ url: string }>;
        address?: string;
        city?: string;
        price: number;
        shortTermAmenities?: ShortTermAmenities; // FIXED: was truncated to 3 fields
    };
    guestId: {
        _id: string;
        name: string;
        email?: string;
        phoneNumber?: string;
        profilePicture?: string;
    };
    hostId: {
        _id: string;
        name: string;
        email?: string;
        phoneNumber?: string;
        profilePicture?: string;
    };
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: BookingGuests;
    priceBreakdown: PriceBreakdown;
    currency: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    isInstantBook: boolean;
    guestNote?: string;
    hostNote?: string;
    cancellation?: BookingCancellation;
    paymentReference?: string;
    paymentMethod?: string;
    confirmedAt?: string;
    actualCheckOut?: string;
    paidAt?: string;
    /** Whether the guest has left a review for this booking */
    guestReviewLeft: boolean;
    /** Whether the host has left a review for this booking */
    hostReviewLeft: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedBookings {
    bookings: Booking[];
    total: number;
    page: number;
    totalPages: number;
}

export interface AvailabilityResult {
    available: boolean;
    unavailableDates: { from: string; to: string }[];
    bookedRanges: { checkIn: string; checkOut: string }[];
}

export interface CreateBookingDto {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    guests: {
        adults: number;
        children?: number;
        infants?: number;
    };
    currency?: string;
    guestNote?: string;
}

export interface BookingQueryParams {
    page?: number;
    limit?: number;
    status?: BookingStatus;
    fromDate?: string;
    toDate?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface BookingStats {
    totalBookings: number;
    totalRevenue: number;
    byStatus: Record<string, { count: number; revenue: number }>;
}