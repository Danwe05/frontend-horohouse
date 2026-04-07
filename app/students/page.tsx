'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentMode } from '@/contexts/StudentModeContext';
import { apiClient } from '@/lib/api';
import { StudentPropertyCard } from '@/components/students/StudentPropertyCard';
import { StudentSearchFilters, StudentFilters } from '@/components/students/StudentSearchFilters';
import { StudentVerificationBanner } from '@/components/students/StudentVerificationBanner';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GraduationCap,
  Search,
  MapPin,
  Users,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Zap,
  ShieldCheck,
  Star,
  HeadphonesIcon,
  Tag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// --- Components & Styles ---

import { useLanguage } from '@/contexts/LanguageContext';

export default function StudentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isStudentMode, isStudent } = useStudentMode();
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.page || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StudentFilters>({ sortBy: 'campusProximityMeters', sortOrder: 'asc' });
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    apiClient.getStudentPropertyStats().then(setStats).catch(() => { });
  }, []);

  const fetchProperties = useCallback(async (currentFilters: StudentFilters, currentPage: number) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    try {
      const params: any = { ...currentFilters, page: currentPage, limit: 18 };
      if (searchQuery.trim()) params.city = searchQuery.trim();
      const res = await apiClient.searchStudentProperties(params);
      setProperties(res.properties || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchProperties(filters, page); }, [filters, page, fetchProperties]);
  useEffect(() => { setPage(1); }, [filters, searchQuery]);

  // Helper functions for the new structure
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProperties(filters, 1);
  };

  const resetFilters = () => {
    setFilters({ sortBy: 'campusProximityMeters', sortOrder: 'asc' });
    setSearchQuery('');
    setPage(1);
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    if (key === 'sortBy' || key === 'sortOrder') return false;
    const value = (filters as any)[key];
    return value !== undefined && value !== null && value !== '';
  }).length + (searchQuery.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative w-full min-h-[75vh] flex items-center justify-center overflow-hidden bg-[#222222] pt-20">
        {/* Background Image & Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=1974&auto=format&fit=crop"
            alt="African students on campus"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Center Content Wrapper */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center mt-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex flex-col items-center"
          >
            {/* Trust Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-white text-white" />
                ))}
              </div>
              <span className="text-white font-semibold text-[14px] ml-2">
                {s.rating || '4.8/5'} <span className="text-white/80 font-normal">{s.ratedBy || 'Rated by Students'}</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[40px] sm:text-[56px] md:text-[64px] font-semibold text-white tracking-tight leading-[1.1] mb-6 max-w-4xl">
              {s.headline || 'Home away from home.'}
            </h1>

            {/* Subheadline */}
            <p className="text-[16px] sm:text-[18px] text-white/90 mb-12 max-w-2xl font-normal leading-relaxed">
              {s.subheadline || 'Book your perfect student accommodation near your campus with verified power and water sources.'}
            </p>

            {/* Chunky Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-3xl mb-12">
              <div className="flex flex-col sm:flex-row bg-white rounded-full p-2.5 shadow-lg">
                <div className="flex items-center flex-1 px-6 h-14">
                  <MapPin className="w-5 h-5 text-[#222222] mr-3 shrink-0 stroke-[2]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={s.searchPlaceholder || "Search by city, university or property..."}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[#222222] w-full text-[16px] p-0 placeholder:text-[#717171] font-medium h-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-14 font-semibold text-[16px] w-full sm:w-auto transition-colors mt-2 sm:mt-0 active:scale-[0.98]"
                >
                  <Search className="w-5 h-5 mr-2 stroke-[2]" />
                  {s.searchBtn || 'Search'}
                </Button>
              </div>
            </form>

            {/* Trust USPs */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-white text-[14px] font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span>{s.usp1 || '100% Verified Properties'}</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-white/50"></div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                <span>{s.usp2 || 'Price Match Guarantee'}</span>
              </div>
              <div className="hidden md:block w-1 h-1 rounded-full bg-white/50"></div>
              <div className="flex items-center gap-2">
                <HeadphonesIcon className="w-5 h-5" />
                <span>{s.usp3 || '24x7 Personal Assistance'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-[#EBEBEB]">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-[32px] font-semibold text-[#222222] tracking-tight mb-2">{s.availableHousing || 'Available housing'}</h2>
            <p className="text-[#717171] text-[16px]">{(s.showingVerifications || 'Showing {count} verified listings').replace('{count}', properties.length.toString())}</p>
          </motion.div>
          <div className="flex items-center gap-3">
            <StudentVerificationBanner />
          </div>
        </div>

        <StudentSearchFilters
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          activeCount={activeFilterCount}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 mt-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-[#F7F7F7] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 mt-8">
            {properties.map((p, idx) => (
              <StudentPropertyCard
                key={p._id || p.id}
                property={p}
                compatibilityScore={p.compatibilityScore}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white border border-[#DDDDDD] rounded-2xl mt-8">
            <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-[#717171] stroke-[1.5]" />
            </div>
            <h3 className="text-[22px] font-semibold text-[#222222] mb-2">{s.noListings || 'No listings found'}</h3>
            <p className="text-[#717171] text-[16px] max-w-md mx-auto mb-8">{s.noListingsDesc || 'Try adjusting your filters or searching in a different area.'}</p>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="h-12 px-8 rounded-lg border-[#222222] text-[#222222] hover:bg-[#F7F7F7] font-semibold"
            >
              {s.resetFilters || 'Reset filters'}
            </Button>
          </div>
        )}

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 p-10 sm:p-16 rounded-2xl bg-[#222222] text-white flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <h2 className="text-[36px] sm:text-[48px] font-semibold tracking-tight leading-[1.1] mb-6">
              {s.dontLiveAlone || "Don't live alone."}
            </h2>
            <p className="text-[18px] text-white/80 font-normal leading-relaxed mb-10">
              {s.joinPool1 || "Join the roommate pool. Match with"} {s.joinPool2 || "verified students from your campus."}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
              <Link href="/students/roommates">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 h-14 font-semibold text-[16px] active:scale-[0.98] transition-transform">
                  {s.browseMatches || 'Browse matches'}
                </Button>
              </Link>
              <div className="flex items-center">
                <div className="flex -space-x-3 mr-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#222222] bg-[#F7F7F7] overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-[14px] font-semibold text-white/90">2.4k+ joined</span>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="p-6 rounded-xl bg-white/10 border border-white/20">
              <p className="text-[13px] font-bold uppercase tracking-widest text-blue-600 mb-2">{s.benefit1 || 'Benefit 01'}</p>
              <p className="text-[18px] font-semibold">{s.verifiedOnly || 'Verified Students Only'}</p>
            </div>
            <div className="p-6 rounded-xl bg-white/10 border border-white/20">
              <p className="text-[13px] font-bold uppercase tracking-widest text-blue-600 mb-2">{s.benefit2 || 'Benefit 02'}</p>
              <p className="text-[18px] font-semibold">{s.secureMatch || 'Secure Match Algorithm'}</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}