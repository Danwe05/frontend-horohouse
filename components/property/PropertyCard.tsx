import { Heart, Bed, Bath, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import type { StaticImageData } from "next/image";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface PropertyCardProps {
  id: string;
  image: string | StaticImageData;
  images?: (string | StaticImageData)[];
  price: string;
  timeAgo: string;
  address: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  tag?: string;
  initialIsFavorite?: boolean;
  listingType?: "rent" | "sale";
}

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
  initialIsFavorite = false,
  listingType = "sale",
}: PropertyCardProps) => {
  // Simple module-level cache to avoid fetching favorites repeatedly
  // across many mounted PropertyCard instances on the same page.
  // It stores the set of favorited property IDs for the current user.
  // We also keep a pending promise so multiple cards don't trigger
  // parallel requests.
  if (typeof (globalThis as any).__hh_favorites_cache === 'undefined') {
    (globalThis as any).__hh_favorites_cache = undefined;
    (globalThis as any).__hh_favorites_fetch_promise = undefined;
  }

  const fetchFavoritesOnce = async () => {
    const g = globalThis as any;
    if (g.__hh_favorites_cache) return g.__hh_favorites_cache as Set<string>;
    if (g.__hh_favorites_fetch_promise) return g.__hh_favorites_fetch_promise as Promise<Set<string>>;

    g.__hh_favorites_fetch_promise = (async () => {
      try {
        const data = await apiClient.getFavorites();
        // Response shape varies across callers: it may be
        // - an array of property ids/objects
        // - an object like { favorites: [...] }
        // - an object like { data: { favorites: [...] } }
        // Normalize to an array of items then extract ids.
        let items: any[] = [];
        if (Array.isArray(data)) items = data;
        else if (Array.isArray(data?.favorites)) items = data.favorites;
        else if (Array.isArray(data?.data?.favorites)) items = data.data.favorites;
        else if (Array.isArray(data?.data)) items = data.data;

        const ids = new Set<string>();
        items.forEach((item: any) => {
          if (!item) return;
          if (typeof item === 'string') ids.add(item);
          else if (typeof item === 'object') {
            if (item.propertyId) ids.add(item.propertyId);
            else if (item.property && (item.property._id || item.property.id)) ids.add(item.property._id || item.property.id);
            else if (item._id || item.id) ids.add(item._id || item.id);
          }
        });
        g.__hh_favorites_cache = ids;
        try { console.debug('[PropertyCard] fetched favorites:', ids.size); } catch { }
        g.__hh_favorites_fetch_promise = undefined;
        return ids;
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
        g.__hh_favorites_cache = new Set();
        g.__hh_favorites_fetch_promise = undefined;
        return g.__hh_favorites_cache as Set<string>;
      }
    })();

    return g.__hh_favorites_fetch_promise as Promise<Set<string>>;
  };
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { isAuthenticated } = useAuth();
  const { translate, language } = useLanguage();

  // Auto-translated content
  const [translatedAddress, setTranslatedAddress] = useState(address);
  const [translatedTag, setTranslatedTag] = useState(tag);

  // Use images array if provided, otherwise fallback to single image
  const imageArray = images && images.length > 0 ? images : [image];
  const hasMultipleImages = imageArray.length > 1;

  // Format price with XAF currency
  const formattedPrice = price.replace(/\$/g, "").trim() + " ";

  // Format time ago into a compact, consistent form.
  // Accepts either an ISO timestamp (preferred) or an already-relative string
  // like "2 hours ago" and returns a compact form: "just now", "5m ago", "2h ago", "3d ago".
  const formatTimeAgo = (time: string) => {
    if (!time) return "";

    const tryParseDate = (input: string) => {
      const parsed = Date.parse(input);
      return isNaN(parsed) ? null : parsed;
    };

    // If it looks like an ISO/date string, parse and compute diff
    const parsed = tryParseDate(time);
    if (parsed) {
      const diffMs = Date.now() - parsed;
      const sec = Math.floor(diffMs / 1000);
      if (sec < 60) return "just now";
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}m ago`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}h ago`;
      const days = Math.floor(hr / 24);
      if (days < 7) return `${days}d ago`;
      // Older than a week: show localized short date
      try {
        return new Date(parsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch {
        return new Date(parsed).toDateString();
      }
    }

    // If already a relative string like "2 hours ago", try to compact it
    const lower = time.toLowerCase();
    if (lower.includes('ago') || lower.includes('just now')) {
      if (lower.includes('just')) return 'just now';
      const m = lower.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/);
      if (m) {
        const n = m[1];
        const unit = m[2];
        const short = unit.startsWith('second') ? 's' : unit.startsWith('minute') ? 'm' : unit.startsWith('hour') ? 'h' : unit.startsWith('day') ? 'd' : unit.startsWith('week') ? 'w' : unit.startsWith('month') ? 'mo' : 'y';
        return `${n}${short} ago`;
      }
      return time;
    }

    // Fallback: return as-is
    return time;
  };

  // Auto-translate content when language changes
  useEffect(() => {
    const translateContent = async () => {
      const [translatedAddr, translatedT] = await Promise.all([
        translate(address),
        tag ? translate(tag) : Promise.resolve(tag),
      ]);
      setTranslatedAddress(translatedAddr);
      setTranslatedTag(translatedT || tag);
    };
    translateContent();
  }, [language, address, tag, translate]);

  // If initialIsFavorite wasn't passed, fetch user's favorites once
  // and set the initial heart state accordingly (only if authenticated).
  useEffect(() => {
    let mounted = true;

    const determineFavorite = async () => {
      if (initialIsFavorite) return; // parent already told us
      if (!isAuthenticated) return;

      try {
        const favSet = await fetchFavoritesOnce();
        if (!mounted) return;
        setIsFavorite(favSet.has(id));
      } catch (err) {
        // ignore - just don't mark favorite
      }
    };

    determineFavorite();

    return () => { mounted = false; };
  }, [isAuthenticated, id, initialIsFavorite]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error("Login required", {
        description: "Please login to add properties to your favorites.",
      });
      return;
    }

    if (isTogglingFavorite) return;

    const previousState = isFavorite;
    setIsFavorite(!isFavorite); // Optimistic update

    try {
      setIsTogglingFavorite(true);
      if (previousState) {
        await apiClient.removeFromFavorites(id);
        toast.success("Removed from favorites", {
          description: "Property removed from your favorites list.",
        });
        // Keep module-level cache in sync so other PropertyCard instances
        // reflect the change without extra round-trips.
        try {
          const g = globalThis as any;
          if (g.__hh_favorites_cache) g.__hh_favorites_cache.delete(id);
        } catch (e) {
          // ignore cache update errors
        }
      } else {
        await apiClient.addToFavorites(id);
        toast.success("Added to favorites", {
          description: "Property added to your favorites list.",
        });
        try {
          const g = globalThis as any;
          if (g.__hh_favorites_cache) g.__hh_favorites_cache.add(id);
        } catch (e) {
          // ignore cache update errors
        }
      }
    } catch (error: any) {
      // Revert on error
      setIsFavorite(previousState);
      toast.error("Failed to update favorites", {
        description: error?.response?.data?.message || "Please try again later.",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <Link href={`/properties/${id}`} className="block">
      <Card className="overflow-hidden shadow-none hover:shadow-sm transition-shadow group py-0">
        <div className="relative">
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent className="ml-0">
              {imageArray.map((img, index) => (
                <CarouselItem key={index} className="pl-0">
                  <img
                    src={typeof img === "string" ? img : img.src}
                    alt={`${address} - Image ${index + 1}`}
                    className="w-full h-48 object-cover group-hover:scale-100 transition-transform duration-300"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {hasMultipleImages && (
              <div onClick={(e) => e.preventDefault()} className="group">
                <CarouselPrevious
                  className="left-2 bg-[#13131366] text-white hidden group-hover:flex backdrop-blur-sm border-0 hover:bg-card transition-all duration-300 ease-in-out transform group-hover:scale-100 scale-90 opacity-0 group-hover:opacity-100"
                />
                <CarouselNext
                  className="right-2 bg-[#13131366] text-white hidden group-hover:flex backdrop-blur-sm border-0 hover:bg-card transition-all duration-300 ease-in-out transform group-hover:scale-100 scale-90 opacity-0 group-hover:opacity-100"
                />
              </div>
            )}
          </Carousel>

          {translatedTag && (
            <Badge className="absolute top-3 left-3 bg-primary z-10">
              {translatedTag}
            </Badge>
          )}
          <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className="absolute top-3 right-3 w-8 h-8 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md disabled:opacity-50 z-10"
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? "fill-destructive text-destructive" : "text-foreground"
                }`}
            />
          </button>
        </div>

        <CardContent className="pb-4">
          <div className="mb-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center">
                <span className="text-24 font-bold text-foreground">{formattedPrice}</span>
                {listingType === "rent" && (
                  <span className="text-xs text-muted-foreground flex ">/month</span>
                )}
              </div>
              {
                (() => {
                  // Compute once so we can debug easily in browser console
                  const formattedTime = formatTimeAgo(timeAgo);
                  try { console.debug('[PropertyCard] timeAgo prop:', timeAgo, '->', formattedTime); } catch { }
                  return <span className="text-sm text-muted-foreground">{formattedTime}</span>;
                })()
              }
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{translatedAddress}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {sqft && (
              <div className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4" />
                <span>{sqft}</span>
              </div>
            )}
            {beds !== undefined && beds > 0 && (
              <div className="flex items-center gap-1.5">
                <Bed className="h-4 w-4" />
                <span>{beds}</span>
              </div>
            )}
            {baths !== undefined && baths > 0 && (
              <div className="flex items-center gap-1.5">
                <Bath className="h-4 w-4" />
                <span>{baths}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
