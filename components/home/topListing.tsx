"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
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
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Constants ──────────────────────────────────────────────────────────────
const CITIES = ['All', 'Yaoundé', 'Douala', 'Maroua', 'Garoua', 'Kribi'] as const;
type City = typeof CITIES[number];

const CARDS_BY_WIDTH: [number, number][] = [
  [1280, 5],
  [1024, 4],
  [768,  3],
  [640,  2],
  [0,    1],
];

function getCardsVisible(): number {
  const w = window.innerWidth;
  for (const [breakpoint, count] of CARDS_BY_WIDTH) {
    if (w >= breakpoint) return count;
  }
  return 1;
}

/** Stable time-ago formatter — result cached per iso string */
const timeAgoCache = new Map<string, string>();
function timeAgoFromDate(iso?: string): string {
  if (!iso) return "";
  const cached = timeAgoCache.get(iso);
  if (cached) return cached;

  const diff  = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const result =
    hours < 24
      ? `${hours} hour${hours === 1 ? "" : "s"} ago`
      : (() => { const d = Math.floor(hours / 24); return `${d} day${d === 1 ? "" : "s"} ago`; })();

  timeAgoCache.set(iso, result);
  return result;
}

// ─── Airbnb-Style Skeleton Sub-components ──────────────────────────────────
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

const CityFilterSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x w-full">
    {Array.from({ length: 6 }, (_, i) => (
      <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0 snap-start bg-[#F7F7F7]" />
    ))}
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export default function TopListing() {
  const { t, language } = useLanguage();
  const _t = t as any;
  const { formatMoney } = useCurrency();

  const isRtl = language === 'ar';

  // ── State
  const [scrollSnap,   setScrollSnap]   = useState(0);
  const [activeCity,   setActiveCity]   = useState<City>('All');
  const [cardsVisible, setCardsVisible] = useState(4);
  const [api,          setApi]          = useState<CarouselApi>();
  const [properties,   setProperties]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  // ── Resize Listener
  useEffect(() => {
    let raf: number;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCardsVisible(getCardsVisible()));
    };
    setCardsVisible(getCardsVisible());
    window.addEventListener('resize', onResize, { passive: true });
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);

  // ── Carousel Scroll Sync
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setScrollSnap(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  // ── Data Fetching
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.searchProperties({
          sortBy:    'viewsCount',
          sortOrder: 'desc',
          limit:     15,
          city:      activeCity !== 'All' ? activeCity : undefined,
        });
        if (!cancelled) setProperties(Array.isArray(data?.properties) ? data.properties : []);
      } catch (err: any) {
        if (!cancelled && err?.name !== 'AbortError') setProperties([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [activeCity]);

  // ── Stable formatMoney ref
  const formatMoneyRef = useRef(formatMoney);
  useEffect(() => { formatMoneyRef.current = formatMoney; }, [formatMoney]);

  // ── Memoized Data
  const formattedProperties = useMemo(() =>
    properties.map((p) => ({
      id:              p._id || p.id,
      image:           p.images?.[0]?.url ?? "",
      images:          p.images?.map((img: any) => img.url) ?? [],
      price:           typeof p.price === "number" ? formatMoneyRef.current(p.price) : "",
      timeAgo:         timeAgoFromDate(p.createdAt),
      address:         [p.address, p.city, p.country].filter(Boolean).join(", "),
      beds:            p.amenities?.bedrooms  ?? 0,
      baths:           p.amenities?.bathrooms ?? 0,
      sqft:            p.area ? `${p.area} ft²` : "",
      tag:             p.type ? String(p.type).toUpperCase() : undefined,
      initialIsFavorite: p.isFavorite || false,
      listingType:     p.listingType || 'sale',
      rating:          typeof p.averageRating === "number" && p.averageRating > 0 ? p.averageRating : undefined,
      reviewCount:     typeof p.reviewCount   === "number" ? p.reviewCount : undefined,
    })),
    [properties]
  );

  const maxStartIndex = useMemo(
    () => Math.max(0, formattedProperties.length - cardsVisible),
    [formattedProperties.length, cardsVisible]
  );

  const showPeek = formattedProperties.length > cardsVisible;

  // ── Callbacks
  const handleCityChange = useCallback((city: City) => {
    setActiveCity(city);
    setScrollSnap(0);
    api?.scrollTo(0);
  }, [api]);

  const handleLeftClick  = isRtl ? () => api?.scrollNext() : () => api?.scrollPrev();
  const handleRightClick = isRtl ? () => api?.scrollPrev() : () => api?.scrollNext();

  const leftDisabled  = isRtl ? scrollSnap === maxStartIndex : scrollSnap === 0;
  const rightDisabled = isRtl ? scrollSnap === 0             : scrollSnap === maxStartIndex;

  const skeletonCount = useMemo(() => cardsVisible + 1, [cardsVisible]);
  const itemBasis = useMemo(() => `calc(100% / ${cardsVisible + (showPeek ? 0.15 : 0)})`, [cardsVisible, showPeek]);
  const dotArray = useMemo(() => Array.from({ length: maxStartIndex + 1 }, (_, i) => i), [maxStartIndex]);

  const propertyCountLabel = useMemo(() => {
    const template = formattedProperties.length === 1
      ? (_t.topListing?.propertiesAvailable  || '{{count}} listing')
      : (_t.topListing?.propertiesAvailable_plural || '{{count}} listings');
    return template.replace('{{count}}', String(formattedProperties.length));
  }, [formattedProperties.length, _t]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="bg-white py-16 px-6 lg:px-10 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
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
                {_t.topListing?.topListings || 'Top-rated listings'}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#717171] text-[15px]">
                  {_t.topListing?.description || 'Discover our most viewed and highly-rated properties.'}
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[#B0B0B0]" />
                {loading ? (
                  <Skeleton className="h-4 w-20 bg-[#EBEBEB]" />
                ) : (
                  <span className="text-[#222222] font-semibold text-[15px]">{propertyCountLabel}</span>
                )}
              </div>
            </div>

            {!loading && (
              <a href="/properties" className="text-[15px] font-semibold underline text-[#222222] hover:text-[#717171] transition-colors mt-2 md:mt-0">
                {_t.topListing?.seeAll || 'Explore all'}
              </a>
            )}
          </div>

          {/* City filters + desktop nav */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-full md:w-auto">
              {loading ? (
                <CityFilterSkeleton />
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x w-full">
                  {CITIES.map((city) => (
                    <motion.button
                      key={city}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCityChange(city)}
                      className={`shrink-0 snap-start px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-200 border ${
                        activeCity === city
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-[#222222] border-[#DDDDDD] hover:border-blue-600'
                      }`}
                    >
                      {city === 'All' ? _t.common?.all || 'All locations' : city}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Navigation Arrows */}
            {!loading && showPeek && (
              <div className="hidden md:flex items-center gap-2 pl-4">
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
        </motion.div>

        {/* Carousel Area */}
        <div className="relative">
          {loading ? (
            <div className="flex flex-nowrap overflow-hidden -mx-3 px-3 gap-6">
              {Array.from({ length: skeletonCount }).map((_, index) => (
                <div key={index} className="flex-none" style={{ width: `calc(100% / ${skeletonCount - 0.85})` }}>
                  <PropertyCardSkeleton />
                </div>
              ))}
            </div>
          ) : formattedProperties.length === 0 ? (
            <div className="w-full py-20 text-center border border-dashed border-[#DDDDDD] rounded-2xl bg-[#F7F7F7]/50 mt-4">
              <SearchX className="w-10 h-10 mx-auto mb-3 text-[#B0B0B0]" strokeWidth={1.5} />
              <h4 className="text-[18px] font-semibold text-[#222222] mb-1 tracking-tight">
                {(_t.topListing?.noProperties || `No top listings found in {{city}}`)
                  .replace('{{city}}', activeCity === 'All' ? (_t.common?.all || 'this area') : activeCity)}
              </h4>
              <p className="text-[#717171] text-[15px]">Try selecting a different location.</p>
            </div>
          ) : (
            <div className="w-full pt-2">
              <Carousel setApi={setApi} opts={{ align: "start", loop: false, dragFree: true }} className="w-full">
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
                  i === scrollSnap ? 'w-4 bg-[#222222]' : 'w-1.5 bg-[#DDDDDD] hover:bg-[#B0B0B0]'
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