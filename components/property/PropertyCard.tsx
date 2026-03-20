"use client";

import { Heart, Bed, Bath, Ruler, Share2, Flag, ShieldCheck, Cpu, Users, Calendar, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  /** For short-term: show availability hint */
  availableFrom?: string;
  /** Minimum stay nights for short-term */
  minNights?: number;
  /** Average review rating (0–5) */
  rating?: number;
  /** Total number of reviews */
  reviewCount?: number;
  /** Called when the card is hovered — used to highlight the map pin */
  onMouseEnter?: () => void;
  /** Called when the cursor leaves the card */
  onMouseLeave?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getListingTypeConfig(listingType: PropertyCardProps["listingType"]) {
  switch (listingType) {
    case "short_term":
      return {
        accentClass: "bg-violet-600",
        borderClass: "border-violet-200 dark:border-violet-900",
        labelBg: "bg-violet-600",
        label: "Short Stay",
        dotColor: "bg-violet-500",
      };
    case "rent":
      return {
        accentClass: "bg-blue-600",
        borderClass: "border-blue-200 dark:border-blue-900",
        labelBg: "bg-blue-600",
        label: "For Rent",
        dotColor: "bg-blue-500",
      };
    default:
      return {
        accentClass: "bg-emerald-600",
        borderClass: "border-emerald-200 dark:border-emerald-900",
        labelBg: "bg-emerald-600",
        label: "For Sale",
        dotColor: "bg-emerald-500",
      };
  }
}

function getPriceSuffix(listingType: PropertyCardProps["listingType"], pricingUnit?: string) {
  if (listingType === "rent") return "/mo";
  if (listingType === "short_term") {
    if (pricingUnit === "weekly") return "/wk";
    if (pricingUnit === "monthly") return "/mo";
    return "/night";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const PropertyCardSkeleton = () => (
  <Card className="overflow-hidden border shadow-sm animate-pulse py-0">
    <div className="h-52 bg-muted w-full" />
    <CardContent className="pb-4 pt-3 space-y-3">
      <div className="h-5 bg-muted rounded w-2/3" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="flex gap-3">
        <div className="h-4 bg-muted rounded w-12" />
        <div className="h-4 bg-muted rounded w-12" />
        <div className="h-4 bg-muted rounded w-12" />
      </div>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Main component
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

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

const PropertyCard = ({
  id,
  image,
  images,
  price,
  timeAgo,
  address,
  beds,
  baths,
  sqft,
  tag,
  initialIsFavorite,
  listingType = "sale",
  isCompared = false,
  onCompareChange,
  showCompare = false,
  isVerified = false,
  isBlockchainVerified = false,
  pricingUnit,
  maxGuests,
  availableFrom,
  minNights,
  rating,
  reviewCount,
  onMouseEnter,
  onMouseLeave,
}: PropertyCardProps) => {
  const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();
  const { formatMoney } = useCurrency();
  const favorited = initialIsFavorite !== undefined ? initialIsFavorite : isFavorite(id);
  const [localFavorite, setLocalFavorite] = useState(favorited);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    if (isLoaded && initialIsFavorite === undefined) {
      setLocalFavorite(isFavorite(id));
    }
  }, [isLoaded, id, isFavorite, initialIsFavorite]);

  const { isAuthenticated } = useAuth();



  const [reportOpen, setReportOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const getImageSrc = (img: string | StaticImageData): string | null => {
    if (typeof img === "string") return img.trim() || null;
    return img.src || null;
  };

  const imageArray = (images && images.length > 0 ? images : [image])
    .map(getImageSrc)
    .filter((src): src is string => src !== null && src.length > 0);

  const hasMultipleImages = imageArray.length > 1;

  const showNewBadge = isNew(timeAgo) && !tag;
  const displayTag = showNewBadge ? "New" : tag;
  const formattedTime = formatTimeAgo(timeAgo);
  const formattedPrice = typeof price === 'number' ? formatMoney(price) : price;
  const priceSuffix = getPriceSuffix(listingType, pricingUnit);
  const typeConfig = getListingTypeConfig(listingType);

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        toast.error("Login required", { description: "Please login to add properties to your favorites." });
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
          toast.success("Removed from favorites");
        } else {
          await apiClient.addToFavorites(id);
          addFavorite(id);
          toast.success("Added to favorites");
        }
      } catch (error: any) {
        setLocalFavorite(prev);
        toast.error("Failed to update favorites", {
          description: error?.response?.data?.message || "Please try again later.",
        });
      } finally {
        setIsTogglingFavorite(false);
      }
    },
    [isAuthenticated, isTogglingFavorite, localFavorite, id, addFavorite, removeFavorite]
  );

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: address, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch { /* cancelled */ }
  }, [id, address]);

  const handleReport = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReportOpen(true);
  }, []);

  const handleCompare = useCallback((checked: boolean) => {
    onCompareChange?.(id, checked);
  }, [id, onCompareChange]);

  if (imageArray.length === 0) return null;

  const isShortTerm = listingType === "short_term";
  const isRent = listingType === "rent";

  return (
    <>
      <ReportModal propertyId={id} open={reportOpen} onClose={() => setReportOpen(false)} />

      <div className="block relative group" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {showCompare && (
          <div className="absolute top-3 left-3 z-20" onClick={(e) => e.preventDefault()}>
            <div className="w-6 h-6 bg-card rounded flex items-center justify-center shadow-md">
              <Checkbox checked={isCompared} onCheckedChange={handleCompare} aria-label="Compare this property" />
            </div>
          </div>
        )}

        <Link href={`/properties/${id}`} className="block">
          <Card className={cn(
            "overflow-hidden shadow-none border transition-all duration-200 py-0 hover:shadow-md",
            isCompared && "ring-2 ring-primary",
          )}>

            {/* ── Image carousel ── */}
            <StopPropagationWrapper className="relative overflow-hidden">
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
                      <img
                        src={imgSrc}
                        alt={`${address} — photo ${index + 1}`}
                        loading="lazy"
                        className="w-full h-52 object-cover transition-transform duration-500"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {hasMultipleImages && (
                  <div onClick={(e) => e.preventDefault()}>
                    <CarouselPrevious className="left-2 bg-black/40 text-white hover:text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm border-0 hover:bg-black/60 transition-all duration-200" />
                    <CarouselNext className="right-2 bg-black/40 text-white hover:text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm border-0 hover:bg-black/60 transition-all duration-200" />
                  </div>
                )}
              </Carousel>

              {/* Dot indicators */}
              {hasMultipleImages && (
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 transition-all duration-200",
                    (isVerified || isBlockchainVerified) ? "bottom-8" : "bottom-2"
                  )}
                  onClick={(e) => e.preventDefault()}
                >
                  {imageArray.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "block rounded-full transition-all duration-200",
                        i === activeIndex ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Verification strip */}
              {(isVerified || isBlockchainVerified) && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md"
                  onClick={(e) => e.preventDefault()}
                >
                  {isVerified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-white">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px] font-semibold tracking-wide text-emerald-300">Verified</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">This listing has been verified by our team</TooltipContent>
                    </Tooltip>
                  )}
                  {isVerified && isBlockchainVerified && <span className="w-px h-3 bg-white/30 shrink-0" />}
                  {isBlockchainVerified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-white">
                          <Cpu className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span className="text-[11px] font-semibold tracking-wide text-violet-300">Blockchain Verified</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">Ownership record secured on-chain</TooltipContent>
                    </Tooltip>
                  )}
                  <div className="ml-auto" />
                </div>
              )}

              {/* Listing type pill — top left, always visible */}
              <div
                className={cn(
                  "absolute top-3 z-10 flex items-center gap-1.5",
                  showCompare ? "left-12" : "left-3"
                )}
              >
                {/* <span className={cn("text-[11px] font-bold text-white px-2 py-0.5 rounded-full tracking-wide", typeConfig.labelBg)}>
                  {typeConfig.label}
                </span> */}
                {displayTag && !showNewBadge && (
                  <Badge className="bg-primary px-2 py-0.5">{displayTag}</Badge>
                )}
                {showNewBadge && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[11px] px-2 py-0">New</Badge>
                )}
              </div>

              {/* Action buttons */}
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
                onClick={(e) => e.preventDefault()}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleShare}
                      aria-label="Share this property"
                      className="w-8 h-8 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
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
                      aria-label={localFavorite ? "Remove from favorites" : "Add to favorites"}
                      aria-pressed={localFavorite}
                      className="w-8 h-8 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md disabled:opacity-50"
                    >
                      <Heart className={cn("h-4 w-4 transition-colors", localFavorite ? "fill-destructive text-destructive" : "text-foreground")} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{localFavorite ? "Unfavorite" : "Favorite"}</TooltipContent>
                </Tooltip>
              </div>

              {/* Short-term: image count badge */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 right-3 z-10 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm font-medium">
                  {activeIndex + 1}/{imageArray.length}
                </div>
              )}
            </StopPropagationWrapper>

            {/* ── Card content ── */}
            <CardContent className="pb-4 pt-3">

              {/* Price row */}
              <div className="mb-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground leading-tight">
                      {formattedPrice}
                    </span>
                    {priceSuffix && (
                      <span className={cn(
                        "text-xs font-semibold rounded px-1 py-0",
                        isShortTerm
                          ? "text-violet-600 bg-violet-50 dark:bg-violet-950 dark:text-violet-300"
                          : "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300"
                      )}>
                        {priceSuffix}
                      </span>
                    )}
                  </div>
                  {rating !== undefined ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
                      {reviewCount !== undefined && reviewCount > 0 && (
                        <span className="text-xs text-muted-foreground">· {reviewCount}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 italic shrink-0">No reviews</span>
                  )}
                </div>
              </div>

              {/* Address */}
              <p className="text-sm text-muted-foreground mb-2.5 truncate">{address}</p>

              {/* Short-term specific info row */}
              {isShortTerm && (maxGuests || minNights || availableFrom) && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5 pb-2.5 border-b border-dashed">
                  {maxGuests && maxGuests > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>Up to {maxGuests}</span>
                    </div>
                  )}
                  {minNights && (
                    <div className="flex items-center gap-1">
                      <Moon className="h-3 w-3 text-violet-500" />
                      <span>{minNights}+ nights</span>
                    </div>
                  )}
                  {availableFrom && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-violet-500" />
                      <span>Avail. {availableFrom}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Long-term rent specific row */}
              {/* {isRent && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-blue-400 mb-2.5">
                  <Clock className="h-3 w-3" />
                  <span>Long-term rental</span>
                </div>
              )} */}

              {/* Stats row */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  {sqft && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>{sqft}</span>
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
                  {/* For short-term, show guests in the stats row if not shown above */}
                  {isShortTerm && maxGuests !== undefined && maxGuests > 0 && !availableFrom && !minNights && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{maxGuests}</span>
                    </div>
                  )}
                </div>

                {/* Report button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleReport}
                      aria-label="Report this listing"
                      className="flex items-center hover:cursor-pointer gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
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
      </div>
    </>
  );
};

// Dummy Moon icon since lucide doesn't export it by default in all versions
const Moon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default PropertyCard;