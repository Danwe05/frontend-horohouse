"use client"

import { useState, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
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
// import { toast } from 'sonner';
import { FaArrowRight } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';

// Format time ago helper (moved outside component for performance)
const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} day${days === 1 ? "" : "s"} ago`;
    }
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
};

export default function RecentlyViewedProperties() {
    const { t, language } = useLanguage();
    const _t = t as any;
    const { user, isAuthenticated } = useAuth();
    const { formatMoney } = useCurrency();
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

    // Fetch recently viewed properties
    useEffect(() => {
        // Only fetch if authenticated
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchViewedProperties = async () => {
            try {
                setLoading(true);

                const params = {
                    page: 1,
                    limit: 8,
                    sortBy: 'viewedAt',
                    sortOrder: 'desc' as const,
                };

                const data = await apiClient.getViewedProperties(params);
                const viewedProps = Array.isArray(data?.properties) ? data.properties : [];

                setProperties(viewedProps);
            } catch (error: any) {
                console.error('Failed to fetch viewed properties:', error);
                // Silently fail for home page component
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };

        fetchViewedProperties();
    }, [isAuthenticated]);

    // Format properties for PropertyCard component
    const formatPrice = (value?: number) => {
        if (typeof value !== "number") return "";
        return formatMoney(value);
    };

    const formattedProperties = properties.map((p) => ({
        id: p._id || p.id,
        image: p.images?.[0]?.url || "",
        images: p.images?.map((img: any) => img.url) || [],
        price: formatPrice(p.price),
        timeAgo: formatTimeAgo(p.viewedAt),
        address: [p.address, p.city, p.country].filter(Boolean).join(", "),
        beds: p.amenities?.bedrooms ?? 0,
        baths: p.amenities?.bathrooms ?? 0,
        sqft: p.area ? `${p.area} ft²` : "",
        tag: p.type ? String(p.type).toUpperCase() : undefined,
        initialIsFavorite: p.isFavorite || false,
        listingType: p.listingType || 'sale',
        viewedAt: p.viewedAt,
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

    // Don't render if user is not authenticated or if no properties and not loading
    if (!isAuthenticated || (!loading && formattedProperties.length === 0)) {
        return null;
    }

    return (
        <div className=" min-h-screen px-4 sm:px-6 md:px-10 py-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
                                {_t.recentlyViewed?.title || 'Recently Viewed Properties'}
                            </h3>

                            <div className="flex items-center gap-2 text-gray-600 mt-2">
                                {loading ? (
                                    <Skeleton className="h-5 w-48" />
                                ) : (
                                    <>
                                        <p>
                                            {(formattedProperties.length === 1
                                                ? (_t.recentlyViewed?.subtitle_one || '{{count}} property recently viewed based on your activity')
                                                : (_t.recentlyViewed?.subtitle_other || '{{count}} properties recently viewed based on your activity')
                                            ).replace('{{count}}', String(formattedProperties.length))}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Navigation Buttons - Desktop */}
                        {!loading && formattedProperties.length > cardsPerView && (
                            <div className="hidden md:flex items-center gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handlePrevious}
                                    disabled={currentIndex === 0}
                                    className={`w-10 h-10 bg-white border-1 border-blue-600 text-blue-600 rounded-full flex items-center justify-center transition-all ${currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'
                                        }`}
                                >
                                    <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleNext}
                                    disabled={currentIndex === maxIndex}
                                    className={`w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all ${currentIndex === maxIndex ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:-xl'
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
                    ) : (
                        <>
                            <div className="relative overflow-hidden w-full pt-2">
                                <Carousel
                                    setApi={setApi}
                                    opts={{
                                        align: "start",
                                        loop: false,
                                        direction: language === 'ar' ? 'rtl' : 'ltr'
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
                        <a href="/dashboard/recent" className="flex items-center justify-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            {_t.recentlyViewed?.viewAll || 'View All History'} <FaArrowRight className={`text-sm ${language === 'ar' ? 'rotate-180' : ''}`} />
                        </a>
                    </motion.div>
                )}
            </div>
        </div>
    );
}