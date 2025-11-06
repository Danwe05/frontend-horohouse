"use client"

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import PropertyCard from '@/components/property/PropertyCard';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TopListing() {
  const cities = ['All', 'Yaoundé', 'Douala', 'Maroua', 'Garoua', 'Kribi'];

  const [startIndex, setStartIndex] = useState(0);
  const [activeCity, setActiveCity] = useState('All');
  const [cardsVisible, setCardsVisible] = useState(4);
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
        toast.error('Failed to load properties', {
          description: error?.response?.data?.message || 'Please try again later.',
        });
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
    image: p.images?.[0]?.url || "/placeholder.svg",
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
  }));

  const maxStartIndex = Math.max(0, formattedProperties.length - cardsVisible);

  const handleLeftClick = () => {
    setStartIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleRightClick = () => {
    setStartIndex((prev) => Math.min(prev + 1, maxStartIndex));
  };

  const visibleProperties = formattedProperties.slice(startIndex, startIndex + cardsVisible);

  return (
    <div className="bg-gray-50 min-h-screen px-4 sm:px-6 md:px-10 py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto mb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <span className="inline-block px-4 py-2 mb-3 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                Most Viewed Properties
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Top 15 Listings</h3>
              <p className="text-gray-600 mt-2">
                {loading ? 'Loading...' : `${formattedProperties.length} ${formattedProperties.length === 1 ? 'property' : 'properties'} available`}
              </p>
            </div>
            <button className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              View All <FaArrowRight className="text-sm" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3 flex-wrap">
              {cities.map((city) => (
                <motion.button
                  key={city}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCityChange(city)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeCity === city
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border-1 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                >
                  {city}
                </motion.button>
              ))}
            </div>

            {/* Navigation buttons next to cities */}
            {formattedProperties.length > cardsVisible && (
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLeftClick}
                  disabled={startIndex === 0}
                  className={`w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all ${startIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-xl'
                    }`}
                >
                  <ChevronLeft className="text-sm" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRightClick}
                  disabled={startIndex === maxStartIndex}
                  className={`w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all ${startIndex === maxStartIndex ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-xl'
                    }`}
                >
                  <ChevronRight className="text-sm" />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <section className="relative z-10">
        <div>
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-lg text-gray-500 mt-4">Loading properties...</p>
            </div>
          ) : formattedProperties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-500">No properties found in {activeCity}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-8">
                {visibleProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="w-full"
                  >
                    <PropertyCard {...property} />
                  </motion.div>
                ))}
              </div>

              {/* Progress indicator */}
              {formattedProperties.length > cardsVisible && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: maxStartIndex + 1 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStartIndex(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === startIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                        }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}