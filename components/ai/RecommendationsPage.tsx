'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PropertyCard from '../property/PropertyCard';
import { Sparkles, TrendingUp, Users, Star, Brain, ChevronDown } from 'lucide-react';

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
      name: 'AI Powered',
      icon: Brain,
      description: 'Advanced machine learning recommendations',
      color: 'purple'
    },
    {
      id: 'hybrid' as AlgorithmType,
      name: 'Smart Mix',
      icon: Sparkles,
      description: 'Combined recommendation algorithms',
      color: 'blue'
    },
    {
      id: 'content-based' as AlgorithmType,
      name: 'Based on Your Taste',
      icon: Star,
      description: 'Properties matching your preferences',
      color: 'yellow'
    },
    {
      id: 'collaborative' as AlgorithmType,
      name: 'Similar Users',
      icon: Users,
      description: 'What similar users liked',
      color: 'green'
    },
    {
      id: 'popularity' as AlgorithmType,
      name: 'Trending',
      icon: TrendingUp,
      description: 'Most popular properties',
      color: 'red'
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
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.getRecommendationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchMLStatus = async () => {
    try {
      const response = await apiClient.getMLStatus();
      if (response.success) {
        setMlStatus(response.data);
      }
    } catch (err) {
      console.error('Error fetching ML status:', err);
    }
  };

  const handleFeedback = async (propertyId: string, rating: number, action?: string) => {
    try {
      await apiClient.submitRecommendationFeedback({
        propertyId,
        rating,
        clicked: action === 'clicked',
        favorited: action === 'favorited',
        inquired: action === 'inquired',
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-4">Please login to see personalized recommendations</p>
          <a href="/auth/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recommendations for You
          </h1>
          <p className="text-gray-600">
            Personalized property suggestions based on your preferences
          </p>
        </div>

        {/* ML Status Banner */}
        {mlStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            mlStatus.flaskService.healthy 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                mlStatus.flaskService.healthy ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm font-medium">
                {mlStatus.flaskService.healthy 
                  ? '🤖 AI Recommendations Active' 
                  : '⚠️ AI Service Unavailable - Using Internal Algorithms'}
              </span>
            </div>
          </div>
        )}

        {/* Algorithm Selector */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {algorithms.map((algo) => {
            const Icon = algo.icon;
            const isSelected = selectedAlgorithm === algo.id;
            
            return (
              <button
                key={algo.id}
                onClick={() => setSelectedAlgorithm(algo.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `border-${algo.color}-500 bg-${algo.color}-50`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${
                  isSelected ? `text-${algo.color}-600` : 'text-gray-600'
                }`} />
                <div className="text-left">
                  <h3 className="font-semibold text-sm">{algo.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{algo.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm text-gray-600 mb-1">Profile Strength</h3>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">
                  {Math.round(stats.profileStrength * 100)}%
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${stats.profileStrength * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm text-gray-600 mb-1">Similar Users</h3>
              <span className="text-2xl font-bold">{stats.similarUsersCount}</span>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm text-gray-600 mb-1">Available Properties</h3>
              <span className="text-2xl font-bold">{stats.recommendationCandidates}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={fetchRecommendations}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && recommendations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {recommendations.length} Properties Found
              </h2>
              <span className="text-sm text-gray-500">
                Algorithm: {algorithms.find(a => a.id === selectedAlgorithm)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => {
                const prop = rec.property;

                // Normalize images: backend may return objects like { url } or strings
                const imageArray: string[] = (prop?.images && Array.isArray(prop.images) && prop.images.length > 0)
                  ? prop.images.map((img: any) => (typeof img === 'string' ? img : img?.url || img?.src || '')).filter(Boolean)
                  : (prop?.image ? [(typeof prop.image === 'string' ? prop.image : prop.image?.url || prop.image?.src || '')] : []);

                const firstImage = imageArray.length > 0 ? imageArray[0] : '/placeholder.jpg';

                // Coerce numeric fields to numbers when possible
                const bedsRaw = prop?.beds ?? prop?.bedrooms ?? prop?.bed_count ?? prop?.bedrooms_count;
                const bathsRaw = prop?.baths ?? prop?.bathrooms ?? prop?.bath_count ?? prop?.bathrooms_count;
                const bedsNum = bedsRaw !== undefined && bedsRaw !== null ? Number(bedsRaw) : undefined;
                const bathsNum = bathsRaw !== undefined && bathsRaw !== null ? Number(bathsRaw) : undefined;

                // sqft may be numeric or string; coerce to string for display
                const sqftRaw = prop?.sqft ?? prop?.area ?? prop?.size ?? prop?.squareFeet;
                const sqftStr = sqftRaw !== undefined && sqftRaw !== null ? String(sqftRaw) : undefined;

                return (
                  <div key={rec.propertyId || index} className="relative">
                    {/* Recommendation Badge */}
                    <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      {Math.round(rec.finalScore * 100)}% Match
                    </div>

                    {/* Property Card */}
                    <div onClick={() => handleFeedback(rec.propertyId, 5, 'clicked')}>
                      <PropertyCard
                        id={prop._id || prop.id}
                        image={firstImage}
                        images={imageArray.length > 0 ? imageArray : undefined}
                        price={prop.price?.toString() || '0'}
                        timeAgo={prop.createdAt || prop.postedAt || ''}
                        address={prop.address || prop.location || 'Address not available'}
                        beds={!isNaN(bedsNum as number) ? (bedsNum as number) : undefined}
                        baths={!isNaN(bathsNum as number) ? (bathsNum as number) : undefined}
                        sqft={sqftStr}
                        tag={prop.tag || prop.status}
                        initialIsFavorite={prop.isFavorite}
                        listingType={prop.listingType || prop.type}
                      />
                    </div>

                    {/* Recommendation Reasons */}
                    {rec.reasons && rec.reasons.length > 0 && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          Why recommended:
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          {rec.reasons.slice(0, 2).map((reason, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-purple-500">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && recommendations.length === 0 && !error && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start browsing properties to get personalized recommendations
            </p>
            <a 
              href="/properties"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse Properties
            </a>
          </div>
        )}
      </div>
    </div>
  );
}