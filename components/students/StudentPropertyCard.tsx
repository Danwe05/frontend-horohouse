'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Star, Heart, Share2, BedDouble
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { ReportModal } from '../property/ReportModal';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentDetails {
  campusProximityMeters?: number;
  nearestCampus?: string;
  walkingMinutes?: number;
  taxiMinutes?: number;
  waterSource?: string;
  electricityBackup?: string;
  furnishingStatus?: string;
  genderRestriction?: string;
  curfewTime?: string;
  isStudentApproved?: boolean;
  availableBeds?: number;
  pricePerPersonMonthly?: number;
}

interface StudentPropertyCardProps {
  property: {
    _id: string;
    id?: string;
    title: string;
    price: number;
    city: string;
    address?: string;
    neighborhood?: string;
    images?: Array<{ url: string } | string>;
    amenities?: { bedrooms?: number; bathrooms?: number };
    area?: number;
    studentDetails?: StudentDetails;
    isStudentFriendly?: boolean;
    isVerified?: boolean;
    averageRating?: number;
    reviewCount?: number;
    createdAt?: string;
  };
  compatibilityScore?: number;
  index?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDistance(meters?: number): string | null {
  if (!meters) return null;
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

function getImageSrc(img: { url: string } | string): string {
  return typeof img === 'string' ? img : img.url;
}

function formatFCFA(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : n.toLocaleString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentPropertyCard({
  property,
  compatibilityScore,
  index = 0,
  onMouseEnter,
  onMouseLeave,
}: StudentPropertyCardProps) {
  const id = property._id || property.id || '';
  const sd = property.studentDetails;
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.card || {};

  const { isAuthenticated } = useAuth();
  const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();

  const [localFavorite, setLocalFavorite] = useState(isFavorite(id));
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isLoaded) setLocalFavorite(isFavorite(id));
  }, [isLoaded, id, isFavorite]);

  // ── Images ────────────────────────────────────────────────────────────────

  const imageArray = (property.images ?? [])
    .map(getImageSrc)
    .filter(Boolean);

  if (imageArray.length === 0) {
    imageArray.push('https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=800&auto=format&fit=crop');
  }

  const hasMultipleImages = imageArray.length > 1;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error(s.loginReq || 'Login required', { description: s.loginDesc || 'Please login to save properties.' });
      return;
    }
    if (isTogglingFavorite) return;
    const prev = localFavorite;
    setLocalFavorite(!prev);
    setIsTogglingFavorite(true);
    try {
      if (prev) {
        await apiClient.removeFromFavorites(id);
        removeFavorite(id);
        toast.success(s.removedFav || 'Removed from favorites');
      } else {
        await apiClient.addToFavorites(id);
        addFavorite(id);
        toast.success(s.addedFav || 'Added to favorites');
      }
    } catch {
      setLocalFavorite(prev);
      toast.error(s.failedFav || 'Failed to update favorites');
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isAuthenticated, isTogglingFavorite, localFavorite, id, addFavorite, removeFavorite, s]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(s.linkCopied || 'Link copied to clipboard');
      }
    } catch { /* cancelled */ }
  }, [id, property.title, s]);

  // ── Derived values ────────────────────────────────────────────────────────

  const distance = formatDistance(sd?.campusProximityMeters);
  const perPerson = sd?.pricePerPersonMonthly;

  return (
    <>
      <ReportModal propertyId={id} open={reportOpen} onClose={() => setReportOpen(false)} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="group relative cursor-pointer flex flex-col h-full w-full"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link href={`/properties/${id}`} className="flex flex-col h-full">
          
          {/* Image Container */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-[#F7F7F7] mb-3 shrink-0">
            <Carousel
              className="w-full"
              opts={{ loop: true }}
              setApi={(api) => {
                if (!api) return;
                setActiveIndex(api.selectedScrollSnap());
                api.on('select', () => setActiveIndex(api.selectedScrollSnap()));
              }}
            >
              <CarouselContent className="-ml-0">
                {imageArray.map((src, i) => (
                  <CarouselItem key={i} className="pl-0">
                    {/* The aspect ratio must be applied to an inner div here */}
                    <div className="relative w-full aspect-[4/3] bg-[#F7F7F7] overflow-hidden">
                      <img
                        src={src}
                        alt={`${property.title} — photo ${i + 1}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {hasMultipleImages && (
                <div onClick={e => e.preventDefault()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white text-[#222222] border-none shadow-sm flex items-center justify-center rounded-full" />
                  <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white text-[#222222] border-none shadow-sm flex items-center justify-center rounded-full" />
                </div>
              )}
            </Carousel>

            {/* Top Left Badges (Truncated to prevent overflow) */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-[calc(100%-3rem)]">
              {sd?.isStudentApproved && (
                <span className="bg-white/90 text-[#222222] text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm truncate">
                  {s.studentApproved || 'Student Approved'}
                </span>
              )}
              {compatibilityScore !== undefined && (
                <span className={cn(
                  "text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm truncate w-fit",
                  compatibilityScore >= 80 ? "bg-[#008A05] text-white" : "bg-white/90 text-[#222222]"
                )}>
                  {compatibilityScore}% {s.match || 'Match'}
                </span>
              )}
            </div>

            {/* Top Right Actions */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2" onClick={e => e.preventDefault()}>
              <button
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
              >
                <Heart className={cn(
                  "w-6 h-6 drop-shadow-sm transition-colors",
                  localFavorite ? "fill-[#FF385C] text-[#FF385C]" : "fill-black/30 text-white stroke-[1.5]"
                )} />
              </button>
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
              >
                <Share2 className="w-5 h-5 text-white drop-shadow-sm stroke-[2]" />
              </button>
            </div>

            {/* Image Indicator Dots */}
            {hasMultipleImages && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {imageArray.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'block rounded-full transition-all duration-300',
                      i === activeIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/60'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col flex-1 min-w-0 space-y-1">
            
            {/* Title & Rating Row */}
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[#222222] text-[16px] leading-tight truncate">
                  {property.title}
                </h3>
              </div>
              {property.averageRating ? (
                <div className="flex items-center gap-1 shrink-0 pt-[2px]">
                  <Star className="h-3.5 w-3.5 fill-[#222222] text-[#222222]" />
                  <span className="text-[14px] text-[#222222] leading-none">{property.averageRating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>

            {/* Location */}
            <p className="text-[14px] text-[#717171] truncate w-full">
              {property.neighborhood ? `${property.neighborhood}, ${property.city}` : property.city}
            </p>

            {/* Distance / Walking Time */}
            <div className="text-[14px] text-[#717171] flex items-center gap-2 truncate w-full">
              {distance && <span className="truncate">{distance} {s.toCampus || 'to campus'}</span>}
              {distance && sd?.walkingMinutes && <span>·</span>}
              {sd?.walkingMinutes && <span className="truncate">{sd.walkingMinutes} {s.minWalk || 'min walk'}</span>}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[16px] font-semibold text-[#222222]">
                {formatFCFA(perPerson || property.price)} FCFA
              </span>
              <span className="text-[14px] text-[#222222] truncate">
                {s.mo || 'month'}{perPerson ? (s.pp || ' per person') : ''}
              </span>
            </div>
          </div>

        </Link>
      </motion.div>
    </>
  );
}