"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Phone, Mail, MapPin, Star, Calendar, Share2, MessageSquare, Heart,
  Bed, Bath, Maximize, TrendingUp, Award, CheckCircle2, ChevronLeft,
  ChevronRight, Quote, Map as MapIcon, Filter, X, AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useParams } from 'next/navigation';

// Types
interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  agency?: string;
  bio?: string;
  city?: string;
  licenseNumber?: string;
  yearsOfExperience: number;
  specialties: string[];
  languages: string[];
  serviceAreas: string[];
}

interface AgentStats {
  rating: number;
  reviewCount: number;
  propertiesSold: number;
  experience: number;
  successRate: number;
  awards: number;
}

interface AgentProperty {
  id: string;
  images: string[];
  price: number;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  status: string;
  propertyType: string;
  soldDate?: string;
  listingType: string;
  latitude?: number;
  longitude?: number;
}

interface AgentReview {
  id: string;
  userName: string;
  rating: number;
  createdAt: string;
  comment: string;
  verified: boolean;
}

interface PropertyCardProps {
  property: AgentProperty;
  listCategory?: string;
  activeImageIndex: Record<string, number>;
  onNextImage: (uniqueKey: string, totalImages: number) => void;
  onPrevImage: (uniqueKey: string, totalImages: number) => void;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
}

// Property Card Component
const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  listCategory = '',
  activeImageIndex,
  onNextImage,
  onPrevImage,
  formatPrice,
  formatDate
}) => {
  const uniqueKey = `${property.id}-${listCategory}`;

  return (
    <div className="flex-shrink-0 w-72 border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="relative">
        <img
          src={property.images[activeImageIndex[uniqueKey] || 0] || '/placeholder.jpg'}
          alt={property.address}
          className="w-full h-48 object-cover"
        />
        {property.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevImage(uniqueKey, property.images.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNextImage(uniqueKey, property.images.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {property.images.map((_, idx) => (
                <div
                  key={`${uniqueKey}-dot-${idx}`}
                  className={`w-1.5 h-1.5 rounded-full ${(activeImageIndex[uniqueKey] || 0) === idx ? 'bg-white' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          </>
        )}
        <button className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2">
          <Heart className="w-4 h-4 text-gray-700" />
        </button>
        <Badge
          className={`absolute top-2 left-2 border-0 ${property.status === 'sold' ? 'bg-gray-700' : 'bg-blue-600'
            } text-white`}
        >
          {property.status}
        </Badge>
      </div>
      <div className="p-4">
        <div className="text-xl font-bold text-gray-900 mb-1">{formatPrice(property.price)}</div>
        <div className="text-sm text-gray-600 mb-1">{property.address}</div>
        <div className="text-sm text-gray-500 mb-2">{property.city}, {property.state}</div>
        {property.soldDate && (
          <div className="text-xs text-gray-500 mb-2">Sold {formatDate(property.soldDate)}</div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-700 border-t border-gray-200 pt-3">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{property.bedrooms} bd</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{property.bathrooms} ba</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4" />
            <span>{property.squareFeet.toLocaleString()} sqft</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Review Modal Component
interface ReviewModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  submitting: boolean;
  error: string | null;
  success: string | null;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSubmit,
  submitting,
  error,
  success
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0 || comment.trim().length < 10) return;
    await onSubmit(rating, comment);
  };

  if (!isOpen) return null;

  const getRatingLabel = (value: number) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[value];
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border border-gray-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={submitting}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <img
              src={agent?.profilePicture || '/placeholder.jpg'}
              alt={agent?.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="font-semibold text-gray-900">{agent?.name}</div>
              <div className="text-sm text-gray-600">{agent?.agency || 'Independent Agent'}</div>
            </div>
          </div>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    disabled={submitting}
                    className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= rating ? 'fill-blue-600 text-blue-600' : 'text-gray-300'
                        }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-1">{getRatingLabel(rating)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Share your experience working with this agent..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                disabled={submitting}
                className="border-gray-300 resize-none"
                maxLength={1000}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">Minimum 10 characters</p>
                <p className="text-xs text-gray-500">{comment.length}/1000</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || rating === 0 || comment.trim().length < 10}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Component
export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params?.id as string;

  // State
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [forSaleProperties, setForSaleProperties] = useState<AgentProperty[]>([]);
  const [soldProperties, setSoldProperties] = useState<AgentProperty[]>([]);
  const [rentalProperties, setRentalProperties] = useState<AgentProperty[]>([]);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [mapFilter, setMapFilter] = useState<string>('all');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const forSaleScrollRef = useRef<HTMLDivElement | null>(null);
  const soldScrollRef = useRef<HTMLDivElement | null>(null);

  // Fetch agent data
  useEffect(() => {
    if (agentId) {
      fetchAgentData();
    }
  }, [agentId]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const agentData = await apiClient.getAgentById(agentId);
      setAgent(agentData.agent || agentData);

      try {
        const statsData = await apiClient.getAgentStats(agentId);
        setStats(statsData);
      } catch (statsError) {
        setStats({
          rating: 4.8,
          reviewCount: 0,
          propertiesSold: agentData.agent?.propertiesSold || agentData.propertiesSold || 0,
          experience: agentData.agent?.yearsOfExperience || agentData.yearsOfExperience || 0,
          successRate: 95,
          awards: 5
        });
      }

      try {
        const [forSaleRes, soldRes, rentalRes] = await Promise.all([
          apiClient.getAgentProperties(agentId, { status: 'active', limit: 20 }),
          apiClient.getAgentProperties(agentId, { status: 'sold', limit: 20 }),
          apiClient.getAgentProperties(agentId, { status: 'rented', limit: 20 })
        ]);

        setForSaleProperties(forSaleRes.properties || []);
        setSoldProperties(soldRes.properties || []);
        setRentalProperties(rentalRes.properties || []);
      } catch (propsError) {
        setForSaleProperties([]);
        setSoldProperties([]);
        setRentalProperties([]);
      }

      try {
        const reviewsData = await apiClient.getAgentReviews(agentId, { limit: 10 });
        setReviews(reviewsData.reviews || []);
      } catch (reviewsError) {
        setReviews([]);
      }

    } catch (error) {
      console.error('Error fetching agent data:', error);
      setError('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleContactSubmit = async (): Promise<void> => {
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      alert('Message sent! The agent will contact you shortly.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      alert('Failed to send message. Please try again.');
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string): Promise<void> => {
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      await apiClient.createReview({
        reviewType: 'agent',
        agentId: agentId,
        rating: rating,
        comment: comment.trim(),
      });

      setReviewSuccess('Review submitted successfully!');

      setTimeout(() => {
        fetchAgentData();
        setShowReviewModal(false);
        setReviewSuccess(null);
      }, 2000);
    } catch (error: any) {
      setReviewError(
        error.response?.data?.message ||
        'Failed to submit review. You may have already reviewed this agent.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const nextImage = (propertyId: string, totalImages: number): void => {
    setActiveImageIndex(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (propertyId: string, totalImages: number): void => {
    setActiveImageIndex(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right'): void => {
    if (ref.current) {
      const scrollAmount = 320;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatPrice = (price: number): string => {
    return `${(price / 1000).toFixed(0)}K XAF`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const allMapListings: AgentProperty[] = [
    ...forSaleProperties.map(p => ({ ...p, listCategory: 'sale' })),
    ...soldProperties.map(p => ({ ...p, listCategory: 'sold' })),
    ...rentalProperties.map(p => ({ ...p, listCategory: 'rent' }))
  ];

  const getFilteredListings = (): AgentProperty[] => {
    if (mapFilter === 'sale') return forSaleProperties;
    if (mapFilter === 'rent') return rentalProperties;
    if (mapFilter === 'sold') return soldProperties;
    return allMapListings;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white mt-18">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Skeleton className="h-16 w-full" />
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!agent || error) {
    return (
      <div className="min-h-screen bg-white mt-18 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent not found</h2>
          <p className="text-gray-600 mb-4">
            {error || "The agent you're looking for doesn't exist."}
          </p>
          <Button onClick={() => window.location.href = '/agents'} className="bg-blue-600 hover:bg-blue-700">
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white mt-18">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={agent.profilePicture || '/placeholder.jpg'}
                alt={agent.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-600"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">{agent.name}</h1>
                <p className="text-sm text-gray-600">{agent.agency || 'Independent Agent'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex border-gray-300">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Phone className="w-4 h-4 mr-1" />
                Contact
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Info Card */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <img
                    src={agent.profilePicture || '/placeholder.jpg'}
                    alt={agent.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 mx-auto sm:mx-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{agent.name}</h2>
                        <p className="text-gray-600">Real Estate Agent</p>
                        <p className="text-sm text-gray-500">{agent.agency || 'Independent Agent'}</p>
                      </div>
                    </div>

                    {stats && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
                            <span className="ml-1 font-bold text-gray-900">{stats.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-gray-600">({stats.reviewCount} reviews)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{stats.propertiesSold}</div>
                            <div className="text-sm text-gray-600">Properties sold</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{agent.yearsOfExperience} years</div>
                            <div className="text-sm text-gray-600">Experience</div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {agent.specialties.map((specialty, idx) => (
                        <Badge key={`specialty-${idx}-${specialty}`} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Bar */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">Top 5%</div>
                    <div className="text-xs text-gray-600">Local Agent</div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <Award className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{stats.awards}+</div>
                    <div className="text-xs text-gray-600">Awards</div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{stats.successRate}%</div>
                    <div className="text-xs text-gray-600">Success Rate</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* About */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">About</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {agent.bio || `With over ${agent.yearsOfExperience} years of experience in the real estate industry, ${agent.name} has helped numerous families find their dream homes. Specializing in ${agent.specialties.join(', ')}, they bring deep knowledge of the local market and commitment to excellence.`}
                </p>

                <div className="space-y-3">
                  {agent.licenseNumber && (
                    <div>
                      <span className="font-semibold text-gray-900">License: </span>
                      <span className="text-gray-700">{agent.licenseNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-900">Languages: </span>
                    <span className="text-gray-700">{agent.languages.join(", ")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Service Areas: </span>
                    <span className="text-gray-700">{agent.serviceAreas.join(", ")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Section */}
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row h-[600px]">
                  {/* Map */}
                  <div className="flex-1 relative bg-gray-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-100">
                      <div className="absolute inset-0 opacity-20">
                        <svg className="w-full h-full">
                          <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                      </div>

                      {/* Property Markers */}
                      {getFilteredListings().slice(0, 20).map((property, idx) => {
                        const top = 20 + (idx % 5) * 15;
                        const left = 15 + (idx % 6) * 13;
                        const pinColor = property.status === 'sold' ? 'bg-gray-700' :
                          property.listingType === 'rent' ? 'bg-purple-600' : 'bg-blue-600';

                        return (
                          <div
                            key={`marker-${mapFilter}-${property.id}-${idx}`}
                            className="absolute cursor-pointer group"
                            style={{ top: `${top}%`, left: `${left}%` }}
                          >
                            <div className={`${pinColor} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform transition-transform group-hover:scale-125`}>
                              <MapIcon className="w-4 h-4 text-white" />
                            </div>

                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-48 overflow-hidden">
                                <img src={property.images[0] || '/placeholder.jpg'} alt={property.address} className="w-full h-24 object-cover" />
                                <div className="p-2">
                                  <div className="font-bold text-sm text-gray-900">{formatPrice(property.price)}</div>
                                  <div className="text-xs text-gray-600">{property.address}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {property.bedrooms} bd • {property.bathrooms} ba • {property.squareFeet.toLocaleString()} sqft
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                      <Button variant="ghost" size="sm" className="text-gray-700">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Listings Sidebar */}
                  <div className="w-full lg:w-80 border-l border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Team Listings & Sales</h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {getFilteredListings().length}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={mapFilter === 'all' ? 'default' : 'outline'}
                          onClick={() => setMapFilter('all')}
                          className={mapFilter === 'all' ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700'}
                        >
                          All
                        </Button>
                        <Button
                          size="sm"
                          variant={mapFilter === 'sale' ? 'default' : 'outline'}
                          onClick={() => setMapFilter('sale')}
                          className={mapFilter === 'sale' ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700'}
                        >
                          For Sale
                        </Button>
                        <Button
                          size="sm"
                          variant={mapFilter === 'rent' ? 'default' : 'outline'}
                          onClick={() => setMapFilter('rent')}
                          className={mapFilter === 'rent' ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700'}
                        >
                          For Rent
                        </Button>
                        <Button
                          size="sm"
                          variant={mapFilter === 'sold' ? 'default' : 'outline'}
                          onClick={() => setMapFilter('sold')}
                          className={mapFilter === 'sold' ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700'}
                        >
                          Sold
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {getFilteredListings().map((property, index) => (
                        <div
                          key={`map-${property.id}-${index}`}
                          className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex gap-3">
                            <img
                              src={property.images[0] || '/placeholder.jpg'}
                              alt={property.address}
                              className="w-20 h-20 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-900 mb-1">
                                {formatPrice(property.price)}
                              </div>
                              <div className="text-xs text-gray-600 mb-1 truncate">
                                {property.address}
                              </div>
                              <div className="text-xs text-gray-500 mb-1">
                                {property.city}, {property.state}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>{property.bedrooms} bd</span>
                                <span>•</span>
                                <span>{property.bathrooms} ba</span>
                                <span>•</span>
                                <span>{property.squareFeet.toLocaleString()} sqft</span>
                              </div>
                              <Badge
                                variant="secondary"
                                className={`mt-1 text-xs ${property.status === 'sold'
                                    ? 'bg-gray-100 text-gray-700'
                                    : property.listingType === 'rent'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                              >
                                {property.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Sale Listings Carousel */}
            {forSaleProperties.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">For Sale ({forSaleProperties.length})</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => scroll(forSaleScrollRef, 'left')}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => scroll(forSaleScrollRef, 'right')}
                      className="border-gray-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div
                  ref={forSaleScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {forSaleProperties.map((property) => (
                    <PropertyCard
                      key={`sale-${property.id}`}
                      property={property}
                      listCategory="sale"
                      activeImageIndex={activeImageIndex}
                      onNextImage={nextImage}
                      onPrevImage={prevImage}
                      formatPrice={formatPrice}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sold Listings Carousel */}
            {soldProperties.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Recently Sold ({soldProperties.length})</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => scroll(soldScrollRef, 'left')}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => scroll(soldScrollRef, 'right')}
                      className="border-gray-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div
                  ref={soldScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {soldProperties.map((property) => (
                    <PropertyCard
                      key={`sold-${property.id}`}
                      property={property}
                      listCategory="sold"
                      activeImageIndex={activeImageIndex}
                      onNextImage={nextImage}
                      onPrevImage={prevImage}
                      formatPrice={formatPrice}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {reviews.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Client Reviews</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
                      <span className="font-bold text-gray-900">{stats?.rating.toFixed(1)}</span>
                      <span className="text-gray-600">({stats?.reviewCount})</span>
                    </div>
                    <Button
                      onClick={() => setShowReviewModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      Write a Review
                    </Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {reviews.slice(0, 4).map((review) => (
                    <Card
                      key={review.id}
                      className="border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] group"
                    >
                      <CardContent className="p-6 relative">
                        {/* Decorative Quote Icon */}
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Quote className="w-12 h-12 text-blue-500" />
                        </div>

                        {/* Header with Rating and Verification */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {/* Star Rating */}
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={`${review.id}-star-${i}`}
                                  className={`w-5 h-5 ${i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                                      : 'fill-gray-200 text-gray-200'
                                    } transition-transform group-hover:scale-110`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-lg font-bold text-gray-900">{review.rating}.0</span>
                          </div>

                          {/* Verified Badge */}
                          {review.verified && (
                            <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1 font-medium shadow-sm">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </Badge>
                          )}
                        </div>

                        {/* Review Comment */}
                        <div className="relative">
                          <p className="text-gray-700 mb-6 leading-relaxed text-lg font-light line-clamp-4 group-hover:line-clamp-none transition-all">
                            "{review.comment}"
                          </p>

                          {/* Gradient fade for truncated text */}
                          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent group-hover:opacity-0 transition-opacity"></div>
                        </div>

                        {/* Reviewer Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-3">
                            {/* User Avatar */}
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              {review.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 block leading-tight">{review.userName}</span>
                              <span className="text-gray-500 text-sm flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Helpful Indicator */}
                          <button className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors group/helpful">
                            <svg className="w-4 h-4 group-hover/helpful:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="text-sm font-medium">Helpful</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* View More Reviews Button */}
                {reviews.length > 4 && (
                  <div className="text-center mt-8">
                    <button className="bg-white text-blue-600 border border-blue-200 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                      View All {reviews.length} Reviews
                    </button>
                  </div>
                )}

                {reviews.length > 4 && (
                  <Button variant="outline" className="w-full mt-4 border-gray-300">
                    View all {stats?.reviewCount} reviews
                  </Button>
                )}
              </div>
            ) : (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to review {agent?.name}</p>
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Write a Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:order-last order-first">
            {/* Contact Card */}
            <Card className="border border-gray-200 shadow-sm lg:sticky lg:top-20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact {agent.name.split(' ')[0]}</h3>

                <div className="space-y-3 mb-4">
                  <Input
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-gray-300"
                  />
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-gray-300"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-gray-300"
                  />
                  <Textarea
                    placeholder="Message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="border-gray-300 resize-none"
                  />
                </div>

                <Button onClick={handleContactSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Agent
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="border-gray-300 text-sm">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button variant="outline" className="border-gray-300 text-sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Text
                  </Button>
                </div>

                <Button variant="outline" className="w-full mt-2 border-gray-300">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Tour
                </Button>

                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{agent.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{agent.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Areas */}
            {agent.serviceAreas.length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Service Areas</h3>
                  <div className="space-y-2">
                    {agent.serviceAreas.map((area, idx) => (
                      <div key={`service-${idx}-${area}`} className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Specialties */}
            {agent.specialties.length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Specialties</h3>
                  <div className="space-y-2">
                    {agent.specialties.map((specialty, idx) => (
                      <div key={`specialty-sidebar-${idx}-${specialty}`} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>{specialty}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        agent={agent}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        submitting={submittingReview}
        error={reviewError}
        success={reviewSuccess}
      />
    </div>
  );
}