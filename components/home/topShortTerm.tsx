"use client"

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TopShortTerm() {
  const { t, language } = useLanguage();
  const _t = t as any;
  const { formatMoney } = useCurrency();
  const isRtl = language === 'ar';

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [api, setApi] = useState<CarouselApi>();

  // ── Carousel Sync
  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  // ── Responsive cards per view
  useEffect(() => {
    let raf: number;
    const updateCardsPerView = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCardsPerView(getCardsPerView()));
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView, { passive: true });
    return () => { window.removeEventListener('resize', updateCardsPerView); cancelAnimationFrame(raf); };
  }, []);

  // ── Fetch top short-term properties
  useEffect(() => {
    let cancelled = false;
    const fetchShortTermProperties = async () => {
      try {
        setLoading(true);
        const params = {
          listingType: 'short_term',
          sortBy: 'createdAt',
          sortOrder: 'desc' as const,
          limit: 15,
        };

        const data = await apiClient.searchProperties(params);
        if (!cancelled) setProperties(Array.isArray(data?.properties) ? data.properties : []);
      } catch (error: any) {
        if (!cancelled) setProperties([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchShortTermProperties();
    return () => { cancelled = true; };
  }, []);

  // ── Format properties
  const formatPrice = (value?: number) => {
    if (typeof value !== "number") return "";
    return formatMoney(value);
  };

  const formattedProperties = properties.map((p) => ({
    id: p._id || p.id,
    image: p.images?.[0]?.url || "",
    images: p.images?.map((img: any) => img.url) || [],
    price: formatPrice(p.price),
    timeAgo: "", // Removed timeAgo as it's not standard for Airbnb short-term listings
    address: [p.address, p.city, p.country].filter(Boolean).join(", "),
    beds: p.amenities?.bedrooms ?? 0,
    baths: p.amenities?.bathrooms ?? 0,
    sqft: p.area ? `${p.area} ft²` : "",
    tag: p.type ? String(p.type).toUpperCase() : undefined,
    initialIsFavorite: p.isFavorite || false,
    listingType: p.listingType || 'short_term',
    rating: typeof p.averageRating === "number" && p.averageRating > 0 ? p.averageRating : undefined,
    reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : undefined,
  }));

  // ── Slider navigation
  const maxIndex = Math.max(0, formattedProperties.length - cardsPerView);
  const showPeek = formattedProperties.length > cardsPerView;

  const handleLeftClick  = isRtl ? () => api?.scrollNext() : () => api?.scrollPrev();
  const handleRightClick = isRtl ? () => api?.scrollPrev() : () => api?.scrollNext();

  const leftDisabled  = isRtl ? currentIndex === maxIndex : currentIndex === 0;
  const rightDisabled = isRtl ? currentIndex === 0        : currentIndex === maxIndex;

  return (
    <section className="w-full bg-[#F7F7F7] py-12 px-6 lg:px-10 font-sans border-y border-[#EBEBEB]" dir={isRtl ? 'rtl' : 'ltr'}>
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
                {_t.topShortTerm?.title || 'Perfect weekend getaways'}
              </h2>
              
              <div className="flex items-center gap-2 mt-2">
                {loading ? (
                  <Skeleton className="h-4 w-40 bg-[#EBEBEB]" />
                ) : (
                  <span className="text-[#717171] text-[15px]">
                    {_t.topShortTerm?.description || 'Discover our handpicked selection of short-term rentals.'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!loading && formattedProperties.length > 0 && (
                <a
                  href="/properties?listingType=short_term"
                  className="text-[15px] font-semibold underline text-[#222222] hover:text-[#717171] transition-colors"
                >
                  {_t.topShortTerm?.seeAll || 'Show all short stays'}
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
              {Array.from({ length: cardsPerView + 1 }).map((_, index) => (
                <div
                  key={index}
                  className="flex-none"
                  style={{ width: `calc(100% / ${cardsPerView + 0.15})` }}
                >
                  <PropertyCardSkeleton />
                </div>
              ))}
            </div>
          ) : formattedProperties.length === 0 ? (
            <div className="w-full py-16 text-center border border-dashed border-[#DDDDDD] rounded-2xl bg-white/50">
              <Home className="w-10 h-10 mx-auto mb-3 text-[#B0B0B0]" strokeWidth={1.5} />
              <h4 className="text-[18px] font-semibold text-[#222222] mb-1 tracking-tight">
                {_t.topShortTerm?.noStays || 'No short stays found'}
              </h4>
              <p className="text-[#717171] text-[15px]">
                {_t.topShortTerm?.noStaysDesc || "We couldn't find any short-term listings at the moment."}
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
                        style={{ flexBasis: `calc(110% / ${cardsPerView + (showPeek ? 0.15 : 0)})` }}
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
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
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