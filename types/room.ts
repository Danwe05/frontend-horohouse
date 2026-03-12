// ─── Room Types ────────────────────────────────────────────────────────────────
// Shared across guest booking flow and host management UI

export type RoomType =
    | 'single' | 'double' | 'twin' | 'suite'
    | 'dormitory' | 'deluxe' | 'family' | 'penthouse' | 'studio';

export type BedType = 'single' | 'double' | 'queen' | 'king' | 'bunk' | 'sofa_bed';

export interface RoomUnavailableRange {
    from: string;
    to: string;
    reason?: string;
    source?: 'manual' | 'ical' | 'platform_booking';
}

export interface RoomAmenities {
    hasWifi?: boolean;
    hasAirConditioning?: boolean;
    hasHeating?: boolean;
    hasTv?: boolean;
    hasBalcony?: boolean;
    hasPrivateBathroom?: boolean;
    hasKitchenette?: boolean;
    hasDesk?: boolean;
    hasSafe?: boolean;
    hasMinibar?: boolean;
    wheelchairAccessible?: boolean;
    selfCheckIn?: boolean;
    checkInTime?: string;
    checkOutTime?: string;
}

export interface Room {
    _id: string;
    propertyId: string;
    name: string;
    roomNumber?: string;
    roomType: RoomType;
    maxGuests: number;
    bedCount: number;
    bedType: BedType;
    price?: number;           // overrides property price if set
    cleaningFee?: number;     // overrides property cleaningFee if set
    amenities: RoomAmenities;
    images: { url: string; publicId: string; caption?: string }[];
    unavailableDates: RoomUnavailableRange[];
    icalUrl?: string;
    icalLastSyncedAt?: string;
    icalSyncedRangesCount?: number;
    isActive: boolean;
    bookingsCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface RoomAvailability {
    available: boolean;
    unavailableDates: { from: string; to: string; reason?: string; source?: string }[];
    bookedRanges: { checkIn: string; checkOut: string; bookingId: string }[];
}

// Room type labels for UI display
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
    single: 'Single',
    double: 'Double',
    twin: 'Twin',
    suite: 'Suite',
    dormitory: 'Dormitory',
    deluxe: 'Deluxe',
    family: 'Family',
    penthouse: 'Penthouse',
    studio: 'Studio',
};

export const BED_TYPE_LABELS: Record<BedType, string> = {
    single: 'Single Bed',
    double: 'Double Bed',
    queen: 'Queen Bed',
    king: 'King Bed',
    bunk: 'Bunk Bed',
    sofa_bed: 'Sofa Bed',
};

export const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'twin', label: 'Twin' },
    { value: 'suite', label: 'Suite' },
    { value: 'dormitory', label: 'Dormitory' },
    { value: 'deluxe', label: 'Deluxe' },
    { value: 'family', label: 'Family' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'studio', label: 'Studio' },
];

export const BED_TYPE_OPTIONS: { value: BedType; label: string }[] = [
    { value: 'single', label: 'Single Bed' },
    { value: 'double', label: 'Double Bed' },
    { value: 'queen', label: 'Queen Bed' },
    { value: 'king', label: 'King Bed' },
    { value: 'bunk', label: 'Bunk Bed' },
    { value: 'sofa_bed', label: 'Sofa Bed' },
];
