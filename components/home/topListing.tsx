"use client"

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import PropertyCard from '@/components/property/PropertyCard';
import apiClient from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';
// import { toast } from 'sonner' ;
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useLanguage } from '@/contexts/LanguageContext';

export default function TopListing() {
  const { t, language } = useLanguage();
  const _t = t as any;
  const cities = ['All', 'Yaoundé', 'Douala', 'Maroua', 'Garoua', 'Kribi'];
  const { formatMoney } = useCurrency();

  const [startIndex, setStartIndex] = useState(0);
  const [activeCity, setActiveCity] = useState('All');
  const [cardsVisible, setCardsVisible] = useState(4);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setStartIndex(api.selectedScrollSnap());
    });
  }, [api]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch top 15 most viewed properties
  useEffect(() => {
    const fetchMostViewedProperties = async () => {
      try {
        setLoading(true);
        const params = {
          sortBy: 'viewsCount',
          sortOrder: 'desc' as const,
          limit: 15,
          city: activeCity !== 'All' ? activeCity : undefined,
        };

        const data = await apiClient.searchProperties(params);
        setProperties(Array.isArray(data?.properties) ? data.properties : []);
      } catch (error: any) {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMostViewedProperties();
  }, [activeCity]);

  // Reset pagination when filter changes
  const handleCityChange = (city: string) => {
    setActiveCity(city);
    setStartIndex(0);
  };

  // Responsive cards visible
  useEffect(() => {
    const updateCardsVisible = () => {
      if (window.innerWidth < 640) setCardsVisible(1);
      else if (window.innerWidth < 768) setCardsVisible(2);
      else if (window.innerWidth < 1024) setCardsVisible(3);
      else setCardsVisible(4);
    };

    updateCardsVisible();
    window.addEventListener('resize', updateCardsVisible);
    return () => window.removeEventListener('resize', updateCardsVisible);
  }, []);

  const formatPrice = (value?: number) => {
    if (typeof value !== "number") return "";
    return formatMoney(value);
  };

  const timeAgoFromDate = (iso?: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const formattedProperties = properties.map((p) => ({
    id: p._id || p.id,
    image: p.images?.[0]?.url || "",
    images: p.images?.map((img: any) => img.url) || [],
    price: formatPrice(p.price),
    timeAgo: timeAgoFromDate(p.createdAt),
    address: [p.address, p.city, p.country].filter(Boolean).join(", "),
    beds: p.amenities?.bedrooms ?? 0,
    baths: p.amenities?.bathrooms ?? 0,
    sqft: p.area ? `${p.area} ft²` : "",
    tag: p.type ? String(p.type).toUpperCase() : undefined,
    initialIsFavorite: p.isFavorite || false,
    listingType: p.listingType || 'sale',
    rating: typeof p.averageRating === "number" && p.averageRating > 0 ? p.averageRating : undefined,
    reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : undefined,
  }));

  const maxStartIndex = Math.max(0, formattedProperties.length - cardsVisible);

  const handleLeftClick = () => api?.scrollPrev();
  const handleRightClick = () => api?.scrollNext();

  const showPeek = formattedProperties.length > cardsVisible;

  const PropertyCardSkeleton = () => (
    <div className="bg-white rounded-lg -sm overflow-hidden border border-gray-100">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );

  const CityFilterSkeleton = () => (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x w-full">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-20 rounded-xl shrink-0 snap-start" />
      ))}
    </div>
  );

  return (
    <div className="bg-white px-4 sm:px-6 md:px-10 py-10 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{_t.topListing?.topListings || 'Top 15 Listings'}</h3>
              <div className="text-gray-600 mt-2">
                {loading ? (
                  <Skeleton className="h-5 w-48" />
                ) : (
                  <p>{(formattedProperties.length === 1
                    ? (_t.topListing?.propertiesAvailable || '{{count}} property')
                    : (_t.topListing?.propertiesAvailable_plural || '{{count}} properties')
                  ).replace('{{count}}', String(formattedProperties.length))}</p>
                )}
              </div>
            </div>
            {!loading && (
              <button className="flex items-center gap-2 font-semibold hover:text-blue-700 transition-colors">
                {_t.topListing?.seeAll || 'See all Properties'} <FaArrowRight className={`text-sm ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* City filters + desktop nav */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {loading ? (
              <CityFilterSkeleton />
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x w-full">
                {cities.map((city) => (
                  <motion.button
                    key={city}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCityChange(city)}
                    className={`shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeCity === city
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                  >
                    {city === 'All' ? _t.common?.all || 'All' : city}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Desktop navigation — hidden on mobile */}
            {!loading && formattedProperties.length > cardsVisible && (
              <div className="hidden md:flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={language === 'ar' ? handleRightClick : handleLeftClick}
                  disabled={language === 'ar' ? startIndex === maxStartIndex : startIndex === 0}
                  className={`w-10 h-10 bg-white border border-blue-600 text-blue-600 rounded-full flex items-center justify-center transition-all ${(language === 'ar' ? startIndex === maxStartIndex : startIndex === 0) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'
                    }`}
                >
                  <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={language === 'ar' ? handleLeftClick : handleRightClick}
                  disabled={language === 'ar' ? startIndex === 0 : startIndex === maxStartIndex}
                  className={`w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all ${(language === 'ar' ? startIndex === 0 : startIndex === maxStartIndex) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:-xl'
                    }`}
                >
                  <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <section className="relative z-10 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-nowrap overflow-hidden -mx-3 px-3">
            {Array.from({ length: cardsVisible + 1 }).map((_, index) => (
              <div
                key={index}
                className="flex-none px-3"
                style={{ width: `calc(100% / ${cardsVisible + 0.15})` }}
              >
                <PropertyCardSkeleton />
              </div>
            ))}
          </div>
        ) : formattedProperties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">
              {_t.topListing?.noProperties?.replace('{{city}}', activeCity === 'All' ? (_t.common?.all || 'All') : activeCity) || `No properties found in ${activeCity === 'All' ? (_t.common?.all || 'All') : activeCity}`}
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden w-full pt-2">
              <Carousel
                setApi={setApi}
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-3">
                  {formattedProperties.map((property) => (
                    <CarouselItem
                      key={property.id}
                      className="pl-3"
                      style={{ flexBasis: `calc(100% / ${cardsVisible + (showPeek ? 0.15 : 0)})` }}
                    >
                      <PropertyCard {...property} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Progress dots */}
            {formattedProperties.length > cardsVisible && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: maxStartIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === startIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                  />
                ))}
              </div>
            )}

          </>
        )}
      </section>
    </div>
  );
}