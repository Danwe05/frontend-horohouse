'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import PropertyCard from '../property/PropertyCard';
import { Sparkles, ChevronRight, Loader2 } from 'lucide-react';

interface RecommendedProperty {
  property: any;
  propertyId: string;
  finalScore: number;
  reasons: string[];
}

export default function RecommendationsWidget() {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFlaskMLRecommendations({ limit: 6 });
      
      if (response.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show widget for non-authenticated users
  }

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </section>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Hide widget if error or no recommendations
  }

  return (
    <section className="py-12 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Recommended for You
              </h2>
            </div>
            <p className="text-gray-600">
              AI-powered property suggestions based on your preferences
            </p>
          </div>

          <Link
            href="/recommendations"
            className="hidden md:flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            View All
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {recommendations.map((rec, index) => {
            const prop = rec.property;
            return (
              <div key={rec.propertyId || index} className="relative group">
                {/* Match Badge */}
                <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  {Math.round(rec.finalScore * 100)}% Match
                </div>

                <PropertyCard
                  id={prop._id || prop.id}
                  image={prop.images?.[0] || prop.image || '/placeholder.jpg'}
                  images={prop.images}
                  price={prop.price?.toString() || '0'}
                  timeAgo={prop.createdAt || prop.postedAt || ''}
                  address={prop.address || prop.location || 'Address not available'}
                  beds={prop.beds || prop.bedrooms}
                  baths={prop.baths || prop.bathrooms}
                  sqft={prop.sqft || prop.area}
                  tag={prop.tag || prop.status}
                  initialIsFavorite={prop.isFavorite}
                  listingType={prop.listingType || prop.type}
                />

                {/* Hover Overlay with Reasons */}
                {rec.reasons && rec.reasons.length > 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-center px-4">
                      <p className="font-semibold mb-2 text-sm">Why recommended:</p>
                      <ul className="text-xs space-y-1">
                        {rec.reasons.slice(0, 3).map((reason, i) => (
                          <li key={i}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile View All Link */}
        <div className="md:hidden text-center">
          <Link
            href="/recommendations"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            View All Recommendations
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}