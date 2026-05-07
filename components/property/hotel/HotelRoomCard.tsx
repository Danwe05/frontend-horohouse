'use client';

import React, { useState } from 'react';
import {
  BedDouble, Users, ChevronLeft, ChevronRight,
  Wifi, Wind, Home, Tv, Zap, Wrench, Star, Shield,
} from 'lucide-react';
import { Room, ROOM_TYPE_LABELS, BED_TYPE_LABELS } from '@/types/room';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface HotelRoomCardProps {
  room: Room;
  propertyPrice: number;  // fallback if room has no price
  onSelect: (room: Room) => void;
}

const AMENITY_ICONS: { key: keyof Room['amenities']; label: string; icon: any }[] = [
  { key: 'hasWifi',           label: 'WiFi',            icon: Wifi   },
  { key: 'hasAirConditioning',label: 'A/C',             icon: Wind   },
  { key: 'hasPrivateBathroom',label: 'Private Bath',    icon: Home   },
  { key: 'hasTv',             label: 'TV',              icon: Tv     },
  { key: 'hasBalcony',        label: 'Balcony',         icon: Zap    },
  { key: 'hasDesk',           label: 'Workspace',       icon: Wrench },
  { key: 'hasMinibar',        label: 'Minibar',         icon: Star   },
  { key: 'hasSafe',           label: 'Safe',            icon: Shield },
];

export const HotelRoomCard: React.FC<HotelRoomCardProps> = ({ room, propertyPrice, onSelect }) => {
  const { formatMoney } = useCurrency();
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const images = room.images ?? [];
  const nightly = room.price ?? propertyPrice;
  const topAmenities = AMENITY_ICONS.filter(a => room.amenities?.[a.key]).slice(0, 4);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx(i => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx(i => (i + 1) % images.length);
  };

  return (
    <div
      className="group bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-all duration-300 cursor-pointer flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(room)}
    >
      {/* Image carousel */}
      <div
        className="relative w-full aspect-[4/3] bg-[#F7F7F7] overflow-hidden"
      >
        {images.length > 0 ? (
          <>
            <img
              src={images[imgIdx]?.url}
              alt={room.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {images.length > 1 && hovered && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[#222222]" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-[#222222]" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        i === imgIdx ? 'bg-white scale-125' : 'bg-white/60',
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-12 h-12 text-[#DDDDDD]" />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[11px] font-bold bg-white/95 text-[#222222] px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
            {ROOM_TYPE_LABELS[room.roomType]}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Name + meta */}
        <div>
          <h3 className="font-semibold text-[15px] text-[#222222] leading-tight line-clamp-1">
            {room.name}
            {room.roomNumber && <span className="text-[#717171] font-normal"> · #{room.roomNumber}</span>}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-[13px] text-[#717171]">
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {room.bedCount} {BED_TYPE_LABELS[room.bedType]}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Up to {room.maxGuests}
            </span>
          </div>
        </div>

        {/* Amenity chips */}
        {topAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topAmenities.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center gap-1 text-[11px] text-[#717171] bg-[#F7F7F7] px-2 py-1 rounded-full"
              >
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#F0F0F0]">
          <div>
            <span className="text-[17px] font-bold text-[#222222]">{formatMoney(nightly)}</span>
            <span className="text-[13px] text-[#717171] ml-1">/ night</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onSelect(room); }}
            className="px-4 py-2 rounded-xl bg-[#222222] text-white text-[13px] font-semibold hover:bg-black transition-colors active:scale-95"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelRoomCard;
