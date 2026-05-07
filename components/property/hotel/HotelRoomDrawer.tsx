'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, BedDouble, Users,
  Wifi, Wind, Home, Tv, Zap, Wrench, Star, Shield,
  CheckCircle2,
} from 'lucide-react';
import { Room, ROOM_TYPE_LABELS, BED_TYPE_LABELS } from '@/types/room';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import BookingForm from '@/components/dashboard/BookingForm';

interface HotelRoomDrawerProps {
  room: Room | null;
  property: {
    _id: string;
    price: number;
    type?: string;
    listingType: string;
    availability: string;
    shortTermAmenities?: any;
    currency?: string;
    minNights?: number;
    maxNights?: number;
    cleaningFee?: number;
    serviceFee?: number;
    isInstantBookable?: boolean;
    cancellationPolicy?: string;
    advanceNoticeDays?: number;
    bookingWindowDays?: number;
    weeklyDiscountPercent?: number;
    monthlyDiscountPercent?: number;
    pricingUnit?: 'nightly' | 'weekly' | 'monthly';
    unavailableDates?: Array<{ from: string; to: string }>;
    rating?: number;
    reviewCount?: number;
    agentId?: any;
    ownerId?: any;
  };
  onClose: () => void;
}

const AMENITY_ROWS: { key: keyof Room['amenities']; label: string; icon: any }[] = [
  { key: 'hasWifi',            label: 'Free WiFi',          icon: Wifi    },
  { key: 'hasAirConditioning', label: 'Air conditioning',   icon: Wind    },
  { key: 'hasPrivateBathroom', label: 'Private bathroom',   icon: Home    },
  { key: 'hasTv',              label: 'Flat-screen TV',     icon: Tv      },
  { key: 'hasBalcony',         label: 'Balcony / terrace',  icon: Zap     },
  { key: 'hasDesk',            label: 'Work desk',          icon: Wrench  },
  { key: 'hasMinibar',         label: 'Minibar',            icon: Star    },
  { key: 'hasSafe',            label: 'In-room safe',       icon: Shield  },
];

export const HotelRoomDrawer: React.FC<HotelRoomDrawerProps> = ({ room, property, onClose }) => {
  const { formatMoney } = useCurrency();
  const [imgIdx, setImgIdx] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Reset gallery index when room changes
  useEffect(() => { setImgIdx(0); }, [room?._id]);

  // Trap focus & close on Escape
  useEffect(() => {
    if (!room) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [room, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = room ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [room]);

  if (!room) return null;

  const images = room.images ?? [];
  const nightly = room.price ?? property.price;
  const presentAmenities = AMENITY_ROWS.filter(a => room.amenities?.[a.key]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={room.name}
        className={cn(
          // Desktop: right slide-over
          'fixed top-0 right-0 h-full z-50 bg-white shadow-2xl',
          'w-full sm:w-[520px] lg:w-[580px]',
          'flex flex-col overflow-hidden',
          'animate-in slide-in-from-right duration-300',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBEBEB] shrink-0">
          <div>
            <h2 className="text-[17px] font-semibold text-[#222222] leading-tight">{room.name}</h2>
            <p className="text-[13px] text-[#717171] mt-0.5">
              {ROOM_TYPE_LABELS[room.roomType]}
              {room.roomNumber && ` · Room #${room.roomNumber}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Image gallery ── */}
          <div className="relative aspect-video bg-[#F7F7F7]">
            {images.length > 0 ? (
              <>
                <img
                  src={images[imgIdx]?.url}
                  alt={`${room.name} photo ${imgIdx + 1}`}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#222222]" />
                    </button>
                    <button
                      onClick={() => setImgIdx(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-[#222222]" />
                    </button>
                    <div className="absolute bottom-2 right-3 text-[12px] font-semibold bg-black/50 text-white px-2 py-1 rounded-full">
                      {imgIdx + 1} / {images.length}
                    </div>
                    {/* Strip thumbnails */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIdx(i)}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full transition-all',
                            i === imgIdx ? 'bg-white scale-125' : 'bg-white/50',
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BedDouble className="w-16 h-16 text-[#DDDDDD]" />
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 px-6 py-3 overflow-x-auto hide-scrollbar border-b border-[#EBEBEB]">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    'w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all',
                    i === imgIdx ? 'border-[#222222]' : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* ── Room meta ── */}
          <div className="px-6 py-5 border-b border-[#EBEBEB]">
            <div className="flex flex-wrap gap-4 text-[14px] text-[#717171]">
              <span className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4" />
                {room.bedCount} × {BED_TYPE_LABELS[room.bedType]}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Up to {room.maxGuests} guests
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-[24px] font-bold text-[#222222]">{formatMoney(nightly)}</span>
              <span className="text-[15px] text-[#717171]">/ night</span>
              {room.cleaningFee && room.cleaningFee > 0 && (
                <span className="text-[13px] text-[#B0B0B0] ml-2">+ {formatMoney(room.cleaningFee)} cleaning</span>
              )}
            </div>
          </div>

          {/* ── Amenities ── */}
          {presentAmenities.length > 0 && (
            <div className="px-6 py-5 border-b border-[#EBEBEB]">
              <h3 className="text-[15px] font-semibold text-[#222222] mb-3">Room amenities</h3>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {presentAmenities.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-2 text-[14px] text-[#222222]">
                    <CheckCircle2 className="w-4 h-4 text-[#008A05] shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Booking form ── */}
          <div className="px-6 py-5">
            <h3 className="text-[15px] font-semibold text-[#222222] mb-4">Reserve this room</h3>
            <BookingForm
              property={{
                ...property,
                propertyType: property.type,
              } as any}
              initialRoomId={room._id}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default HotelRoomDrawer;
