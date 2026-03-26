'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ShieldCheck, Wifi,
  MapPin, BedDouble, Bath, CheckCircle2, Star, MoveRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDistance(meters: number | undefined, _t: any): string | null {
  if (!meters) return null;
  return meters < 1000
    ? (_t?.studentSection?.metersToCampus?.replace('{{meters}}', String(meters)) || `${meters}m to campus`)
    : (_t?.studentSection?.kmToCampus?.replace('{{km}}', (meters / 1000).toFixed(1)) || `${(meters / 1000).toFixed(1)}km to campus`);
}

function getImageSrc(img: { url: string } | string): string {
  return typeof img === 'string' ? img : img.url;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function PropertySkeleton() {
  return (
    <div className="group flex flex-col sm:flex-row bg-white rounded-2xl border  overflow-hidden animate-pulse">
      <div className="w-full sm:w-2/5 h-64 sm:h-auto bg-gray-100" />
      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-6 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between">
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="h-6 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

// ── Image Carousel sub-component ──────────────────────────────────────────────

function ImageCarousel({
  images,
  title,
  isStudentApproved,
  rating,
  _t,
  language,
}: {
  images: string[];
  title: string;
  isStudentApproved?: boolean;
  rating?: number;
  _t?: any;
  language?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = images.length > 1;

  return (
    <div
      className="relative w-full sm:w-2/5 min-h-[260px] sm:min-h-full overflow-hidden group/img flex-shrink-0"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <Carousel
        className="w-full h-full absolute inset-0"
        opts={{ loop: true, direction: language === 'ar' ? 'rtl' : 'ltr' }}
        setApi={(api) => {
          if (!api) return;
          setActiveIndex(api.selectedScrollSnap());
          api.on('select', () => setActiveIndex(api.selectedScrollSnap()));
        }}
      >
        <CarouselContent className="ml-0 h-full">
          {images.map((src, i) => (
            <CarouselItem key={i} className="pl-0 relative h-full min-h-[260px]">
              <img
                src={src}
                alt={`${title} — photo ${i + 1}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {hasMultiple && (
          <div onClick={(e) => e.preventDefault()}>
            <CarouselPrevious className="left-2 bg-black/40 text-white hover:text-white opacity-0 group-hover/img:opacity-100 backdrop-blur-sm border-0 hover:bg-black/60 transition-all duration-200" />
            <CarouselNext className="right-2 bg-black/40 text-white hover:text-white opacity-0 group-hover/img:opacity-100 backdrop-blur-sm border-0 hover:bg-black/60 transition-all duration-200" />
          </div>
        )}
      </Carousel>

      {/* Dot indicators */}
      {hasMultiple && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10"
          onClick={(e) => e.preventDefault()}
        >
          {images.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-200 ${i === activeIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                }`}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      {hasMultiple && (
        <div className="absolute bottom-2 right-3 z-10 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm font-medium">
          {activeIndex + 1}/{images.length}
        </div>
      )}

      {/* Rating badge */}
      {rating ? (
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-gray-900 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 z-10">
          <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
          {rating.toFixed(1)}
        </div>
      ) : null}

      {/* Student Approved badge */}
      {isStudentApproved && (
        <div className="absolute bottom-8 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-emerald-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg z-10">
          <ShieldCheck className="w-3 h-3" /> {_t?.studentSection?.studentApproved || 'Student Approved'}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function StudentSection() {
  const { t, language } = useLanguage();
  const _t = t as any;
  const { formatMoney } = useCurrency();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProperties = async () => {
      try {
        setLoading(true);

        // First, try the dedicated student-properties endpoint
        const res = await apiClient.searchStudentProperties({
          sortBy: 'campusProximityMeters',
          sortOrder: 'asc',
          limit: 3,
          page: 1,
        });

        const studentProps = Array.isArray(res?.properties) ? res.properties : [];

        if (studentProps.length > 0) {
          setProperties(studentProps);
          return;
        }

        // Fallback: regular properties with isStudentFriendly flag
        const fallback = await apiClient.searchProperties({
          isStudentFriendly: true,
          limit: 3,
          page: 1,
        });
        const fallbackProps = Array.isArray(fallback?.properties)
          ? fallback.properties
          : Array.isArray(fallback?.data)
            ? fallback.data
            : [];
        setProperties(fallbackProps);
      } catch (err) {
        console.error('Failed to fetch student properties:', err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProperties();
  }, []);

  return (
    <section className="relative py-10 px-5 md:px-10 bg-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">

        {/* Left-Aligned Header with Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6  pb-10">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              {_t.studentSection?.titlePrefix || 'Find your '}
              <span className="text-blue-600">{_t.studentSection?.titleHighlight || 'perfect'}</span>
              {_t.studentSection?.titleSuffix || ' space.'}
            </h2>
            <p className="text-lg text-gray-500 font-medium">
              {_t.studentSection?.subtitle || 'Verified properties, transparent pricing, and zero hassle.'}
            </p>
          </div>

          <Link href="/students" className="flex items-center gap-2 text-gray-900 font-bold hover:text-blue-600 transition-colors group pb-2">
            {_t.studentSection?.exploreAll || 'Explore All Properties'}
            <MoveRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">

          {/* Left Column: Horizontal Property Cards (Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {loading ? (
              <>
                <PropertySkeleton />
                <PropertySkeleton />
                <PropertySkeleton />
              </>
            ) : properties.length === 0 ? (
              <div className="flex items-center justify-center h-64 border border-dashed  rounded-2xl">
                <p className="text-gray-400 font-medium">{_t.studentSection?.noProperties || 'No student properties found.'}</p>
              </div>
            ) : (
              properties.map((p, index) => {
                const sd = p.studentDetails;
                const imageArray = (p.images ?? []).map(getImageSrc).filter(Boolean);
                const heroImage = imageArray[0] || 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=800&auto=format&fit=crop';
                const distance = formatDistance(sd?.campusProximityMeters, _t);
                const price = formatMoney(sd?.pricePerPersonMonthly || p.price);
                const beds = p.amenities?.bedrooms;
                const baths = p.amenities?.bathrooms;
                const rating = p.averageRating;
                const address = p.address || p.city || '';

                return (
                  <motion.div
                    key={p._id || p.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group flex flex-col sm:flex-row bg-white rounded-2xl border  
             overflow-hidden hover:shadow-md transition-all cursor-pointer sm:min-h-[240px]"
                  >
                    <Link href={`/properties/${p._id || p.id}`} className="contents">
                      {/* Image carousel */}
                      <ImageCarousel
                        images={imageArray}
                        title={p.title || address}
                        isStudentApproved={sd?.isStudentApproved}
                        rating={rating}
                        _t={_t}
                        language={language}
                      />

                      {/* Details Section */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md">
                              {sd?.furnishingStatus ? sd.furnishingStatus.replace('_', ' ') : (_t.studentSection?.studentHousing || 'Student Housing')}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                            {p.title || address}
                          </h3>
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4 font-medium">
                            <MapPin className="w-4 h-4 shrink-0" />
                            {distance || address}
                          </div>
                        </div>

                        {/* Amenity tags */}
                        {sd && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {sd.nearestCampus && (
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md ">
                                {_t.studentSection?.nearCampus?.replace('{{campus}}', sd.nearestCampus) || `Near ${sd.nearestCampus}`}
                              </span>
                            )}
                            {sd.availableBeds > 0 && (
                              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md ">
                                {_t.studentSection?.bedsFree?.replace('{{count}}', String(sd.availableBeds)) || `${sd.availableBeds} beds free`}
                              </span>
                            )}
                            {sd.walkingMinutes && (
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md  ">
                                {_t.studentSection?.minWalk?.replace('{{count}}', String(sd.walkingMinutes)) || `${sd.walkingMinutes} min walk`}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bottom Row: Price & Beds/Baths */}
                        <div className="flex items-end justify-between border-t border-gray-100 pt-4 mt-auto">
                          <div className="flex items-center gap-4 text-gray-700 font-semibold text-sm">
                            {beds !== undefined && beds > 0 && (
                              <div className="flex items-center gap-1.5">
                                <BedDouble className="w-4 h-4 text-gray-400" />
                                {beds} {beds === 1 ? (_t.studentSection?.bed || 'Bed') : (_t.studentSection?.beds || 'Beds')}
                              </div>
                            )}
                            {baths !== undefined && baths > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Bath className="w-4 h-4 text-gray-400" />
                                {baths} {baths === 1 ? (_t.studentSection?.bath || 'Bath') : (_t.studentSection?.baths || 'Baths')}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-gray-900">{price}</span>
                            <span className="text-gray-500 font-medium">{_t.studentSection?.perMo || '/mo'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Right Column: Sticky Bento Box CTA & Benefits (Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 self-start">

            {/* Primary Action Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden -2xl -blue-900/20 flex-1"
            >
              {/* Decorative circle */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-500 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

              <h4 className="text-3xl font-bold mb-3 relative z-10">{_t.studentSection?.skipWaitlist || 'Skip the waitlist.'}</h4>
              <p className="text-blue-100 mb-8 font-medium relative z-10">
                {_t.studentSection?.joinStudents || 'Join 5,000+ students who found their home with us. Tour today, sign tomorrow.'}
              </p>

              <div className="space-y-4 mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-50 font-medium">{_t.studentSection?.noHiddenFees || 'No hidden application fees'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-50 font-medium">{_t.studentSection?.freeRoommateMatching || 'Free roommate matching'}</span>
                </div>
              </div>

              <Link href="/students" className="block">
                <button className="w-full bg-white text-blue-600 font-bold py-4 px-6 rounded-xl hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center gap-2 group relative z-10">
                  {_t.studentSection?.browseProperties || 'Browse Student Properties'}
                  <ArrowRight className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </Link>
            </motion.div>

            {/* Sub-Benefits Grid */}
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <ShieldCheck className="w-8 h-8 text-blue-600 mb-4" />
                <h5 className="font-bold text-gray-900 mb-1">{_t.studentSection?.verified100 || '100% Verified'}</h5>
                <p className="text-sm text-gray-500 font-medium">{_t.studentSection?.verifiedDesc || 'Every property is physically inspected.'}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <Wifi className="w-8 h-8 text-blue-600 mb-4" />
                <h5 className="font-bold text-gray-900 mb-1">{_t.studentSection?.stayConnected || 'Stay Connected'}</h5>
                <p className="text-sm text-gray-500 font-medium">{_t.studentSection?.connectedDesc || 'High-speed Wi-Fi included in rent.'}</p>
              </motion.div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}