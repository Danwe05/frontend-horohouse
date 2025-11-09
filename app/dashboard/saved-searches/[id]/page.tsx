"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Home,
  Square,
  Heart,
  Eye,
  TrendingUp,
  Filter,
  Bell,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import Image from 'next/image';
import SaveSearchModal from '@/components/saved-searches/SaveSearchModal';

interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  listingType: string;
  type: string;
  city: string;
  state: string;
  address: string;
  amenities: {
    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;
  };
  images: Array<{ url: string; publicId: string }>;
  isFeatured: boolean;
  isVerified: boolean;
  views: number;
  createdAt: string;
}

interface SavedSearch {
  _id: string;
  name: string;
  searchCriteria: any;
  notificationFrequency: string;
  isActive: boolean;
  resultsCount: number;
  newMatchingProperties: string[];
  lastChecked: string;
  createdAt: string;
}

export default function SavedSearchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchId = params?.id as string;

  const [search, setSearch] = useState<SavedSearch | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (searchId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchId]);

  // Separate effect for page changes
  useEffect(() => {
    if (search && page > 1) {
      fetchProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchData = async () => {
  try {
    setLoading(true);
    const [searchData, propertiesData] = await Promise.all([
      apiClient.getSavedSearchById(searchId),
      apiClient.getSavedSearchProperties(searchId, 1, 20)
    ]);
    
    // 🔍 ADD THESE CONSOLE LOGS HERE
    console.log('🔍 Raw propertiesData:', propertiesData);
    console.log('🔍 Properties array:', propertiesData?.properties);
    console.log('🔍 Properties length:', propertiesData?.properties?.length);
    console.log('🔍 Total pages:', propertiesData?.totalPages);
    
    setSearch(searchData);
    setProperties(propertiesData.properties);
    setTotalPages(propertiesData.totalPages);
    setPage(1);
  } catch (error: any) {
    console.error('Error fetching data:', error);
    toast.error('Failed to load search results', {
      description: error?.response?.data?.message || 'Please try again later.'
    });
  } finally {
    setLoading(false);
  }
};

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const propertiesData = await apiClient.getSavedSearchProperties(searchId, page, 20);
      setProperties(propertiesData.properties);
      setTotalPages(propertiesData.totalPages);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties', {
        description: error?.response?.data?.message || 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSearch = async (data: any) => {
    if (!search) return;

    try {
      const updated = await apiClient.updateSavedSearch(search._id, data);
      setSearch(updated);
      toast.success('Search updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating search:', error);
      toast.error('Failed to update search', {
        description: error?.response?.data?.message || 'Please try again later.'
      });
      throw error;
    }
  };

  const handleToggleFavorite = async (propertyId: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await apiClient.removeFromFavorites(propertyId);
        toast.success('Removed from favorites');
      } else {
        await apiClient.addToFavorites(propertyId);
        toast.success('Added to favorites');
      }
      // Update local state if needed
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatCriteria = (criteria: any) => {
    const parts: string[] = [];
    
    if (criteria.city) parts.push(criteria.city);
    if (criteria.listingType) parts.push(criteria.listingType === 'sale' ? 'Buy' : 'Rent');
    if (criteria.propertyType) parts.push(criteria.propertyType);
    if (criteria.minPrice || criteria.maxPrice) {
      const min = criteria.minPrice ? formatPrice(criteria.minPrice) : 'Any';
      const max = criteria.maxPrice ? formatPrice(criteria.maxPrice) : 'Any';
      parts.push(`${min} - ${max}`);
    }
    if (criteria.bedrooms) parts.push(`${criteria.bedrooms}+ beds`);
    if (criteria.bathrooms) parts.push(`${criteria.bathrooms}+ baths`);
    
    return parts.length > 0 ? parts.join(' • ') : 'No criteria set';
  };

  if (loading && !search) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!search) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Search not found</h2>
          <Button onClick={() => router.push('/dashboard/saved-searches')}>
            Back to Saved Searches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/saved-searches')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Saved Searches
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{search.name}</h1>
            <p className="text-muted-foreground mb-4">
              {formatCriteria(search.searchCriteria)}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {search.resultsCount} properties
              </span>
              {search.newMatchingProperties.length > 0 && (
                <span className="flex items-center gap-2 text-green-600 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  {search.newMatchingProperties.length} new matches
                </span>
              )}
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {search.notificationFrequency}
              </span>
            </div>
          </div>

          <Button onClick={() => setShowEditModal(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Search
          </Button>
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : properties.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No properties currently match your search criteria. We'll notify you when new listings become available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card
                key={property._id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/properties/${property._id}`)}
              >
                {/* Property Image */}
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0].url}
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Home className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {property.isFeatured && (
                      <Badge className="bg-yellow-500">Featured</Badge>
                    )}
                    {property.isVerified && (
                      <Badge className="bg-blue-500">Verified</Badge>
                    )}
                    {search.newMatchingProperties.includes(property._id) && (
                      <Badge className="bg-green-500">New</Badge>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(property._id, false);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                  >
                    <Heart className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <CardContent className="p-4">
                  {/* Price & Type */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(property.price)}
                    </p>
                    <Badge variant="secondary">
                      {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {property.title}
                  </h3>

                  {/* Location */}
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="h-4 w-4" />
                    {property.city}, {property.state}
                  </p>

                  {/* Amenities */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {property.amenities.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.amenities.bathrooms}
                    </span>
                    {property.amenities.squareFootage && (
                      <span className="flex items-center gap-1">
                        <Square className="h-4 w-4" />
                        {property.amenities.squareFootage} sqft
                      </span>
                    )}
                  </div>

                  {/* Views */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Eye className="h-3 w-3" />
                    {property.views} views
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <SaveSearchModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdateSearch}
        initialData={{
          name: search.name,
          searchCriteria: search.searchCriteria,
          notificationFrequency: search.notificationFrequency,
          isActive: search.isActive
        }}
      />
    </div>
  );
}