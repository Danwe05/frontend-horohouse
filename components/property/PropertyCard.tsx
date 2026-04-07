"use client";

import { Heart, Bed, Bath, Ruler, Share2, Flag, ShieldCheck, Cpu, Users, Calendar, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useCallback, useRef } from "react";
import type { StaticImageData } from "next/image";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCurrency } from "@/hooks/useCurrency";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReportModal } from "./ReportModal";
import { formatTimeAgo, isNew } from "@/lib/propertyutils";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PropertyCardProps {
  id: string;
  image: string | StaticImageData;
  images?: (string | StaticImageData)[];
  price: number | string;
  timeAgo: string;
  address: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  tag?: string;
  initialIsFavorite?: boolean;
  listingType?: "rent" | "sale" | "short_term";
  pricingUnit?: "nightly" | "weekly" | "monthly";
  maxGuests?: number;
  isCompared?: boolean;
  onCompareChange?: (id: string, checked: boolean) => void;
  showCompare?: boolean;
  isVerified?: boolean;
  isBlockchainVerified?: boolean;
  availableFrom?: string;
  minNights?: number;
  rating?: number;
  reviewCount?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPriceSuffix(listingType: PropertyCardProps["listingType"], pricingUnit: string | undefined, t: any) {
  if (listingType === "rent") return t.propertyCard?.perMonth;
  if (listingType === "short_term") {
    if (pricingUnit === "weekly") return t.propertyCardExtras?.perWeek || "/wk";
    if (pricingUnit === "monthly") return t.propertyCard?.perMonth;
    return t.propertyCardExtras?.perNight || "/night";
  }
  return null;
}

function getListingLabel(listingType: PropertyCardProps["listingType"], t: any) {
  switch (listingType) {
    case "short_term": return t.propertyCardExtras.shortStay;
    case "rent": return t.propertyCardExtras.forRent;
    default: return t.propertyCardExtras.forSale;
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const PropertyCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl animate-pulse">
    <div className="h-56 bg-[#F7F7F7] w-full rounded-2xl mb-3" />
    <div className="space-y-2 px-0.5">
      <div className="flex justify-between">
        <div className="h-4 bg-[#F7F7F7] rounded-lg w-2/5" />
        <div className="h-4 bg-[#F7F7F7] rounded-lg w-1/5" />
      </div>
      <div className="h-4 bg-[#F7F7F7] rounded-lg w-3/4" />
      <div className="h-4 bg-[#F7F7F7] rounded-lg w-1/2" />
      <div className="h-4 bg-[#F7F7F7] rounded-lg w-1/3" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Stop-propagation wrapper (unchanged)
// ---------------------------------------------------------------------------

const StopPropagationWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("pointerdown", stop);
    el.addEventListener("touchstart", stop);
    el.addEventListener("mousedown", stop);
    return () => {
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("mousedown", stop);
    };
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const PropertyCard = ({
  id, image, images, price, timeAgo, address, beds, baths, sqft, tag,
  initialIsFavorite, listingType = "sale", isCompared = false,
  onCompareChange, showCompare = false, isVerified = false,
  isBlockchainVerified = false, pricingUnit, maxGuests,
  availableFrom, minNights, rating, reviewCount,
  onMouseEnter, onMouseLeave,
}: PropertyCardProps) => {
  const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();
  const { formatMoney } = useCurrency();
  const { t } = useLanguage();
  const favorited = initialIsFavorite !== undefined ? initialIsFavorite : isFavorite(id);
  const [localFavorite, setLocalFavorite] = useState(favorited);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { isAuthenticated } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageHovered, setImageHovered] = useState(false);

  useEffect(() => {
    if (isLoaded && initialIsFavorite === undefined) setLocalFavorite(isFavorite(id));
  }, [isLoaded, id, isFavorite, initialIsFavorite]);

  const getImageSrc = (img: string | StaticImageData): string | null => {
    if (typeof img === "string") return img.trim() || null;
    return img.src || null;
  };

  const imageArray = (images && images.length > 0 ? images : [image])
    .map(getImageSrc)
    .filter((src): src is string => src !== null && src.length > 0);

  const hasMultipleImages = imageArray.length > 1;
  const showNewBadge = isNew(timeAgo) && !tag;
  const displayTag = showNewBadge ? t.propertyCardExtras.new : tag;
  const formattedPrice = typeof price === "number" ? formatMoney(price) : price;
  const priceSuffix = getPriceSuffix(listingType, pricingUnit, t);
  const isShortTerm = listingType === "short_term";

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) {
      toast.error(t.messages.loginRequired, { description: t.messages.loginRequiredDesc });
      return;
    }
    if (isTogglingFavorite) return;
    const prev = localFavorite;
    setLocalFavorite(!prev);
    setIsTogglingFavorite(true);
    try {
      if (prev) { await apiClient.removeFromFavorites(id); removeFavorite(id); toast.success(t.messages.favoriteRemoved); }
      else { await apiClient.addToFavorites(id); addFavorite(id); toast.success(t.messages.favoriteAdded); }
    } catch (error: any) {
      setLocalFavorite(prev);
      toast.error(t.propertyCardExtras.failedToUpdateFavorites || "Failed to update favorites", {
        description: error?.response?.data?.message || "Please try again later.",
      });
    } finally { setIsTogglingFavorite(false); }
  }, [isAuthenticated, isTogglingFavorite, localFavorite, id, addFavorite, removeFavorite]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/properties/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: address, url });
      else { await navigator.clipboard.writeText(url); toast.success(t.messages.copiedToClipboard); }
    } catch { /* cancelled */ }
  }, [id, address]);

  const handleReport = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setReportOpen(true);
  }, []);

  const handleCompare = useCallback((checked: boolean) => { onCompareChange?.(id, checked); }, [id, onCompareChange]);

  if (imageArray.length === 0) return null;

  return (
    <>
      <ReportModal propertyId={id} open={reportOpen} onClose={() => setReportOpen(false)} />

      <div
        className={cn("block relative group", isCompared && "ring-2 ring-[#1A56DB] rounded-2xl")}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Compare checkbox */}
        {showCompare && (
          <div className="absolute top-3 left-3 z-20" onClick={(e) => e.preventDefault()}>
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm border border-[#DDDDDD]">
              <Checkbox
                checked={isCompared}
                onCheckedChange={handleCompare}
                aria-label={t.propertyCardExtras?.compareThisProperty || "Compare this property"}
              />
            </div>
          </div>
        )}

        <Link href={`/properties/${id}`} className="block">

          {/* ── Image section ── */}
          <StopPropagationWrapper
            className="relative overflow-hidden rounded-2xl mb-3"
            // @ts-ignore — native event on div
            onMouseEnter={() => setImageHovered(true)}
            onMouseLeave={() => setImageHovered(false)}
          >
            <Carousel
              className="w-full"
              opts={{ loop: true }}
              setApi={(api) => {
                if (!api) return;
                setActiveIndex(api.selectedScrollSnap());
                api.on("select", () => setActiveIndex(api.selectedScrollSnap()));
              }}
            >
              <CarouselContent className="ml-0">
                {imageArray.map((imgSrc, index) => (
                  <CarouselItem key={index} className="pl-0">
                    <div className="relative overflow-hidden rounded-2xl">
                      <img
                        src={imgSrc}
                        alt={`${address} — photo ${index + 1}`}
                        loading="lazy"
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {hasMultipleImages && (
                <div onClick={(e) => e.preventDefault()}>
                  <CarouselPrevious className="left-2 w-7 h-7 bg-white/90 border-0 text-[#222222] hover:bg-white opacity-0 group-hover:opacity-100 shadow-md transition-all duration-200" />
                  <CarouselNext className="right-2 w-7 h-7 bg-white/90 border-0 text-[#222222] hover:bg-white opacity-0 group-hover:opacity-100 shadow-md transition-all duration-200" />
                </div>
              )}
            </Carousel>

            {/* Dot indicators */}
            {hasMultipleImages && (
              <div
                className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                {imageArray.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "block rounded-full transition-all duration-200",
                      i === activeIndex ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/60"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Listing type badge — top left */}
            <div
              className={cn("absolute top-3 z-10", showCompare ? "left-12" : "left-3")}
            >
              {listingType && (
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide text-fwhite",
                  isShortTerm ? "bg-white" : listingType === "rent" ? "bg-white" : "bg-white"
                )}>
                  {getListingLabel(listingType, t)}
                </span>
              )}
              {showNewBadge && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide text-white bg-[#059669] ml-1">
                  {t.propertyCardExtras.new}
                </span>
              )}
              {displayTag && !showNewBadge && tag && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide text-white bg-[#1A56DB] ml-1">
                  {displayTag}
                </span>
              )}
            </div>

            {/* Heart + Share — top right */}
            <div
              className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
              onClick={(e) => e.preventDefault()}
            >
              <button
                onClick={handleShare}
                aria-label={t.propertyCardExtras?.shareThisProperty || "Share"}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform opacity-0 group-hover:opacity-100"
              >
                <Share2 className="h-3.5 w-3.5 text-[#222222]" />
              </button>

              <button
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                aria-label={localFavorite ? t.propertyCardExtras.unfavorite : t.propertyCardExtras.favorite}
                aria-pressed={localFavorite}
                className="w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-50"
              >
                <Heart
                  className={cn(
                    "h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-colors",
                    localFavorite
                      ? "fill-[#FF385C] text-[#FF385C]"
                      : "fill-black/20 text-white stroke-white"
                  )}
                />
              </button>
            </div>

            {/* Verification strip */}
            {(isVerified || isBlockchainVerified) && (
              <div
                className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-700/40 backdrop-blur-sm rounded-b-2xl"
                onClick={(e) => e.preventDefault()}
              >
                {isVerified && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-white">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-emerald-300">{t.propertyCardExtras.verified}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t.propertyCardExtras.verifiedTooltip}</TooltipContent>
                  </Tooltip>
                )}
                {isVerified && isBlockchainVerified && <span className="w-px h-3 bg-white/30 shrink-0" />}
                {isBlockchainVerified && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-white">
                        <Cpu className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-violet-300">{t.propertyCardExtras.blockchainVerified}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t.propertyCardExtras.blockchainVerifiedTooltip}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </StopPropagationWrapper>

          {/* ── Text content — Airbnb layout ── */}
          <div className="px-0.5">

            {/* Row 1: address + rating */}
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <p className="text-[14px] capitalize font-semibold text-[#222222] truncate leading-snug flex-1">
                {address}
              </p>
              {rating !== undefined ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="text-[14px] font-semibold text-[#222222]">{rating.toFixed(1)}</span>
                  {reviewCount !== undefined && reviewCount > 0 && (
                    <span className="text-[13px] text-[#717171]">({reviewCount})</span>
                  )}
                </div>
              ) : (
                <span className="text-[13px] text-[#717171] shrink-0 italic">{t.propertyCardExtras.noReviews}</span>
              )}
            </div>

            {/* Row 2: meta info — beds / baths / sqft / guests */}
            <div className="flex items-center gap-2 text-[14px] text-[#717171] mb-0.5">
              {beds !== undefined && beds > 0 && (
                <span>{beds} {beds === 1 ? "bed" : "beds"}</span>
              )}
              {beds !== undefined && beds > 0 && baths !== undefined && baths > 0 && (
                <span className="text-[#DDDDDD]">·</span>
              )}
              {baths !== undefined && baths > 0 && (
                <span>{baths} {baths === 1 ? "bath" : "baths"}</span>
              )}
              {sqft && (baths !== undefined && baths > 0 || beds !== undefined && beds > 0) && (
                <span className="text-[#DDDDDD]">·</span>
              )}
              {sqft && <span>{sqft}</span>}
              {isShortTerm && maxGuests !== undefined && maxGuests > 0 && (
                <>
                  {(beds !== undefined && beds > 0 || baths !== undefined && baths > 0 || sqft) && (
                    <span className="text-[#DDDDDD]">·</span>
                  )}
                  <span>{maxGuests} guests</span>
                </>
              )}
            </div>

            {/* Row 3: availability for short-term */}
            {isShortTerm && (availableFrom || minNights) && (
              <div className="flex items-center gap-2 text-[13px] text-[#717171] mb-0.5">
                {availableFrom && (
                  <span>{t.propertyCardExtras.availableFrom.replace("{date}", availableFrom)}</span>
                )}
                {availableFrom && minNights && <span className="text-[#DDDDDD]">·</span>}
                {minNights && (
                  <span>{t.propertyCardExtras.minNights.replace("{count}", minNights.toString())}</span>
                )}
              </div>
            )}

            {/* Row 4: price — Airbnb bolds the price, unit is regular weight */}
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[15px] font-bold text-[#222222]">{formattedPrice}</span>
              {priceSuffix && (
                <span className="text-[14px] font-normal text-[#222222]">{priceSuffix}</span>
              )}
            </div>

            {/* Row 5: report link — very subtle, far right */}
            <div className="flex justify-end mt-1.5">
              <button
                onClick={handleReport}
                aria-label={t.propertyCardExtras?.reportThisListing || "Report"}
                className="text-[12px] text-[#717171] hover:text-[#222222] underline underline-offset-2 transition-colors opacity-0 group-hover:opacity-100"
              >
                {t.propertyCardExtras?.report}
              </button>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
};

// Moon icon
const Moon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default PropertyCard;