'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PropertyCard from '../property/PropertyCard';
import { Sparkles, TrendingUp, Users, Star, Brain, LayoutGrid, Info, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type AlgorithmType = 'flask-ml' | 'hybrid' | 'content-based' | 'collaborative' | 'popularity';

interface Recommendation {
  property: any;
  propertyId: string;
  finalScore: number;
  reasons: string[];
  methodology: {
    algorithm: string;
    source?: string;
  };
}

export default function RecommendationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('flask-ml');
  const [stats, setStats] = useState<any>(null);
  const [mlStatus, setMlStatus] = useState<any>(null);

  const algorithms = [
    {
      id: 'flask-ml' as AlgorithmType,
      name: 'AI Neural',
      icon: Brain,
      description: 'Our most advanced engine using deep learning patterns.',
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'hybrid' as AlgorithmType,
      name: 'Smart Mix',
      icon: Sparkles,
      description: 'A balanced blend of all our best matching logic.',
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 'content-based' as AlgorithmType,
      name: 'Personalized',
      icon: Star,
      description: 'Tuned specifically to your historical taste and interactions.',
      color: 'amber',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      id: 'collaborative' as AlgorithmType,
      name: 'Community',
      icon: Users,
      description: 'Discover what people with similar tastes are loving.',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'popularity' as AlgorithmType,
      name: 'Trending',
      icon: TrendingUp,
      description: 'The most popular properties across HoroHouse right now.',
      color: 'rose',
      gradient: 'from-rose-500 to-red-600'
    }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations();
      fetchStats();
      fetchMLStatus();
    }
  }, [isAuthenticated, selectedAlgorithm]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getRecommendations({
        algorithm: selectedAlgorithm,
        limit: 20,
      });
      if (response.success) {
        setRecommendations(response.data.recommendations);
      } else {
        setError('Failed to load recommendations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.getRecommendationStats();
      if (response.success) setStats(response.data);
    } catch (err) { console.error('Error fetching stats:', err); }
  };

  const fetchMLStatus = async () => {
    try {
      const response = await apiClient.getMLStatus();
      if (response.success) setMlStatus(response.data);
    } catch (err) { console.error('Error fetching ML status:', err); }
  };

  const handleFeedback = async (propertyId: string, rating: number, action?: string) => {
    try {
      await apiClient.submitRecommendationFeedback({
        propertyId, rating, clicked: action === 'clicked', favorited: action === 'favorited', inquired: action === 'inquired',
      });
    } catch (err) { console.error('Error submitting feedback:', err); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[28px] font-semibold text-[#222222] tracking-tight">Your AI Home Matchmaker</h2>
          <p className="text-[#717171] mt-3 text-[16px] leading-relaxed">Login to unlock highly personalized property recommendations based on your unique tastes.</p>
        </div>
        <Button asChild className="w-full h-14 rounded-xl bg-[#222222] hover:bg-black text-white font-bold text-[16px]">
          <a href="/auth/login">Continue to Login</a>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#222222] selection:bg-blue-600 selection:text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        
        {/* --- Hero Section --- */}
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[12px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Matched for you
              </span>
              {mlStatus?.flaskService?.healthy && (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ML Active
                </span>
              )}
            </div>
            <h1 className="text-[36px] sm:text-[44px] font-semibold tracking-tight text-[#222222] leading-[1.1] mb-4">
              The properties you'll love most.
            </h1>
            <p className="text-[18px] text-[#717171] max-w-2xl leading-relaxed">
              We analyze thousands of data points — from your neighborhood searches to property views — to find your perfect home.
            </p>
          </motion.div>
        </header>

        {/* --- Stats Row --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-[#F7F7F7] border border-[#EBEBEB] group hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300"
          >
            <p className="text-[13px] font-bold text-[#717171] uppercase tracking-wider mb-2">Profile Precision</p>
            <div className="flex items-end justify-between gap-4">
              <span className="text-[32px] font-semibold tabular-nums">{Math.round((stats?.profileStrength || 0) * 100)}%</span>
              <div className="flex-1 max-w-[120px] h-2 bg-[#EBEBEB] rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats?.profileStrength || 0) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-[#F7F7F7] border border-[#EBEBEB] hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300"
          >
            <p className="text-[13px] font-bold text-[#717171] uppercase tracking-wider mb-2">Taste Profile</p>
            <div className="flex items-center gap-3">
              <span className="text-[32px] font-semibold">{stats?.similarUsersCount || 0}</span>
              <span className="text-[14px] text-[#717171] font-medium leading-tight">Similar users <br/>matched</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-[#F7F7F7] border border-[#EBEBEB] hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300"
          >
            <p className="text-[13px] font-bold text-[#717171] uppercase tracking-wider mb-2">Analysis Scope</p>
            <div className="flex items-center gap-3">
              <span className="text-[32px] font-semibold">{stats?.recommendationCandidates || 0}</span>
              <span className="text-[14px] text-[#717171] font-medium leading-tight">Verified listings <br/>analyzed</span>
            </div>
          </motion.div>
        </div>

        {/* --- Algorithm Selector --- */}
        <div className="mb-10 pb-4 border-b border-[#EBEBEB]">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-[18px] font-semibold text-[#222222]">Select Intelligence Engine</h2>
            <div className="flex items-center gap-1.5 text-[14px] text-[#717171]">
              <Info className="w-4 h-4" />
              How we match
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
            {algorithms.map((algo) => (
              <button
                key={algo.id}
                onClick={() => setSelectedAlgorithm(algo.id)}
                className={cn(
                  "flex flex-col items-start p-4 min-w-[240px] rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                  selectedAlgorithm === algo.id 
                    ? "bg-white border-[#222222] shadow-[0_8px_24px_rgba(34,34,34,0.08)]"
                    : "bg-[#F7F7F7] border-transparent hover:border-[#DDDDDD] hover:bg-white"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl mb-4 transition-colors",
                  selectedAlgorithm === algo.id 
                    ? "bg-[#222222] text-white" 
                    : "bg-white text-[#717171] group-hover:bg-[#F7F7F7]"
                )}>
                  <algo.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[15px] mb-1">{algo.name}</h3>
                <p className="text-[13px] text-[#717171] leading-snug">{algo.description}</p>
                {selectedAlgorithm === algo.id && (
                  <motion.div layoutId="active-indicator" className="absolute top-4 right-4 text-blue-600">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* --- Results --- */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[280px] w-full rounded-2xl bg-[#F7F7F7]" />
                  <Skeleton className="h-4 w-2/3 bg-[#F7F7F7]" />
                  <Skeleton className="h-4 w-1/3 bg-[#F7F7F7]" />
                </div>
              ))}
            </motion.div>
          ) : recommendations.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12"
            >
              {recommendations.map((rec, index) => {
                const prop = rec.property;
                const imageArray: string[] = (prop?.images && Array.isArray(prop.images) && prop.images.length > 0)
                  ? prop.images.map((img: any) => (typeof img === 'string' ? img : img?.url || img?.src || '')).filter(Boolean)
                  : (prop?.image ? [(typeof prop.image === 'string' ? prop.image : prop.image?.url || prop.image?.src || '')] : []);

                return (
                  <motion.div
                    key={rec.propertyId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    {/* Match Score Badge */}
                    <div className="absolute top-4 left-4 z-10 bg-[#222222]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-1.5 shadow-lg border border-white/10 transition-transform group-hover:scale-105">
                      <Sparkles className="w-3 h-3 text-blue-400 fill-blue-400" />
                      {Math.round(rec.finalScore * 100)}% Match
                    </div>

                    <div onClick={() => handleFeedback(rec.propertyId, 5, 'clicked')} className="cursor-pointer">
                      <PropertyCard
                        id={prop._id || prop.id}
                        image={imageArray[0] || '/placeholder.jpg'}
                        images={imageArray}
                        price={prop.price?.toString() || '0'}
                        timeAgo={prop.createdAt || prop.postedAt || ''}
                        address={prop.address || prop.location || 'Address not available'}
                        beds={Number(prop?.beds ?? prop?.bedrooms ?? 0)}
                        baths={Number(prop?.baths ?? prop?.bathrooms ?? 0)}
                        sqft={String(prop?.sqft ?? prop?.area ?? '')}
                        tag={prop.tag || prop.status}
                        initialIsFavorite={prop.isFavorite}
                        listingType={prop.listingType || prop.type}
                      />
                    </div>

                    {/* AI Wisdom Box */}
                    {rec.reasons && rec.reasons.length > 0 && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex gap-3 group-hover:bg-blue-50 transition-colors">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="space-y-1.5">
                          <p className="text-[12px] font-bold text-blue-900 uppercase tracking-wide">Why we picked this</p>
                          <ul className="space-y-1">
                            {rec.reasons.slice(0, 2).map((reason, i) => (
                              <li key={i} className="text-[13px] text-blue-800/80 leading-snug flex items-start gap-2">
                                <span className="opacity-50">•</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32 bg-[#F7F7F7] rounded-[32px] border border-dashed border-[#DDDDDD]"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Sparkles className="w-10 h-10 text-[#DDDDDD]" />
              </div>
              <h3 className="text-[24px] font-semibold text-[#222222] mb-3">Refining your profile...</h3>
              <p className="text-[#717171] text-[16px] max-w-md mx-auto mb-8">
                The more you browse and interact, the more accurate our AI becomes. Start discovering properties to unlock your personal feed.
              </p>
              <Button asChild className="h-12 px-8 rounded-xl bg-[#222222] text-white font-bold hover:scale-105 transition-transform">
                <a href="/properties">Browse Properties</a>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global CTA */}
        <footer className="mt-32 pt-20 border-t border-[#EBEBEB]">
          <div className="bg-[#222222] rounded-[32px] p-8 md:p-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] -mr-48 -mt-48" />
            <div className="relative z-10 max-w-xl">
              <h2 className="text-[32px] md:text-[44px] font-semibold text-white leading-[1.1] mb-6 tracking-tight">Need something very specific?</h2>
              <p className="text-[18px] text-white/70 mb-10 leading-relaxed font-normal">Talk to our AI search agent for a bespoke property hunt experience tailored to your exact needs.</p>
              <Button asChild className="h-14 px-10 rounded-xl bg-white text-[#222222] hover:bg-[#F7F7F7] font-bold text-[16px] transition-all hover:translate-x-2">
                <a href="/searchAI" className="flex items-center gap-2">
                  Launch AI Search
                  <ChevronRight className="w-5 h-5" />
                </a>
              </Button>
            </div>
            <div className="relative z-10 w-full md:w-auto h-48 md:h-64 aspect-square bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 flex items-center justify-center">
              <Brain className="w-24 h-24 text-white opacity-20" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}