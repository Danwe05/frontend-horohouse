"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import PropertyCard from '@/components/property/PropertyCard';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Constants ──────────────────────────────────────────────────────────────
const CARDS_BY_WIDTH: [number, number][] = [
  [1280, 5],
  [1024, 4],
  [768,  3],
  [640,  2],
  [0,    1],
];

function getCardsPerView(): number {
  for (const [bp, count] of CARDS_BY_WIDTH) {
    if (window.innerWidth >= bp) return count;
  }
  return 1;
}

// Module-level cache so identical timestamps never recompute
const timeAgoCache = new Map<string, string>();
function formatTimeAgo(iso: string): string {
  if (!iso) return "";
  const cached = timeAgoCache.get(iso);
  if (cached) return cached;

  const diff    = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(hours / 24);
  const months  = Math.floor(days / 30);

  const result =
    hours  < 1  ? `${minutes} minute${minutes === 1 ? "" : "s"} ago` :
    hours  < 24 ? `${hours} hour${hours === 1 ? "" : "s"} ago`       :
    days   < 30 ? `${days} day${days === 1 ? "" : "s"} ago`          :
                  `${months} month${months === 1 ? "" : "s"} ago`;

  timeAgoCache.set(iso, result);
  return result;
}

// ─── Airbnb-Style Skeleton ───────────────────────────────────────────────────
const PropertyCardSkeleton = () => (
  <div className="flex flex-col gap-3 w-full">
    <div className="aspect-[20/19] bg-[#EBEBEB] rounded-xl animate-pulse" />
    <div className="space-y-2">
      <div className="h-4 bg-[#EBEBEB] rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-[#EBEBEB] rounded w-1/2 animate-pulse" />
      <div className="h-4 bg-[#EBEBEB] rounded w-1/3 animate-pulse mt-2" />
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export default function RecentlyViewedProperties() {
  const { t, language } = useLanguage();
  const _t = t as any;
  const { isAuthenticated } = useAuth();
  const { formatMoney } = useCurrency();

  const isRtl = language === 'ar';

  // ── State
  const [properties,   setProperties]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [api,          setApi]          = useState<CarouselApi>();

  // ── Stable formatMoney ref
  const formatMoneyRef = useRef(formatMoney);
  useEffect(() => { formatMoneyRef.current = formatMoney; }, [formatMoney]);

  // ── Resize Listener
  useEffect(() => {
    let raf: number;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCardsPerView(getCardsPerView()));
    };
    setCardsPerView(getCardsPerView());
    window.addEventListener('resize', onResize, { passive: true });
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);

  // ── Carousel sync
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  // ── Data fetch
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    apiClient.getViewedProperties({ page: 1, limit: 12, sortBy: 'viewedAt', sortOrder: 'desc' })
      .then((data) => {
        if (!cancelled)
          setProperties(Array.isArray(data?.properties) ? data.properties : []);
      })
      .catch(() => { if (!cancelled) setProperties([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // ── Memoized derived data
  const formattedProperties = useMemo(() =>
    properties.map((p) => ({
      id:               p._id || p.id,
      image:            p.images?.[0]?.url ?? "",
      images:           p.images?.map((img: any) => img.url) ?? [],
      price:            typeof p.price === "number" ? formatMoneyRef.current(p.price) : "",
      timeAgo:          formatTimeAgo(p.viewedAt),
      address:          [p.address, p.city, p.country].filter(Boolean).join(", "),
      beds:             p.amenities?.bedrooms  ?? 0,
      baths:            p.amenities?.bathrooms ?? 0,
      sqft:             p.area ? `${p.area} ft²` : "",
      tag:              p.type ? String(p.type).toUpperCase() : undefined,
      initialIsFavorite: p.isFavorite || false,
      listingType:      p.listingType || 'sale',
      viewedAt:         p.viewedAt,
      rating:           typeof p.averageRating === "number" && p.averageRating > 0 ? p.averageRating : undefined,
      reviewCount:      typeof p.reviewCount   === "number" ? p.reviewCount : undefined,
    })),
    [properties]
  );

  const maxIndex    = useMemo(() => Math.max(0, formattedProperties.length - cardsPerView), [formattedProperties.length, cardsPerView]);
  const showPeek    = formattedProperties.length > cardsPerView;
  const itemBasis   = useMemo(() => `calc(100% / ${cardsPerView + (showPeek ? 0.15 : 0)})`, [cardsPerView, showPeek]);
  const dotArray    = useMemo(() => Array.from({ length: maxIndex + 1 }, (_, i) => i), [maxIndex]);
  const skeletonArr = useMemo(() => Array.from({ length: cardsPerView + 1 }, (_, i) => i), [cardsPerView]);

  const subtitleLabel = useMemo(() => {
    const template = formattedProperties.length === 1
      ? (_t.recentlyViewed?.subtitle_one   || '{{count}} property recently viewed')
      : (_t.recentlyViewed?.subtitle_other || '{{count}} properties recently viewed');
    return template.replace('{{count}}', String(formattedProperties.length));
  }, [formattedProperties.length, _t]);

  // ── Stable callbacks
  const handleLeftClick  = isRtl ? () => api?.scrollNext() : () => api?.scrollPrev();
  const handleRightClick = isRtl ? () => api?.scrollPrev() : () => api?.scrollNext();

  const leftDisabled  = isRtl ? currentIndex === maxIndex : currentIndex === 0;
  const rightDisabled = isRtl ? currentIndex === 0        : currentIndex === maxIndex;

  // ── Early exit
  if (!isAuthenticated || (!loading && formattedProperties.length === 0)) return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="bg-white py-12 px-6 lg:px-10 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header row */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-2xl font-bold text-gray-900 tracking-tight">
                {_t.recentlyViewed?.title || 'Recently viewed'}
              </h2>
              
              <div className="flex items-center gap-2 mt-2">
                {loading ? (
                  <Skeleton className="h-4 w-40 bg-[#EBEBEB]" />
                ) : (
                  <span className="text-[#717171] text-[15px]">{subtitleLabel}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!loading && formattedProperties.length > 0 && (
                <a
                  href="/dashboard/recent"
                  className="text-[15px] font-semibold underline text-[#222222] hover:text-[#717171] transition-colors"
                >
                  {_t.recentlyViewed?.viewAll || 'View all history'}
                </a>
              )}

              {/* Desktop Navigation Arrows */}
              {!loading && showPeek && (
                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#EBEBEB]">
                  <button
                    onClick={handleLeftClick}
                    disabled={leftDisabled}
                    className={`w-8 h-8 rounded-full border border-[#DDDDDD] flex items-center justify-center transition-all bg-white hover:border-[#222222] hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-[#DDDDDD] disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft className={`w-4 h-4 text-[#222222] ${isRtl ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={handleRightClick}
                    disabled={rightDisabled}
                    className={`w-8 h-8 rounded-full border border-[#DDDDDD] flex items-center justify-center transition-all bg-white hover:border-[#222222] hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-[#DDDDDD] disabled:cursor-not-allowed`}
                  >
                    <ChevronRight className={`w-4 h-4 text-[#222222] ${isRtl ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Carousel Area */}
        <div className="relative">
          {loading ? (
            <div className="flex flex-nowrap overflow-hidden -mx-3 px-3 gap-6">
              {skeletonArr.map((i) => (
                <div
                  key={i}
                  className="flex-none"
                  style={{ width: `calc(100% / ${cardsPerView + 0.15})` }}
                >
                  <PropertyCardSkeleton />
                </div>
              ))}
            </div>
          ) : formattedProperties.length === 0 ? (
            <div className="w-full py-16 text-center border border-dashed border-[#DDDDDD] rounded-2xl bg-[#F7F7F7]/50">
              <History className="w-10 h-10 mx-auto mb-3 text-[#B0B0B0]" strokeWidth={1.5} />
              <h4 className="text-[18px] font-semibold text-[#222222] mb-1 tracking-tight">
                No recently viewed properties
              </h4>
              <p className="text-[#717171] text-[15px]">
                Properties you browse will appear here so you can easily find them later.
              </p>
            </div>
          ) : (
            <div className="w-full pt-2">
              <Carousel
                setApi={setApi}
                opts={{ align: "start", loop: false, direction: isRtl ? 'rtl' : 'ltr', dragFree: true }}
                className="w-full"
              >
                <CarouselContent className="-ml-4 lg:-ml-6">
                  {formattedProperties.map((property) => (
                    <CarouselItem
                      key={property.id}
                      className="pl-4 lg:pl-6"
                      style={{ flexBasis: itemBasis }}
                    >
                      <PropertyCard {...property} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          )}
        </div>

        {/* Mobile Pagination Dots */}
        {!loading && showPeek && (
          <div className="md:hidden flex justify-center gap-1.5 mt-8">
            {dotArray.map((i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-4 bg-[#222222]' : 'w-1.5 bg-[#DDDDDD] hover:bg-[#B0B0B0]'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}