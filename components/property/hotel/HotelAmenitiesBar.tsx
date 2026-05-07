'use client';

import React from 'react';
import {
  Wifi, Wind, Car, Waves, Dumbbell, Shield, Zap, Coffee,
  Utensils, Tv, Shirt, Dog, Accessibility, BriefcaseBusiness,
  ConciergeBell, Sparkles, type LucideIcon,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Amenities {
  hasWifi?: boolean;
  hasAirConditioning?: boolean;
  hasPool?: boolean;
  hasGym?: boolean;
  hasSecurity?: boolean;
  hasGenerator?: boolean;
  hasBreakfast?: boolean;
  hasKitchen?: boolean;
  hasTv?: boolean;
  hasWasher?: boolean;
  hasBalcony?: boolean;
  hasGarden?: boolean;
  petsAllowed?: boolean;
  wheelchairAccessible?: boolean;
  airportTransfer?: boolean;
  conciergeService?: boolean;
  dailyHousekeeping?: boolean;
  parkingSpaces?: number;
}

interface HotelAmenitiesBarProps {
  amenities: Amenities;
  shortTermAmenities?: Amenities;
  className?: string;
}

// ─── Pills definition ──────────────────────────────────────────────────────────

interface Pill {
  icon: LucideIcon;
  label: string;
  visible: boolean;
}

export const HotelAmenitiesBar: React.FC<HotelAmenitiesBarProps> = ({
  amenities,
  shortTermAmenities,
  className = '',
}) => {
  const a = amenities ?? {};
  const s = shortTermAmenities ?? {};

  const pills: Pill[] = [
    { icon: Wifi,           label: 'Free WiFi',         visible: !!s.hasWifi        },
    { icon: Waves,          label: 'Pool',               visible: !!a.hasPool        },
    { icon: Dumbbell,       label: 'Gym',                visible: !!a.hasGym         },
    { icon: Car,            label: 'Parking',            visible: (a.parkingSpaces ?? 0) > 0 },
    { icon: Wind,           label: 'Air conditioning',  visible: !!s.hasAirConditioning },
    { icon: Coffee,         label: 'Breakfast',         visible: !!s.hasBreakfast   },
    { icon: Utensils,       label: 'Restaurant',        visible: !!s.hasKitchen     },
    { icon: Tv,             label: 'TV',                 visible: !!s.hasTv          },
    { icon: Shirt,          label: 'Laundry',            visible: !!s.hasWasher      },
    { icon: Dog,            label: 'Pet friendly',       visible: !!s.petsAllowed    },
    { icon: Shield,         label: '24/7 Security',      visible: !!a.hasSecurity    },
    { icon: Zap,            label: 'Generator',          visible: !!a.hasGenerator   },
    { icon: Accessibility,  label: 'Accessible',         visible: !!s.wheelchairAccessible },
    { icon: BriefcaseBusiness, label: 'Airport transfer', visible: !!s.airportTransfer },
    { icon: ConciergeBell,  label: 'Concierge',          visible: !!s.conciergeService },
    { icon: Sparkles,       label: 'Daily housekeeping', visible: !!s.dailyHousekeeping },
  ].filter(p => p.visible);

  if (!pills.length) return null;

  return (
    <div className={`w-full overflow-x-auto hide-scrollbar ${className}`}>
      <div className="flex items-center gap-2.5 pb-1" style={{ minWidth: 'max-content' }}>
        {pills.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#DDDDDD] bg-white text-sm text-[#222222] font-medium whitespace-nowrap hover:border-[#222222] transition-colors shrink-0"
          >
            <Icon className="w-4 h-4 text-[#717171]" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotelAmenitiesBar;
