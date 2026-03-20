'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Droplets, Zap, Star, Users, Clock,
  CheckCircle2, Bed, Bath, Ruler, Heart, Share2,
  Flag, ShieldCheck, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ReportModal } from '../property/ReportModal';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

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

const WATER_LABELS: Record<string, string> = {
  camwater:              'CAMWATER',
  borehole:              'Borehole',
  camwater_and_borehole: 'Dual water',
  well:                  'Well',
  tanker:                'Tanker',
};

const ELECTRICITY_LABELS: Record<string, string> = {
  none:                'ENEO only',
  solar:               'Solar',
  generator:           'Generator',
  solar_and_generator: 'Solar + Gen',
};

function getImageSrc(img: { url: string } | string): string {
  return typeof img === 'string' ? img : img.url;
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
  const { formatMoney } = useCurrency();

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
      toast.error('Login required', { description: 'Please login to save properties.' });
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
        toast.success('Removed from favorites');
      } else {
        await apiClient.addToFavorites(id);
        addFavorite(id);
        toast.success('Added to favorites');
      }
    } catch {
      setLocalFavorite(prev);
      toast.error('Failed to update favorites');
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isAuthenticated, isTogglingFavorite, localFavorite, id, addFavorite, removeFavorite]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch { /* cancelled */ }
  }, [id, property.title]);

  // ── Derived values ────────────────────────────────────────────────────────

  const distance  = formatDistance(sd?.campusProximityMeters);
  const perPerson = sd?.pricePerPersonMonthly;
  const beds      = property.amenities?.bedrooms;
  const baths     = property.amenities?.bathrooms;
  const sqft      = property.area;

  const waterLabel       = sd?.waterSource ? WATER_LABELS[sd.waterSource] : null;
  const electricityLabel = sd?.electricityBackup ? ELECTRICITY_LABELS[sd.electricityBackup] : null;
  const hasGoodWater     = sd?.waterSource && sd.waterSource !== 'well' && sd.waterSource !== 'tanker';
  const hasBackup        = sd?.electricityBackup && sd.electricityBackup !== 'none';

  return (
    <>
      <ReportModal propertyId={id} open={reportOpen} onClose={() => setReportOpen(false)} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="block relative group"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link href={`/properties/${id}`}>
          <Card className="overflow-hidden shadow-none py-1-slate-200 transition-all duration-200 hover:shadow-md hover py-1-slate-300 py-0">

            {/* ── Image carousel ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden">
              <Carousel
                className="w-full"
                opts={{ loop: true }}
                setApi={(api) => {
                  if (!api) return;
                  setActiveIndex(api.selectedScrollSnap());
                  api.on('select', () => setActiveIndex(api.selectedScrollSnap()));
                }}
              >
                <CarouselContent className="ml-0">
                  {imageArray.map((src, i) => (
                    <CarouselItem key={i} className="pl-0">
                      <img
                        src={src}
                        alt={`${property.title} — photo ${i + 1}`}
                        loading="lazy"
                        className="w-full h-52 object-cover transition-transform duration-500"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {hasMultipleImages && (
                  <div onClick={e => e.preventDefault()}>
                    <CarouselPrevious className="left-2 bg-black/40 text-white hover:text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm py-1-0 hover:bg-black/60 transition-all duration-200" />
                    <CarouselNext className="right-2 bg-black/40 text-white hover:text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm py-1-0 hover:bg-black/60 transition-all duration-200" />
                  </div>
                )}
              </Carousel>

              {/* Dot indicators */}
              {hasMultipleImages && (
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 flex items-center gap-1 z-10',
                    sd?.isStudentApproved ? 'bottom-8' : 'bottom-2',
                  )}
                  onClick={e => e.preventDefault()}
                >
                  {imageArray.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'block rounded-full transition-all duration-200',
                        i === activeIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50',
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Student-Approved verification strip */}
              {sd?.isStudentApproved && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md"
                  onClick={e => e.preventDefault()}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-semibold tracking-wide text-emerald-300">
                    Student Approved
                  </span>
                </div>
              )}

              {/* Top-left badges */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                <Badge className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5">
                  Student Housing
                </Badge>
                {compatibilityScore !== undefined && (
                  <Badge className={cn(
                    'text-[10px] font-bold px-2 py-0.5',
                    compatibilityScore >= 80
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-800',
                  )}>
                    {compatibilityScore}% Match
                  </Badge>
                )}
              </div>

              {/* Action buttons — top right */}
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
                onClick={e => e.preventDefault()}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleShare}
                      aria-label="Share"
                      className="w-8 h-8 bg-card rounded-full flex items-center justify-center transition-transform shadow-md"
                    >
                      <Share2 className="h-3.5 w-3.5 text-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Share</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      aria-label={localFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      className="w-8 h-8 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md disabled:opacity-50"
                    >
                      <Heart className={cn(
                        'h-4 w-4 transition-colors',
                        localFavorite ? 'fill-destructive text-destructive' : 'text-foreground',
                      )} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {localFavorite ? 'Unfavorite' : 'Favorite'}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Image counter */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 right-3 z-10 bg-black/50 text-white text-[10px] px-1.5 rounded backdrop-blur-sm font-medium">
                  {activeIndex + 1}/{imageArray.length}
                </div>
              )}
            </div>

            {/* ── Card content ───────────────────────────────────────────── */}
            <CardContent className="pb-4 pt-3">

              {/* Price row */}
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground leading-tight">
                    {formatMoney(perPerson || property.price)}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 rounded px-1">
                    /mo{perPerson ? ' p.p.' : ''}
                  </span>
                </div>
                {property.averageRating ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold">{property.averageRating.toFixed(1)}</span>
                    {property.reviewCount ? (
                      <span className="text-xs text-muted-foreground">· {property.reviewCount}</span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/60 italic">No reviews</span>
                )}
              </div>

              {/* Address */}
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {property.address || property.city}
                {property.neighborhood ? ` · ${property.neighborhood}` : ''}
              </p>

              {/* Student-specific info row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2.5 pb-2.5 border-py-1-b py-1-dashed">
                {distance && (
                  <div className="flex items-center gap-1 text-blue-600 font-semibold">
                    <MapPin className="h-3 w-3" />
                    {distance} to campus
                  </div>
                )}
                {sd?.walkingMinutes && (
                  <span className="text-slate-400">{sd.walkingMinutes} min walk</span>
                )}
                {sd?.availableBeds !== undefined && sd.availableBeds > 0 && (
                  <div className="flex items-center gap-1 text-teal-600 font-semibold">
                    <Users className="h-3 w-3" />
                    {sd.availableBeds} bed{sd.availableBeds > 1 ? 's' : ''} free
                  </div>
                )}
              </div>

              {/* Infrastructure badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {waterLabel && (
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-bold px-2 rounded-full py-1',
                    hasGoodWater
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-slate-100 text-slate-500',
                  )}>
                    <Droplets className="w-2.5 h-2.5" />
                    {waterLabel}
                  </span>
                )}
                {electricityLabel && (
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-bold px-2 rounded-full py-1',
                    hasBackup
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-slate-100 text-slate-500',
                  )}>
                    <Zap className="w-2.5 h-2.5" />
                    {electricityLabel}
                  </span>
                )}
                {sd?.curfewTime && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 rounded-full py-1 bg-slate-100 text-slate-500">
                    <Clock className="w-2.5 h-2.5" />
                    Gate {sd.curfewTime}
                  </span>
                )}
                {sd?.genderRestriction && sd.genderRestriction !== 'none' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 rounded-full py-1 bg-slate-100 text-slate-500">
                    {sd.genderRestriction === 'women_only' ? '♀ Women only' : '♂ Men only'}
                  </span>
                )}
              </div>

              {/* Stats row + report */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  {sqft !== undefined && sqft > 0 && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>{sqft} m²</span>
                    </div>
                  )}
                  {beds !== undefined && beds > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="h-3.5 w-3.5" />
                      <span>{beds}</span>
                    </div>
                  )}
                  {baths !== undefined && baths > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      <span>{baths}</span>
                    </div>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setReportOpen(true); }}
                      aria-label="Report listing"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Flag className="h-3.5 w-3.5" /> Report
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Report listing</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </>
  );
}