'use client';

import React, { useState, useEffect } from 'react';
import { PropertyCard, Property, PropertyType, ListingType } from './PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, MapPin, SlidersHorizontal } from 'lucide-react';
import { propertyService } from '@/lib/services/propertyService';

export interface PropertySearchFilters {
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  listingType?: ListingType;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface PropertySearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}

export interface PropertyListProps {
  initialFilters?: PropertySearchFilters;
  initialOptions?: PropertySearchOptions;
  showFilters?: boolean;
  variant?: 'grid' | 'list';
  className?: string;
}

export function PropertyList({
  initialFilters = {},
  initialOptions = { page: 1, limit: 12, sortBy: 'createdAt', sortOrder: 'desc' },
  showFilters = true,
  variant = 'grid',
  className
}: PropertyListProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PropertySearchFilters>(initialFilters);
  const [options, setOptions] = useState<PropertySearchOptions>(initialOptions);
  const [searchText, setSearchText] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [totalPages, setTotalPages] = useState(0);
  const [totalProperties, setTotalProperties] = useState(0);
  const [currentPage, setCurrentPage] = useState(options.page || 1);

  // Load properties
  const loadProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await propertyService.searchProperties(filters, {
        ...options,
        page: currentPage
      });
      
      setProperties(response.properties);
      setTotalPages(response.totalPages);
      setTotalProperties(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties');
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load properties when filters or options change
  useEffect(() => {
    loadProperties();
  }, [filters, options, currentPage]);

  // Handle search
  const handleSearch = async () => {
    if (searchText.trim()) {
      setLoading(true);
      try {
        const response = await propertyService.searchByText(searchText, filters, {
          ...options,
          page: 1
        });
        setProperties(response.properties);
        setTotalPages(response.totalPages);
        setTotalProperties(response.total);
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    } else {
      loadProperties();
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof PropertySearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    setOptions(prev => ({
      ...prev,
      sortBy,
      sortOrder
    }));
    setCurrentPage(1);
  };

  // Handle favorite toggle
  const handleFavorite = async (propertyId: string) => {
    try {
      // Validate property ID before making API call
      if (!propertyId || propertyId.trim() === '') {
        console.error('Cannot toggle favorite: Property ID is empty or undefined');
        return;
      }
      
      // Validate MongoDB ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
        console.error('Cannot toggle favorite: Invalid property ID format:', propertyId);
        return;
      }
      
      if (favorites.has(propertyId)) {
        await propertyService.removeFavorite(propertyId);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
      } else {
        await propertyService.addFavorite(propertyId);
        setFavorites(prev => new Set(prev).add(propertyId));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Handle property view
  const handleView = (propertyId: string) => {
    // Validate property ID before navigation
    if (!propertyId || propertyId.trim() === '') {
      console.error('Cannot navigate: Property ID is empty or undefined');
      return;
    }
    
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
      console.error('Cannot navigate: Invalid property ID format:', propertyId);
      return;
    }
    
    // Navigate to property detail page or open modal
    window.open(`/properties/${propertyId}`, '_blank');
  };

  // Handle share
  const handleShare = (property: Property) => {
    // Validate property ID before sharing
    const propertyId = property._id || property.id;
    if (!propertyId || propertyId.trim() === '') {
      console.error('Cannot share: Property ID is empty or undefined');
      return;
    }
    
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
      console.error('Cannot share: Invalid property ID format:', propertyId);
      return;
    }
    
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: `${window.location.origin}/properties/${propertyId}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/properties/${propertyId}`);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSearchText('');
    setCurrentPage(1);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Search properties..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.listingType || ''}
                onValueChange={(value) => handleFilterChange('listingType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Listing Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={ListingType.SALE}>For Sale</SelectItem>
                  <SelectItem value={ListingType.RENT}>For Rent</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.propertyType || ''}
                onValueChange={(value) => handleFilterChange('propertyType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {Object.values(PropertyType).map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="City"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
              />

              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min Price"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max Price"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bedrooms</label>
                  <Select
                    value={filters.bedrooms?.toString() || ''}
                    onValueChange={(value) => handleFilterChange('bedrooms', value === 'any' ? undefined : Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+ bedrooms
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bathrooms</label>
                  <Select
                    value={filters.bathrooms?.toString() || ''}
                    onValueChange={(value) => handleFilterChange('bathrooms', value === 'any' ? undefined : Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+ bathrooms
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {Object.keys(filters).length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <Badge key={key} variant="secondary" className="cursor-pointer">
                      {key}: {value.toString()}
                    </Badge>
                  );
                })}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {totalProperties} Properties Found
          </h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={`${options.sortBy}-${options.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc'];
              handleSortChange(sortBy, sortOrder);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="viewsCount-desc">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={loadProperties} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Properties Grid */}
      {!loading && !error && (
        <>
          <div className={`grid gap-6 ${
            variant === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {properties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onFavorite={handleFavorite}
                onShare={handleShare}
                onView={handleView}
                isFavorited={favorites.has(property._id)}
                variant={variant === 'list' ? 'detailed' : 'default'}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && properties.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PropertyList;
