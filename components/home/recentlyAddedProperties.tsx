"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const CARDS_BY_WIDTH: [number, number][] = [
  [1280, 5],
  [1024, 4],
  [768, 3],
  [640, 2],
  [0, 1],
];

function getCardsPerView(): number {
  for (const [bp, count] of CARDS_BY_WIDTH) {
    if (window.innerWidth >= bp) return count;
  }
  return 1;
}

function timeAgoFromIso(iso?: string): string {
  if (!iso) return "Just now";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const PropertyCardSkeleton = () => (
  <div className="flex flex-col gap-3 w-full">
    <div className="aspect-[20/19] bg-[#EBEBEB] rounded-xl animate-pulse" />
    <div className="space-y-2">
      <div className="h-4 bg-[#EBEBEB] rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-[#EBEBEB] rounded w-1/2 animate-pulse" />
    </div>
  </div>
);

export default function RecentlyAddedProperties() {
  const { language } = useLanguage();
  const { formatMoney } = useCurrency();
  const isRtl = language === 'ar';

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

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

  useEffect(() => {
    let cancelled = false;
    const fetchRecentProperties = async () => {
      try {
        setLoading(true);
        const data = await apiClient.searchProperties({
          sortBy: 'createdAt',
          sortOrder: 'desc',
          limit: 15,
        });
        if (!cancelled) setProperties(Array.isArray(data?.properties) ? data.properties : []);
      } catch (error: any) {
        if (!cancelled) setProperties([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecentProperties();
    return () => { cancelled = true; };
  }, []);

  const formattedProperties = properties.map((p) => ({
    id: p._id || p.id,
    image: p.images?.[0]?.url || "",
    images: p.images?.map((img: any) => img.url) || [],
    price: typeof p.price === "number" ? formatMoney(p.price) : "",
    timeAgo: timeAgoFromIso(p.createdAt),
    address: [p.address, p.city, p.country].filter(Boolean).join(", "),
    beds: p.amenities?.bedrooms ?? 0,
    baths: p.amenities?.bathrooms ?? 0,
    tag: "NEW", // Urgent tag
    listingType: p.listingType || 'sale',
  }));

  const maxIndex = Math.max(0, formattedProperties.length - cardsPerView);
  const showPeek = formattedProperties.length > cardsPerView;

  const handleLeftClick = isRtl ? () => api?.scrollNext() : () => api?.scrollPrev();
  const handleRightClick = isRtl ? () => api?.scrollPrev() : () => api?.scrollNext();

  const leftDisabled = isRtl ? currentIndex === maxIndex : currentIndex === 0;
  const rightDisabled = isRtl ? currentIndex === 0 : currentIndex === maxIndex;

  if (!loading && formattedProperties.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white py-12 px-6 lg:px-10 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-6 gap-4">
            <div>
              <h2 className="text-[26px] md:text-[32px] font-bold text-[#222222] tracking-tight">
                New this week
              </h2>

              <div className="flex items-center gap-2 mt-1">
                {loading ? (
                  <Skeleton className="h-4 w-40 bg-[#EBEBEB]" />
                ) : (
                  <span className="text-[#717171] text-[16px]">
                    Properties listed in the last 48 hours.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!loading && formattedProperties.length > 0 && (
                <a
                  href="/properties?sortBy=createdAt&sortOrder=desc"
                  className="text-[15px] font-semibold underline text-[#222222] hover:text-[#717171] transition-colors"
                >
                  View all new arrivals
                </a>
              )}

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
                      style={{ flexBasis: `calc(100% / ${cardsPerView + (showPeek ? 0.15 : 0)})` }}
                    >
                      <PropertyCard {...property} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
