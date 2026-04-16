"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
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

const DEFAULT_CITY = 'Yaoundé';
const DEFAULT_COUNTRY = 'Cameroon';
const LOCATION_CACHE_KEY = 'hh_user_location';
const LOCATION_CACHE_TTL = 10 * 60 * 1000;

const CAMEROON_CITIES = [
  'Yaoundé', 'Yaounde', 'Douala', 'Garoua', 'Maroua', 'Bafoussam',
  'Bamenda', 'Ngaoundéré', 'Ngaoundere', 'Bertoua', 'Ebolowa',
  'Kribi', 'Kumba', 'Limbe', 'Buea',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeCityName(city: string): string {
  if (!city) return '';
  const normalized = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  for (const knownCity of CAMEROON_CITIES) {
    const knownNorm = knownCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized.includes(knownNorm) || knownNorm.includes(normalized)) {
      return knownCity;
    }
  }
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

function getCachedLocation(): { city: string; country: string } | null {
  try {
    const raw = sessionStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const { city, country, ts } = JSON.parse(raw);
    if (Date.now() - ts > LOCATION_CACHE_TTL) {
      sessionStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    return { city, country };
  } catch {
    return null;
  }
}

function setCachedLocation(location: { city: string; country: string }) {
  try {
    sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ ...location, ts: Date.now() }));
  } catch { /* ignore */ }
}

async function getLocationFromIP(): Promise<{ city: string; country: string }> {
  const response = await fetch('https://ipapi.co/json/');
  const data = await response.json();
  return {
    city: normalizeCityName(data.city || DEFAULT_CITY),
    country: data.country_name || DEFAULT_COUNTRY,
  };
}

async function getLocationFromCoords(lat: number, lng: number): Promise<{ city: string; country: string }> {
  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
  const data = await response.json();
  const raw = data.city || data.locality || data.principalSubdivision || DEFAULT_CITY;
  return {
    city: normalizeCityName(raw),
    country: data.countryName || DEFAULT_COUNTRY,
  };
}

async function fetchPropertiesForLocation(location: { city: string; country: string }): Promise<any[]> {
  const byCity = await apiClient.searchProperties({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc', city: location.city });
  const cityResults = Array.isArray(byCity?.properties) ? byCity.properties : [];
  if (cityResults.length > 0) return cityResults;

  const all = await apiClient.searchProperties({ limit: 32, sortBy: 'createdAt', sortOrder: 'desc' });
  let results = Array.isArray(all?.properties) ? all.properties : [];
  if (results.length === 0) return [];

  const targetCity = normalizeCityName(location.city);
  results.sort((a: any, b: any) => {
    const aCity = normalizeCityName(a.city || '');
    const bCity = normalizeCityName(b.city || '');
    if (aCity === targetCity && bCity !== targetCity) return -1;
    if (bCity === targetCity && aCity !== targetCity) return 1;
    if (a.country === location.country && b.country !== location.country) return -1;
    if (b.country === location.country && a.country !== location.country) return 1;
    return 0;
  });

  return results.slice(0, 8);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LocationBasedProperties() {
  const { t, language } = useLanguage();
  const _t = t as any;
  const { formatMoney } = useCurrency();

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ city: string; country: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [api, setApi] = useState<CarouselApi>();
  const fetchedForCity = useRef<string | null>(null);

  useEffect(() => {
    if (!api) return;
    api.on("select", () => setCurrentIndex(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setCardsPerView(1);
      else if (window.innerWidth < 768) setCardsPerView(2);
      else if (window.innerWidth < 1024) setCardsPerView(3);
      else if (window.innerWidth < 1280) setCardsPerView(4);
      else setCardsPerView(5); // Airbnb often shows 5 wide on large screens
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const loadProperties = useCallback(async (location: { city: string; country: string }) => {
    if (fetchedForCity.current === location.city) return;
    fetchedForCity.current = location.city;
    setLoading(true);
    try {
      const results = await fetchPropertiesForLocation(location);
      setProperties(results);
    } catch (err) {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      const cached = getCachedLocation();
      if (cached) {
        if (!cancelled) {
          setUserLocation(cached);
          setLocationLoading(false);
          loadProperties(cached);
        }
        return;
      }

      const defaultLoc = { city: DEFAULT_CITY, country: DEFAULT_COUNTRY };
      loadProperties(defaultLoc);

      let resolved = false;
      const resolveLocation = (loc: { city: string; country: string }) => {
        if (resolved || cancelled) return;
        resolved = true;
        setCachedLocation(loc);
        if (!cancelled) {
          setUserLocation(loc);
          setLocationLoading(false);
          if (loc.city !== DEFAULT_CITY) {
            fetchedForCity.current = null;
            loadProperties(loc);
          }
        }
      };

      const handleError = async () => {
        if (resolved || cancelled) return;
        try {
          const ipLoc = await getLocationFromIP();
          resolveLocation(ipLoc);
        } catch {
          if (!cancelled) {
            setLocationError('Unable to determine precise location');
            setUserLocation(defaultLoc);
            setLocationLoading(false);
          }
        }
      };

      getLocationFromIP().then(resolveLocation).catch(() => {});

      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const loc = await getLocationFromCoords(pos.coords.latitude, pos.coords.longitude);
              resolveLocation(loc);
            } catch {
              await handleError();
            }
          },
          handleError,
          { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
        );
      }
    }

    detect();
    return () => { cancelled = true; };
  }, [loadProperties]);

  const formattedProperties = properties.map((p) => ({
    id: p._id || p.id,
    image: p.images?.[0]?.url || "",
    images: p.images?.map((img: any) => img.url) || [],
    price: typeof p.price === "number" ? formatMoney(p.price) : "",
    timeAgo: "", // Not typically shown on Airbnb
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

  const maxIndex = Math.max(0, formattedProperties.length - cardsPerView);
  const showPeek = formattedProperties.length > cardsPerView;

  // ── Skeleton Loader (Matches Airbnb's grey box look) ──
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

  return (
    <section className="w-full bg-white py-12 px-6 lg:px-10 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto relative">
        
        {/* Header Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl md:text-2xl font-bold text-gray-900 tracking-tight">
              {_t.locationProperties?.title || 'Properties in your area'}
            </h2>
            
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-4 h-4 text-[#717171]" />
              {locationLoading ? (
                <div className="h-5 w-32 bg-[#EBEBEB] rounded animate-pulse" />
              ) : (
                <span className="text-[#717171] text-[15px]">
                  {locationError ? (
                    <>{locationError} — showing {_t.locationProperties?.showingDefault || 'default location'}</>
                  ) : userLocation ? (
                    <>
                      {formattedProperties.length}{' '}
                      {formattedProperties.length === 1 ? 'property' : 'properties'} found near <strong className="text-[#222222] font-semibold">{userLocation.city}</strong>
                    </>
                  ) : null}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation Buttons (Floating style) */}
          {!loading && formattedProperties.length > cardsPerView && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={language === 'ar' ? () => api?.scrollNext() : () => api?.scrollPrev()}
                disabled={language === 'ar' ? currentIndex === maxIndex : currentIndex === 0}
                className={`w-8 h-8 rounded-full border border-[#DDDDDD] flex items-center justify-center transition-all bg-white hover:border-[#222222] hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-[#DDDDDD] disabled:cursor-not-allowed`}
              >
                <ChevronLeft className={`w-4 h-4 text-[#222222] ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={language === 'ar' ? () => api?.scrollPrev() : () => api?.scrollNext()}
                disabled={language === 'ar' ? currentIndex === 0 : currentIndex === maxIndex}
                className={`w-8 h-8 rounded-full border border-[#DDDDDD] flex items-center justify-center transition-all bg-white hover:border-[#222222] hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-[#DDDDDD] disabled:cursor-not-allowed`}
              >
                <ChevronRight className={`w-4 h-4 text-[#222222] ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Carousel Area */}
        <div className="relative">
          {loading ? (
            <div className="flex flex-nowrap overflow-hidden -mx-3 px-3 gap-6">
              {Array.from({ length: cardsPerView + 1 }).map((_, index) => (
                <div key={index} className="flex-none" style={{ width: `calc(100% / ${cardsPerView + 0.15})` }}>
                  <PropertyCardSkeleton />
                </div>
              ))}
            </div>
          ) : formattedProperties.length === 0 ? (
            <div className="w-full py-16 text-center border border-dashed border-[#DDDDDD] rounded-2xl bg-[#F7F7F7]/50">
              <h4 className="text-[22px] font-semibold text-[#222222] mb-2 tracking-tight">
                {_t.locationProperties?.noProperties || 'No properties found'}
              </h4>
              <p className="text-[#717171] text-[15px] mb-6">
                {userLocation
                  ? (_t.locationProperties?.noPropertiesNear?.replace('{{city}}', userLocation.city) || `We couldn't find any properties near ${userLocation.city}.`)
                  : (_t.locationProperties?.noPropertiesAvailable || 'No properties available at the moment.')}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <Carousel setApi={setApi} opts={{ align: "start", loop: false, dragFree: true }} className="w-full">
                <CarouselContent className="-ml-4 lg:-ml-6">
                  {formattedProperties.map((property) => (
                    <CarouselItem
                      key={property.id}
                      className="pl-4 lg:pl-6"
                      style={{ flexBasis: `calc(110% / ${cardsPerView + (showPeek ? 0.15 : 0)})` }}
                    >
                      {/* Make sure your PropertyCard component matches Airbnb styles natively too */}
                      <PropertyCard {...property} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          )}
        </div>

        {/* Mobile Pagination Dots */}
        {!loading && formattedProperties.length > cardsPerView && (
          <div className="md:hidden flex justify-center gap-1.5 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-4 bg-[#222222]' : 'w-1.5 bg-[#DDDDDD]'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}