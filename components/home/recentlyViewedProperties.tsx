"use client"

import { useState, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PropertyCard from '@/components/property/PropertyCard';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { FaArrowRight } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { p } from 'framer-motion/client';

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
    const { user, isAuthenticated } = useAuth();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerView, setCardsPerView] = useState(4);

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
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "XAF",
                maximumFractionDigits: 0
            }).format(value);
        } catch {
            return `${value.toLocaleString()} XAF`;
        }
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
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    };

    const visibleProperties = formattedProperties.slice(currentIndex, currentIndex + cardsPerView);

    // Skeleton loader for property cards
    const PropertyCardSkeleton = () => (
        <Card className="overflow-hidden">
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
        <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen px-4 sm:px-6 md:px-10 py-10">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center">
                                <span className="inline-block px-4 py-2 mb-3 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                                    Your History
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Recently Viewed Properties
                            </h3>

                            <div className="flex items-center gap-2 text-gray-600 mt-2">
                                {loading ? (
                                    <Skeleton className="h-5 w-48" />
                                ) : (
                                    <>
                                        <p>
                                            {formattedProperties.length} {formattedProperties.length === 1 ? 'property' : 'properties'} recently viewed based on your activity
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
                                    className={`w-10 h-10 bg-white border-1 border-blue-600 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-md ${
                                        currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'
                                    }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleNext}
                                    disabled={currentIndex === maxIndex}
                                    className={`w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all shadow-md ${
                                        currentIndex === maxIndex ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-xl'
                                    }`}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        )}
                    </div>
                </motion.div>

                <section className="relative">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array.from({ length: cardsPerView }).map((_, index) => (
                                <PropertyCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="relative overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentIndex}
                                        initial={{ opacity: 0, x: 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                                    >
                                        {visibleProperties.map((property) => (
                                            <div key={property.id} className="w-full">
                                                <PropertyCard {...property} />
                                            </div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Progress Indicator */}
                            {formattedProperties.length > cardsPerView && (
                                <div className="flex justify-center gap-2 mt-8">
                                    {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentIndex(i)}
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                i === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
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
                                        onClick={handlePrevious}
                                        disabled={currentIndex === 0}
                                        className={`w-12 h-12 bg-white border-2 border-blue-600 text-blue-600 rounded-full flex items-center justify-center transition-all shadow-md ${
                                            currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'
                                        }`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleNext}
                                        disabled={currentIndex === maxIndex}
                                        className={`w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all shadow-md ${
                                            currentIndex === maxIndex ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-xl'
                                        }`}
                                    >
                                        <ChevronRight className="w-5 h-5" />
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
                        <a href="/viewed-properties" className="flex items-center justify-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            View All History <FaArrowRight className="text-sm" />
                        </a>
                    </motion.div>
                )}
            </div>
        </div>
    );
}