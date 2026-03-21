import { Card, CardContent } from "@/components/ui/card";
import { Bed, Bath, Maximize, MoreVertical, Heart, Eye, Edit, Trash2, Share2, MapPin, TrendingUp, CheckCircle, Star, Ruler, Flag, ShieldCheck, Cpu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

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

// Reuse the time format from the frontend code
const formatTimeAgoStr = (time?: string) => {
  if (!time) return "";
  const lowerTime = time.toLowerCase();
  if (lowerTime.includes('just') || lowerTime.includes('now') ||
    lowerTime.includes('second') || (lowerTime.includes('minute') && parseInt(lowerTime) < 5)) {
    return "just now";
  }
  return time;
};


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
  favoriteCount = 0,
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
  const [localFavoriteCount, setLocalFavoriteCount] = useState(favoriteCount);
  const [imageError, setImageError] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  // Use images array if provided, otherwise fallback to single image
  const imageArray = images && images.length > 0 ? images : [image];
  const hasMultipleImages = imageArray.length > 1;

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isTogglingFavorite) return;

    const previousState = isFavorite;
    setIsFavorite(!isFavorite); // Optimistic update

    try {
      setIsTogglingFavorite(true);

      if (previousState) {
        await apiClient.removeFromFavorites(id);
        setLocalFavoriteCount(prev => Math.max(0, prev - 1));
        toast.success("Removed from favorites");
      } else {
        await apiClient.addToFavorites(id);
        setLocalFavoriteCount(prev => prev + 1);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      // Revert on error
      setIsFavorite(previousState);
      toast.error("Failed to update favorites");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/property/edit/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/property/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url
        });
      } catch (error) { }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch (error) { }
    }
  };

  const handleToggleFeatured = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await apiClient.togglePropertyFeatured(id, !isFeatured);
      toast.success(isFeatured ? "Property unfeatured" : "Property featured");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to update property");
    }
  };

  const handleViewAnalytics = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/analytics?property=${id}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const displayImages = imageError
    ? ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500']
    : imageArray;

  const formattedTimeAgo = formatTimeAgoStr(timeAgo);
  const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
  const formattedPrice = !isNaN(numPrice) && numPrice > 0 ? formatMoney(numPrice) : 'Contact for price';

  const displayTag = status !== 'active'
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : `For ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <TooltipProvider>
      <div className="block relative group">
        <Link href={`/properties/${id}`} className="block">
          <Card
            className={cn(
              "overflow-hidden -none border-1 transition-all duration-200 py-0",
              isDeleting && "opacity-50 pointer-events-none"
            )}
          >
            {/* ── Image carousel ── */}
            <div className="relative">
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
                  {displayImages.map((img, index) => (
                    <CarouselItem key={index} className="pl-0">
                      <img
                        src={img}
                        alt={`${title} - Image ${index + 1}`}
                        onError={handleImageError}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {hasMultipleImages && (
                  <div onClick={(e) => e.preventDefault()}>
                    <CarouselPrevious className="left-2 bg-black/40 text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm border-0 hover:bg-black/60 transition-all duration-200" />
                    <CarouselNext className="right-2 bg-black/40 text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm border-0 hover:bg-black/60 transition-all duration-200" />
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
                  {displayImages.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "block rounded-full transition-all duration-200",
                        i === activeIndex
                          ? "w-2 h-2 bg-white"
                          : "w-1.5 h-1.5 bg-white/50"
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
                          <span className="text-[11px] font-semibold tracking-wide text-emerald-300">
                            Verified
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        This listing has been verified by our team
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {isVerified && isBlockchainVerified && (
                    <span className="w-px h-3 bg-white/30 shrink-0" />
                  )}

                  {isBlockchainVerified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-white">
                          <Cpu className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span className="text-[11px] font-semibold tracking-wide text-violet-300">
                            Blockchain Verified
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Ownership record secured on-chain
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}

              {/* Tag / Status badge */}
              <Badge
                className={cn(
                  "absolute top-3 left-3 z-10",
                  status !== 'active' ? "bg-amber-500 hover:bg-amber-600" : "bg-primary"
                )}
              >
                {displayTag}
              </Badge>

              {/* Action buttons (Share, Favorite, Settings for Agent) */}
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
                onClick={(e) => e.preventDefault()}
              >
                {/* Share */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleShare}
                      className="w-8 h-8 flex-shrink-0 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform -md"
                    >
                      <Share2 className="h-3.5 w-3.5 text-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Share</TooltipContent>
                </Tooltip>

                {/* Favorite */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleFavoriteToggle}
                      disabled={isTogglingFavorite}
                      className="w-8 h-8 flex-shrink-0 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform -md disabled:opacity-50"
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isFavorite
                            ? "fill-destructive text-destructive"
                            : "text-foreground"
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {isFavorite ? "Unfavorite" : "Favorite"}
                  </TooltipContent>
                </Tooltip>

                {/* Owner Menu */}
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 flex-shrink-0 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform -md">
                        <MoreVertical className="w-4 h-4 text-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 z-50">
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Property
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleViewAnalytics}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      {user?.role === 'admin' && (
                        <DropdownMenuItem onClick={handleToggleFeatured}>
                          <Star className={cn("w-4 h-4 mr-2", isFeatured && "fill-amber-500 text-amber-500")} />
                          {isFeatured ? 'Unfeature' : 'Feature'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* ── Card content ── */}
            <CardContent className="pb-4 pt-3 flex flex-col justify-between" style={{ minHeight: '130px' }}>
              <div>
                <div className="mb-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-foreground leading-tight">
                        {formattedPrice}
                      </span>
                      {type === "rent" && (
                        <span className="text-xs text-muted-foreground">/month</span>
                      )}
                      {type === "short_term" && pricingUnit && (
                        <span className="text-xs text-muted-foreground">
                          /{pricingUnit === 'nightly' ? 'night' : pricingUnit === 'weekly' ? 'week' : 'month'}
                        </span>
                      )}
                    </div>
                    {formattedTimeAgo && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formattedTimeAgo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-foreground mb-1 truncate">
                  {title}
                </h4>

                {/* Location */}
                <p className="text-sm text-muted-foreground mb-3 truncate flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-2 border-t border-border/50">
                {/* Stats */}
                <div className="flex items-center gap-3 w-full">
                  {sqft > 0 && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>{sqft.toLocaleString()} sqft</span>
                    </div>
                  )}
                  {beds > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="h-3.5 w-3.5" />
                      <span>{beds}</span>
                    </div>
                  )}
                  {baths > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      <span>{baths}</span>
                    </div>
                  )}
                  {maxGuests !== undefined && maxGuests > 0 && (
                    <div className="flex items-center gap-1" title="Max Guests">
                      <span className="text-[10px] font-bold">GUESTS</span>
                      <span>{maxGuests}</span>
                    </div>
                  )}

                  {/* Push views/analytics to the right */}
                  <div className="ml-auto flex items-center gap-3">
                    {isAgent ? (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewAnalytics(e); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Analytics</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{viewCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </TooltipProvider>
  );
};