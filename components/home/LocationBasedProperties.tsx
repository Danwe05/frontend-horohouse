"use client"

import { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";
import PropertyCard from '@/components/property/PropertyCard';
import apiClient from '@/lib/api';
// import { toast } from 'sonner' ;
import { FaArrowRight } from 'react-icons/fa';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';

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

    useEffect(() => {
        if (!api) return;
        api.on("select", () => {
            setCurrentIndex(api.selectedScrollSnap());
        });
    }, [api]);

    // Major cities in Cameroon for fuzzy matching
    const cameroonCities = [
        'Yaoundé', 'Yaounde', 'Douala', 'Garoua', 'Maroua', 'Bafoussam',
        'Bamenda', 'Ngaoundéré', 'Ngaoundere', 'Bertoua', 'Ebolowa',
        'Kribi', 'Kumba', 'Limbe', 'Buea'
    ];

    // Responsive cards per view
    useEffect(() => {
        const updateCardsPerView = () => {
            if (window.innerWidth < 640) setCardsPerView(1);
            else if (window.innerWidth < 768) setCardsPerView(2);
            else if (window.innerWidth < 1024) setCardsPerView(3);
            else setCardsPerView(4);
        };

        updateCardsPerView();
        window.addEventListener('resize', updateCardsPerView);
        return () => window.removeEventListener('resize', updateCardsPerView);
    }, []);

    // Normalize city name for better matching
    const normalizeCityName = (city: string): string => {
        if (!city) return '';

        // Remove accents and convert to lowercase for comparison
        const normalized = city
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

        // Check if it matches any known Cameroon city
        for (const knownCity of cameroonCities) {
            const knownNormalized = knownCity
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            if (normalized.includes(knownNormalized) || knownNormalized.includes(normalized)) {
                return knownCity;
            }
        }

        // If no match, return the original capitalized city name
        return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    };

    // Get user's location
    useEffect(() => {
        const getUserLocation = async () => {
            try {
                setLocationLoading(true);

                // First try to get precise location from browser
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            try {
                                // Reverse geocode to get city name
                                const response = await fetch(
                                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
                                );
                                const data = await response.json();

                                const detectedCity = data.city || data.locality || data.principalSubdivision || 'Yaoundé';
                                const normalizedCity = normalizeCityName(detectedCity);

                                setUserLocation({
                                    city: normalizedCity,
                                    country: data.countryName || 'Cameroon'
                                });
                                setLocationError(null);
                            } catch (error) {
                                console.error('Geocoding error:', error);
                                // Fallback to IP-based location
                                await getLocationFromIP();
                            } finally {
                                setLocationLoading(false);
                            }
                        },
                        async (error) => {
                            console.error('Geolocation error:', error);
                            // Fallback to IP-based location
                            await getLocationFromIP();
                        },
                        {
                            timeout: 10000,
                            maximumAge: 300000, // 5 minutes cache
                            enableHighAccuracy: false // Faster response
                        }
                    );
                } else {
                    // Browser doesn't support geolocation
                    await getLocationFromIP();
                }
            } catch (error) {
                console.error('Location error:', error);
                setLocationError('Unable to determine location');
                setUserLocation({ city: 'Yaoundé', country: 'Cameroon' }); // Default fallback
                setLocationLoading(false);
            }
        };

        const getLocationFromIP = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();

                const detectedCity = data.city || 'Yaoundé';
                const normalizedCity = normalizeCityName(detectedCity);

                setUserLocation({
                    city: normalizedCity,
                    country: data.country_name || 'Cameroon'
                });
                setLocationError(null);
            } catch (error) {
                console.error('IP location error:', error);
                setLocationError('Unable to determine location');
                setUserLocation({ city: 'Yaoundé', country: 'Cameroon' }); // Default fallback
            } finally {
                setLocationLoading(false);
            }
        };

        getUserLocation();
    }, []);

    // Fetch properties based on user's location
    useEffect(() => {
        if (!userLocation) return;

        const fetchLocationProperties = async () => {
            try {
                setLoading(true);

                // Try to fetch properties with city filter
                let params: any = {
                    limit: 8,
                    sortBy: 'createdAt',
                    sortOrder: 'desc' as const,
                };

                // First attempt: search by exact city name
                params.city = userLocation.city;
                let data = await apiClient.searchProperties(params);
                let foundProperties = Array.isArray(data?.properties) ? data.properties : [];

                // If no properties found with exact city, try searching without city filter
                // This will show properties from the entire country
                if (foundProperties.length === 0) {
                    console.log(`No properties found in ${userLocation.city}, expanding search...`);
                    delete params.city;
                    params.country = userLocation.country;
                    data = await apiClient.searchProperties(params);
                    foundProperties = Array.isArray(data?.properties) ? data.properties : [];

                    // If still no results, try without any location filter
                    if (foundProperties.length === 0) {
                        delete params.country;
                        data = await apiClient.searchProperties(params);
                        foundProperties = Array.isArray(data?.properties) ? data.properties : [];
                    }

                    // Filter results client-side to prioritize properties from the same city
                    if (foundProperties.length > 0) {
                        foundProperties.sort((a: any, b: any) => {
                            const aCity = normalizeCityName(a.city || '');
                            const bCity = normalizeCityName(b.city || '');
                            const targetCity = normalizeCityName(userLocation.city);

                            // Prioritize exact city matches
                            if (aCity === targetCity && bCity !== targetCity) return -1;
                            if (bCity === targetCity && aCity !== targetCity) return 1;

                            // Then prioritize properties from the same country
                            if (a.country === userLocation.country && b.country !== userLocation.country) return -1;
                            if (b.country === userLocation.country && a.country !== userLocation.country) return 1;

                            return 0;
                        });

                        // Take only first 8
                        foundProperties = foundProperties.slice(0, 8);
                    }
                }

                setProperties(foundProperties);
            } catch (error: any) {
                console.error('Failed to fetch properties:', error);
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLocationProperties();
    }, [userLocation]);

    // Format properties for PropertyCard component
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

    // Slider navigation
    const maxIndex = Math.max(0, formattedProperties.length - cardsPerView);

    const handlePrevious = () => {
        api?.scrollPrev();
    };

    const handleNext = () => {
        api?.scrollNext();
    };

    // Include +1 card to allow for the 'peek' effect
    const showPeek = formattedProperties.length > cardsPerView;

    // Skeleton loader for property cards
    const PropertyCardSkeleton = () => (
        <Card className="overflow-hidden pt-0">
            <CardContent className="p-0">
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
            </CardContent>
        </Card>
    );

    // Skeleton for location loading state
    const LocationSkeleton = () => (
        <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-48" />
        </div>
    );

    return (
        <div className="min-h-screen px-4 sm:px-6 md:px-10 py-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl md:text-2xl font-bold text-gray-900">
                                {_t.locationProperties?.title || 'Properties in Your Area'}
                            </h3>

                            <div className="flex items-center gap-2 text-gray-600 mt-2">
                                {locationLoading ? (
                                    <LocationSkeleton />
                                ) : locationError ? (
                                    <p className="text-amber-600">{locationError} - {_t.locationProperties?.showingDefault || 'Showing default location'}</p>
                                ) : userLocation ? (
                                    <>
                                        <p>
                                            {(formattedProperties.length === 1
                                                ? (_t.locationProperties?.foundNear || '{{count}} property found near')
                                                : (_t.locationProperties?.foundNear_plural || '{{count}} properties found near')
                                            ).replace('{{count}}', String(formattedProperties.length))}{' '}
                                            <span className="font-semibold text-blue-600">{userLocation.city}</span>
                                        </p>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {/* Navigation Buttons - Desktop */}
                        {!loading && formattedProperties.length > cardsPerView && (
                            <div className="hidden md:flex items-center gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={language === 'ar' ? handleNext : handlePrevious}
                                    disabled={language === 'ar' ? currentIndex === maxIndex : currentIndex === 0}
                                    className={`w-10 h-10 bg-white border-1 border-blue-600 text-blue-600 rounded-full flex items-center justify-center transition-all ${(language === 'ar' ? currentIndex === maxIndex : currentIndex === 0) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'
                                        }`}
                                >
                                    <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={language === 'ar' ? handlePrevious : handleNext}
                                    disabled={language === 'ar' ? currentIndex === 0 : currentIndex === maxIndex}
                                    className={`w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all ${(language === 'ar' ? currentIndex === 0 : currentIndex === maxIndex) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:-xl'
                                        }`}
                                >
                                    <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                </motion.button>
                            </div>
                        )}
                    </div>
                </motion.div>

                <section className="relative">
                    {loading ? (
                        <div className="flex flex-nowrap overflow-hidden -mx-3 px-3">
                            {Array.from({ length: cardsPerView + 1 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex-none px-3"
                                    style={{ width: `calc(100% / ${cardsPerView + 0.15})` }}
                                >
                                    <PropertyCardSkeleton />
                                </div>
                            ))}
                        </div>
                    ) : formattedProperties.length === 0 ? (
                        <Card className="py-20 -none border-0 bg-transparent">
                            <CardContent className="text-center">
                                <h4 className="text-xl font-semibold text-gray-700 mb-2">
                                    {_t.locationProperties?.noProperties || 'No Properties Found'}
                                </h4>
                                <p className="text-gray-500">
                                    {userLocation
                                        ? (_t.locationProperties?.noPropertiesNear?.replace('{{city}}', userLocation.city) || `We couldn't find any properties near ${userLocation.city}.`)
                                        : (_t.locationProperties?.noPropertiesAvailable || 'No properties available at the moment.')}
                                </p>
                                <p className="text-gray-500 mt-2">
                                    {_t.locationProperties?.checkBack || 'Check back soon for new listings!'}
                                </p>
                            </CardContent>
                        </Card>
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
                                                style={{ flexBasis: `calc(100% / ${cardsPerView + (showPeek ? 0.15 : 0)})` }}
                                            >
                                                <PropertyCard {...property} />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            </div>

                            {/* Progress Indicator */}
                            {formattedProperties.length > cardsPerView && (
                                <div className="flex justify-center gap-2 mt-8">
                                    {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => api?.scrollTo(i)}
                                            className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Navigation Buttons - Mobile */}
                            {formattedProperties.length > cardsPerView && (
                                <div className="flex md:hidden items-center justify-center gap-4 mt-8">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={language === 'ar' ? handleNext : handlePrevious}
                                        disabled={language === 'ar' ? currentIndex === maxIndex : currentIndex === 0}
                                        className={`w-12 h-12 bg-white border-1 border-blue-600 text-blue-600 rounded-full flex items-center justify-center transition-all -md ${(language === 'ar' ? currentIndex === maxIndex : currentIndex === 0) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'
                                            }`}
                                    >
                                        <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={language === 'ar' ? handlePrevious : handleNext}
                                        disabled={language === 'ar' ? currentIndex === 0 : currentIndex === maxIndex}
                                        className={`w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all -md ${(language === 'ar' ? currentIndex === 0 : currentIndex === maxIndex) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:-xl'
                                            }`}
                                    >
                                        <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                    </motion.button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {!loading && formattedProperties.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center mt-10"
                    >
                        <a href={`/properties?listingType=rent&city=${userLocation?.city}`} className="flex items-center justify-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            {_t.locationProperties?.seeAll || 'See all Properties'} <FaArrowRight className={`text-sm ${language === 'ar' ? 'rotate-180' : ''}`} />
                        </a>
                    </motion.div>
                )}
            </div>
        </div>
    );
}