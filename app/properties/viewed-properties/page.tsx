"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Eye, MapPin, Bed, Bath, Square, Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// API service for viewed properties
const viewedPropertiesApi = {
  async getViewedProperties(page = 1, limit = 20, token: string) {
    const response = await fetch(
      `${API_BASE_URL}/users/me/viewed-properties?page=${page}&limit=${limit}&sortBy=viewedAt&sortOrder=desc`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch viewed properties');
    }

    return response.json();
  },

  async removeFromHistory(propertyId: string, token: string) {
    const response = await fetch(
      `${API_BASE_URL}/users/me/viewed-properties/${propertyId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove property');
    }

    return response.json();
  },

  async clearHistory(token: string) {
    const response = await fetch(
      `${API_BASE_URL}/users/me/viewed-properties`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to clear history');
    }

    return response.json();
  },
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const viewed = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - viewed.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return viewed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface PropertyCardProps {
  property: any;
  onRemove: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onRemove, onViewDetails }) => {
  const [removing, setRemoving] = useState(false);
  
  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Remove this property from your viewing history?')) return;
    
    setRemoving(true);
    try {
      await onRemove(property._id);
    } catch (error) {
      alert('Failed to remove property');
    } finally {
      setRemoving(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 relative group">
      <div className="relative h-56 overflow-hidden">
        <img
          src={property.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold shadow-md capitalize">
          {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
        </div>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="absolute top-3 left-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600 disabled:opacity-50"
          title="Remove from history"
        >
          <Trash2 size={16} />
        </button>
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
          <Eye size={12} />
          <span>{formatTimeAgo(property.viewedAt)}</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {property.title}
        </h3>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin size={16} className="mr-1 flex-shrink-0" />
          <span className="text-sm truncate">{property.address}</span>
        </div>
        
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          {property.amenities?.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed size={16} />
              <span>{property.amenities.bedrooms} Beds</span>
            </div>
          )}
          {property.amenities?.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath size={16} />
              <span>{property.amenities.bathrooms} Baths</span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center gap-1">
              <Square size={16} />
              <span>{property.area}m²</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(property.price)}
          </span>
          <button 
            onClick={() => onViewDetails(property._id)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>
      
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg border ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

const ViewedPropertiesPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastViewed, setLastViewed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get access token
  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  };

  const loadProperties = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await viewedPropertiesApi.getViewedProperties(pageNum, 20, token);
      
      setProperties(response.properties);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      setLastViewed(response.lastViewed);
    } catch (error: any) {
      console.error('Failed to load viewed properties:', error);
      setError(error.message || 'Failed to load viewing history');
      
      // If unauthorized, redirect to login
      if (error.message?.includes('unauthorized') || error.message?.includes('token')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Load properties once authenticated
    if (isAuthenticated) {
      loadProperties();
    }
  }, [isAuthenticated, authLoading, router]);
  
  const handleRemove = async (propertyId: string) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token found');
      }

      await viewedPropertiesApi.removeFromHistory(propertyId, token);
      
      // Remove from local state
      setProperties(properties.filter(p => p._id !== propertyId));
      setTotal(prev => prev - 1);
      
      // If page is now empty and not the first page, go back one page
      if (properties.length === 1 && page > 1) {
        handlePageChange(page - 1);
      }
    } catch (error: any) {
      console.error('Failed to remove property:', error);
      alert(error.message || 'Failed to remove property from history');
    }
  };
  
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your entire viewing history? This action cannot be undone.')) {
      return;
    }
    
    setClearing(true);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token found');
      }

      await viewedPropertiesApi.clearHistory(token);
      
      setProperties([]);
      setTotal(0);
      setLastViewed(null);
      setPage(1);
      setTotalPages(1);
    } catch (error: any) {
      console.error('Failed to clear history:', error);
      alert(error.message || 'Failed to clear viewing history');
    } finally {
      setClearing(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      loadProperties(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewDetails = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };
  
  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show loading state while fetching properties
  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your viewing history...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Failed to Load</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => loadProperties(1)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recently Viewed</h1>
              <p className="mt-2 text-gray-600">
                {total > 0 
                  ? `${total} ${total === 1 ? 'property' : 'properties'} in your viewing history`
                  : 'No properties in your viewing history yet'
                }
              </p>
              {lastViewed && (
                <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                  <Calendar size={14} />
                  Last viewed: {formatTimeAgo(lastViewed)}
                </p>
              )}
            </div>
            {properties.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <Trash2 size={18} />
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Viewing History</h2>
              <p className="text-gray-600 mb-6">
                You haven't viewed any properties yet. Start exploring properties to see them here!
              </p>
              <button 
                onClick={() => router.push('/properties')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Properties
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  onRemove={handleRemove}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewedPropertiesPage;