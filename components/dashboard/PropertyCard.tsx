"use client";

import React, { useState } from "react";
import { 
  Heart, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Share2, 
  TrendingUp, 
  Star, 
  ShieldCheck, 
  Cpu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useCurrency } from "@/hooks/useCurrency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface PropertyCardProps {
  id: string;
  image: string;
  images?: string[];
  title: string;
  location: string;
  price: string | number;
  beds: number;
  baths: number;
  sqft: number;
  type?: string;
  status?: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  isBlockchainVerified?: boolean;
  viewCount?: number;
  favoriteCount?: number;
  isFavorite?: boolean;
  isOwner?: boolean;
  onUpdate?: () => void;
  timeAgo?: string;
  pricingUnit?: string;
  maxGuests?: number;
}

export const PropertyCard = ({
  id,
  image,
  images,
  title,
  location,
  price,
  beds,
  baths,
  sqft,
  type = "sale",
  status = "active",
  isFeatured = false,
  isVerified = false,
  isBlockchainVerified = false,
  viewCount = 0,
  isFavorite: initialIsFavorite = false,
  isOwner = false,
  onUpdate,
  timeAgo,
  pricingUnit,
  maxGuests,
}: PropertyCardProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { formatMoney } = useCurrency();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<any>();

  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  const imageArray = images && images.length > 0 ? images : [image];
  const hasMultipleImages = imageArray.length > 1;

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isTogglingFavorite) return;

    const previousState = isFavorite;
    setIsFavorite(!isFavorite); 

    try {
      setIsTogglingFavorite(true);
      if (previousState) {
        await apiClient.removeFromFavorites(id);
        toast.success("Removed from favorites");
      } else {
        await apiClient.addToFavorites(id);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      setIsFavorite(previousState);
      toast.error("Failed to update favorites");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteProperty(id);
      toast.success("Property deleted successfully");
      onUpdate?.();
    } catch (error: any) {
      toast.error("Failed to delete property");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/property/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch (error) { }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch (error) { }
    }
  };

  const handleToggleFeatured = async () => {
    try {
      await apiClient.togglePropertyFeatured(id, !isFeatured);
      toast.success(isFeatured ? "Property unfeatured" : "Property featured");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to update property");
    }
  };

  const displayImages = imageError
    ? ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500']
    : imageArray;

  const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
  const formattedPrice = !isNaN(numPrice) && numPrice > 0 ? formatMoney(numPrice) : 'Contact for price';

  // Construct property metadata string (e.g., "2 beds · 1 bath")
  const metaParts = [];
  if (beds > 0) metaParts.push(`${beds} bed${beds > 1 ? 's' : ''}`);
  if (baths > 0) metaParts.push(`${baths} bath${baths > 1 ? 's' : ''}`);
  if (sqft > 0) metaParts.push(`${sqft.toLocaleString()} sqft`);
  const metaString = metaParts.join(' · ');

  return (
    <Link 
      href={`/properties/${id}`} 
      className={cn(
        "block group cursor-pointer font-sans antialiased",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex flex-col gap-3">
        
        {/* ── Image Container ── */}
        <div className="relative aspect-[20/19] overflow-hidden rounded-[16px] bg-[#F7F7F7]">
          
          <Carousel
            className="w-full h-full"
            opts={{ loop: true }}
            setApi={(api) => {
              setCarouselApi(api);
              if (!api) return;
              setActiveIndex(api.selectedScrollSnap());
              api.on("select", () => setActiveIndex(api.selectedScrollSnap()));
            }}
          >
            <CarouselContent className="ml-0 h-full">
              {displayImages.map((img, index) => (
                <CarouselItem key={index} className="pl-0 h-full">
                  <img
                    src={img}
                    alt={`${title} - Image ${index + 1}`}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Guest Favorite / Status Badge */}
          {status !== 'active' ? (
             <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-[#222222] text-[14px] font-semibold">
               {status.charAt(0).toUpperCase() + status.slice(1)}
             </div>
          ) : isFeatured ? (
            <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-[#222222] text-[14px] font-semibold flex items-center gap-1">
              Guest favorite
            </div>
          ) : null}

          {/* Absolute Top-Right Actions */}
          <div 
            className="absolute top-3 right-3 flex items-center gap-2 z-10"
            onClick={(e) => e.preventDefault()}
          >
            {/* Owner Dropdown */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                    <MoreVertical className="w-5 h-5 text-white drop-shadow-md" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-50 rounded-xl border-[#DDDDDD] shadow-lg p-2">
                  <DropdownMenuItem onClick={(e) => handleAction(e, () => router.push(`/dashboard/property/edit/${id}`))} className="rounded-lg cursor-pointer font-medium text-[#222222]">
                    <Edit className="w-4 h-4 mr-2" /> Edit listing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleAction(e, () => router.push(`/dashboard/analytics?property=${id}`))} className="rounded-lg cursor-pointer font-medium text-[#222222]">
                    <TrendingUp className="w-4 h-4 mr-2" /> Analytics
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={(e) => handleAction(e, handleToggleFeatured)} className="rounded-lg cursor-pointer font-medium text-[#222222]">
                      <Star className={cn("w-4 h-4 mr-2", isFeatured && "fill-[#FF385C] text-[#FF385C]")} />
                      {isFeatured ? 'Unfeature' : 'Feature'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#EBEBEB] my-1" />
                  <DropdownMenuItem onClick={(e) => handleAction(e, handleDelete)} className="text-red-600 focus:text-red-600 rounded-lg cursor-pointer font-medium">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Share Button (Desktop Hover Only) */}
            <button 
              onClick={(e) => handleAction(e, handleShare)}
              className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
            >
              <Share2 className="w-5 h-5 text-white drop-shadow-md stroke-[2px]" />
            </button>

            {/* Favorite Button (Airbnb Style) */}
            <button 
              onClick={handleFavoriteToggle}
              disabled={isTogglingFavorite}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
            >
              <svg 
                viewBox="0 0 32 32" 
                xmlns="http://www.w3.org/2000/svg" 
                style={{
                  display: 'block', 
                  fill: isFavorite ? '#FF385C' : 'rgba(0, 0, 0, 0.5)', 
                  height: '24px', 
                  width: '24px', 
                  stroke: isFavorite ? '#FF385C' : '#FFFFFF', 
                  strokeWidth: 2, 
                  overflow: 'visible'
                }}
              >
                <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-6.94c-2.55.04-5 1.24-6.5 3.32-1.5-2.08-3.95-3.28-6.5-3.32A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" />
              </svg>
            </button>
          </div>

          {/* Hover Arrows */}
          {hasMultipleImages && (
            <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <button 
                onClick={(e) => { e.preventDefault(); carouselApi?.scrollPrev(); }}
                className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm pointer-events-auto transition-transform hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-[#222222]" strokeWidth={2.5} />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); carouselApi?.scrollNext(); }}
                className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm pointer-events-auto transition-transform hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-4 h-4 text-[#222222]" strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Bottom Indicators & Verifications */}
          <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-3">
            {/* Verification Strip */}
            {(isVerified || isBlockchainVerified) && (
              <div className="flex gap-2">
                {isVerified && (
                  <div className="flex items-center gap-1 bg-[#222222]/70 backdrop-blur-md px-2 py-1 rounded-md text-white">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold tracking-wide uppercase">Verified</span>
                  </div>
                )}
                {isBlockchainVerified && (
                  <div className="flex items-center gap-1 bg-[#222222]/70 backdrop-blur-md px-2 py-1 rounded-md text-white">
                    <Cpu className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[10px] font-bold tracking-wide uppercase">On-Chain</span>
                  </div>
                )}
              </div>
            )}

            {/* Pagination Dots */}
            {hasMultipleImages && (
              <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.preventDefault()}>
                {displayImages.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === activeIndex ? "w-1.5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/60 scale-75"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Text Content ── */}
        <div className="flex flex-col text-[15px] leading-snug">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-[#222222] truncate pr-4">{location}</span>
            {/* View Count or Rating */}
            {viewCount > 0 && (
              <div className="flex items-center gap-1 shrink-0 text-[#222222]">
                <Star className="w-3.5 h-3.5 fill-[#222222]" />
                <span className="text-[14px]">{viewCount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <span className="text-[#717171] truncate">{title}</span>
          <span className="text-[#717171] truncate">{metaString}</span>

          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-semibold text-[#222222]">{formattedPrice}</span>
            {(type === "rent" || type === "short_term") && (
               <span className="text-[#222222]">
                 {pricingUnit === 'nightly' ? 'night' : pricingUnit === 'weekly' ? 'week' : 'month'}
               </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};