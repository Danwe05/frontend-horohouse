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
    apiClient.getStudentPropertyStats().then(setStats).catch(() => {});
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
    <div className="min-h-screen bg-white text-slate-950 font-sans selection:bg-blue-100">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-gray-900">
      
      {/* Background Image & Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=1974&auto=format&fit=crop" 
          alt="African students on campus" 
          className="w-full h-full object-cover object-top"
        />
        {/* Darker gradient overlay for high text contrast, similar to Amber */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
      </div>

      {/* Centeblue Content Wrapper */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full flex flex-col items-center"
        >
          {/* Trust Rating (Amber style) */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-green-500 text-green-500" />
              ))}
            </div>
            <span className="text-white font-medium text-sm sm:text-base ml-2">
              {s.rating || '4.8/5'} <span className="text-gray-300 font-normal">{s.ratedBy || 'Rated by Students'}</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
            {s.headline || 'Home away from home'}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-3xl font-normal">
            {s.subheadline || 'Book your perfect student accommodation near your campus with verified power and water sources.'}
          </p>

          {/* Chunky Search Bar (Amber style) */}
          <form onSubmit={handleSearch} className="w-full max-w-4xl mb-8">
            <div className="flex flex-col sm:flex-row bg-white rounded-lg sm:rounded-full p-2 shadow-2xl">
              <div className="flex items-center flex-1 px-4 sm:px-6 h-14 sm:h-16 border-b sm:border-b-0 sm:border-r border-gray-200">
                <MapPin className="w-6 h-6 text-blue-500 mr-3 shrink-0" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={s.searchPlaceholder || "Search by city, university or property..."}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-gray-900 w-full text-base sm:text-lg p-0 placeholder:text-gray-500 font-medium"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-md sm:rounded-full px-10 h-14 sm:h-16 sm:ml-2 font-bold text-lg w-full sm:w-auto transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                {s.searchBtn || 'Search'}
              </Button>
            </div>
          </form>

          {/* Trust USPs / Perks Row (Amber style) */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-white text-sm sm:text-base font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span>{s.usp1 || '100% Verified Properties'}</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-400"></div>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-400" />
              <span>{s.usp2 || 'Price Match Guarantee'}</span>
            </div>
            <div className="hidden md:block w-1 h-1 rounded-full bg-gray-400"></div>
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="w-5 h-5 text-yellow-400" />
              <span>{s.usp3 || '24x7 Personal Assistance'}</span>
            </div>
          </div>

        </motion.div>
      </div>
    </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{s.availableHousing || 'Available Housing'}</h2>
            <p className="text-slate-400 font-medium">{(s.showingVerifications || 'Showing {count} verified listings').replace('{count}', properties.length.toString())}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-slate-100 rounded-[40px] animate-pulse" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
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
          <div className="text-center py-32 bg-slate-50 rounded-[48px] border border-slate-100">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
                <Search className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">{s.noListings || 'No listings found'}</h3>
             <p className="text-slate-400 font-medium max-w-sm mx-auto">{s.noListingsDesc || 'Try adjusting your filters or searching in a different area.'}</p>
             <Button 
               variant="outline" 
               onClick={resetFilters} 
               className="mt-8 rounded-full px-8 font-black uppercase tracking-widest text-[10px]"
             >
               {s.resetFilters || 'Reset Filters'}
             </Button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-8 sm:p-16 rounded-[64px] bg-blue-600 text-white overflow-hidden relative shadow-2xl shadow-blue-900/40"
        >
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-[100px]" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
            <div className="flex-1">
              <h2 className="text-5xl sm:text-7xl font-black tracking-[-0.04em] leading-[0.95] mb-8">{s.dontLiveAlone || "Don't Live Alone."}</h2>
              <p className="text-blue-100/90 text-lg sm:text-2xl font-medium tracking-tight max-w-xl mx-auto lg:mx-0 mb-10 leading-tight">
                {s.joinPool1 || "Join the roommate pool. Match with"} <br className="hidden sm:block" /> {s.joinPool2 || "verified students from your campus."}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                <Link href="/students/roommates">
                  <Button className="bg-white hover:bg-slate-50 text-blue-600 rounded-full px-12 h-16 font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/40">
                    {s.browseMatches || 'Browse Matches'}
                  </Button>
                </Link>
                <div className="flex -space-x-4">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-12 h-12 rounded-full border-4 border-blue-600 bg-blue-400 overflow-hidden shadow-xl">
                        <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="User" />
                     </div>
                   ))}
                   <div className="w-12 h-12 rounded-full border-4 border-blue-600 bg-blue-500 flex items-center justify-center text-[10px] font-black shadow-xl">
                     +2.4k
                   </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-80 space-y-4">
              <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="font-black uppercase tracking-widest text-[10px] text-blue-200 mb-2">{s.benefit1 || 'Benefit 01'}</p>
                <p className="font-bold text-lg">{s.verifiedOnly || 'Verified Only'}</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="font-black uppercase tracking-widest text-[10px] text-blue-200 mb-2">{s.benefit2 || 'Benefit 02'}</p>
                <p className="font-bold text-lg">{s.secureMatch || 'Secure Match'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}