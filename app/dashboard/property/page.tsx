'use client';
import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { PropertyCard } from '@/components/dashboard/PropertyCard';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Home, Search, SlidersHorizontal, Plus, Heart, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface Property {
  _id: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  location?: {
    address: string;
    city: string;
    state: string;
  };
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: {
    bedrooms?: number;
    bathrooms?: number;
  };
  beds?: number;
  baths?: number;
  area?: number;
  sqft?: number;
  squareFeet?: number;
  images: Array<{ url: string } | string>;
  type: string;
  listingType?: string;
  status: string;
  availability?: string;
  isFeatured: boolean;
  isVerified: boolean;
  viewCount?: number;
  viewsCount?: number;
  views?: number;
  favoriteCount?: number;
  favorites?: number;
  inquiries?: number;
  isFavorite?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

const PropertyPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterListingType, setFilterListingType] = useState('all');
  const [filterPropertyType, setFilterPropertyType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBedrooms, setFilterBedrooms] = useState('all');
  const [filterBathrooms, setFilterBathrooms] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('recent');

  const isAgent = user?.role === 'agent' || user?.role === 'admin';
  const isRegularUser = user?.role === 'registered_user';

  // Page configuration based on role
  const pageConfig = {
    title: isAgent ? 'My Properties' : 'My Favorites',
    description: isAgent 
      ? 'Manage and track all your property listings'
      : 'Your saved favorite properties',
    icon: isAgent ? Home : Heart,
    emptyMessage: isAgent
      ? 'Get started by adding your first property listing'
      : 'You haven\'t added any favorites yet',
    emptySearchMessage: isAgent
      ? 'No properties match your filters'
      : 'No favorite properties match your filters',
  };

  // Fetch properties based on role
  const fetchProperties = async () => {
    if (!user) {
      console.log('⚠️ No user found, skipping properties fetch');
      return;
    }

    try {
      setLoading(true);
      console.log('\n🔍 ==================== FETCHING PROPERTIES ====================');
      console.log('👤 User role:', user.role);
      console.log('🔐 Is Agent:', isAgent);
      console.log('👥 Is Regular User:', isRegularUser);
      
      let response;
      const params: any = {
        page: 1,
        limit: 100, // Get more properties for client-side filtering
      };

      // Fetch based on role (without filters - we'll filter client-side)
      if (isAgent) {
        console.log('🏢 Fetching agent properties');
        params.includeInactive = true; // Include all properties for agents
        response = await apiClient.getMyProperties(params);
      } else if (isRegularUser) {
        console.log('❤️ Fetching user favorite properties');
        response = await apiClient.getMyFavoriteProperties(params);
      } else {
        console.log('⚠️ Unknown user role, fetching general properties');
        response = await apiClient.searchProperties(params);
      }

      console.log('📦 Properties response:', response);

      // Extract properties from response
      let propertyData: Property[] = [];
      if (Array.isArray(response)) {
        propertyData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        propertyData = response.data;
      } else if (response?.properties && Array.isArray(response.properties)) {
        propertyData = response.properties;
      }

      // Mark all as favorites for regular users
      if (isRegularUser) {
        propertyData = propertyData.map(p => ({ ...p, isFavorite: true }));
      }

      console.log(`✅ Loaded ${propertyData.length} properties`);
      console.log('==================== END PROPERTIES FETCH ====================\n');
      
      setAllProperties(propertyData);
      setProperties(propertyData);
    } catch (error: any) {
      console.error('\n💥 ==================== PROPERTIES FETCH FAILED ====================');
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      console.error('==================== END ERROR ====================\n');
      setAllProperties([]);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting client-side
  const applyFilters = () => {
    console.log('\n🔧 ==================== APPLYING FILTERS ====================');
    let filtered = [...allProperties];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(property => {
        const title = (property.title || '').toLowerCase();
        const description = (property.description || '').toLowerCase();
        const city = (property.city || '').toLowerCase();
        const address = (property.address || '').toLowerCase();
        
        return title.includes(search) || 
               description.includes(search) || 
               city.includes(search) || 
               address.includes(search);
      });
      console.log(`🔍 After search "${searchTerm}": ${filtered.length} properties`);
    }

    // Listing type filter (sale/rent)
    if (filterListingType !== 'all') {
      filtered = filtered.filter(property => {
        const listingType = (property.listingType || property.type || '').toLowerCase();
        return listingType === filterListingType.toLowerCase();
      });
      console.log(`📋 After listing type "${filterListingType}": ${filtered.length} properties`);
    }

    // Property type filter (house/apartment/etc)
    if (filterPropertyType !== 'all') {
      filtered = filtered.filter(property => {
        const propertyType = (property.type || '').toLowerCase();
        return propertyType === filterPropertyType.toLowerCase();
      });
      console.log(`🏠 After property type "${filterPropertyType}": ${filtered.length} properties`);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(property => {
        const status = (property.status || property.availability || '').toLowerCase();
        return status === filterStatus.toLowerCase();
      });
      console.log(`📊 After status "${filterStatus}": ${filtered.length} properties`);
    }

    // Bedrooms filter
    if (filterBedrooms !== 'all') {
      const bedroomCount = parseInt(filterBedrooms);
      filtered = filtered.filter(property => {
        const beds = property.amenities?.bedrooms ?? property.bedrooms ?? property.beds ?? 0;
        return beds >= bedroomCount;
      });
      console.log(`🛏️ After bedrooms "${filterBedrooms}+": ${filtered.length} properties`);
    }

    // Bathrooms filter
    if (filterBathrooms !== 'all') {
      const bathroomCount = parseInt(filterBathrooms);
      filtered = filtered.filter(property => {
        const baths = property.amenities?.bathrooms ?? property.bathrooms ?? property.baths ?? 0;
        return baths >= bathroomCount;
      });
      console.log(`🚿 After bathrooms "${filterBathrooms}+": ${filtered.length} properties`);
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(property => {
        const price = property.price || 0;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
      console.log(`💰 After price range ${priceRange.min}-${priceRange.max}: ${filtered.length} properties`);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'popular':
          const aViews = a.viewsCount ?? a.viewCount ?? a.views ?? 0;
          const bViews = b.viewsCount ?? b.viewCount ?? b.views ?? 0;
          return bViews - aViews;
        default:
          return 0;
      }
    });

    console.log(`✅ Final result after sorting by "${sortBy}": ${sorted.length} properties`);
    console.log('==================== END FILTERS ====================\n');
    
    setProperties(sorted);
  };

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, [user]);

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [
    allProperties,
    searchTerm,
    filterListingType,
    filterPropertyType,
    filterStatus,
    filterBedrooms,
    filterBathrooms,
    priceRange,
    sortBy
  ]);

  const handlePropertyUpdate = () => {
    fetchProperties();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterListingType('all');
    setFilterPropertyType('all');
    setFilterStatus('all');
    setFilterBedrooms('all');
    setFilterBathrooms('all');
    setPriceRange({ min: '', max: '' });
    setSortBy('recent');
  };

  // Check if any filters are active
  const hasActiveFilters = 
    searchTerm !== '' ||
    filterListingType !== 'all' ||
    filterPropertyType !== 'all' ||
    filterStatus !== 'all' ||
    filterBedrooms !== 'all' ||
    filterBathrooms !== 'all' ||
    priceRange.min !== '' ||
    priceRange.max !== '' ||
    sortBy !== 'recent';

  // Format time ago
  const getTimeAgo = (date?: string): string | undefined => {
    if (!date) return undefined;
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  const PageIcon = pageConfig.icon;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 min-h-screen pt-14 lg:pt-0">
            <div className="flex-1 p-4 lg:p-8 bg-gray-50">
              <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isAgent ? 'bg-blue-100' : 'bg-pink-100'}`}>
                        <PageIcon className={`w-6 h-6 ${isAgent ? 'text-blue-600' : 'text-pink-600'}`} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {pageConfig.title}
                        </h1>
                        <p className="text-sm text-gray-600">
                          {pageConfig.description}
                        </p>
                      </div>
                    </div>
                    {isAgent && (
                      <Button
                        onClick={() => router.push('/dashboard/propertyForm')}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Property
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">Filters</h3>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Search */}
                    <div className="w-full">
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search by title, city, or address..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* First Row: Listing Type, Property Type, Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Listing Type (Sale/Rent) */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Listing Type
                        </label>
                        <Select value={filterListingType} onValueChange={setFilterListingType}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Listings" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Listings</SelectItem>
                            <SelectItem value="sale">For Sale</SelectItem>
                            <SelectItem value="rent">For Rent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Property Type */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Property Type
                        </label>
                        <Select value={filterPropertyType} onValueChange={setFilterPropertyType}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="studio">Studio</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Status
                        </label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Second Row: Bedrooms, Bathrooms, Sort */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Bedrooms */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Bedrooms
                        </label>
                        <Select value={filterBedrooms} onValueChange={setFilterBedrooms}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            <SelectItem value="1">1+ Bed</SelectItem>
                            <SelectItem value="2">2+ Beds</SelectItem>
                            <SelectItem value="3">3+ Beds</SelectItem>
                            <SelectItem value="4">4+ Beds</SelectItem>
                            <SelectItem value="5">5+ Beds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bathrooms */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Bathrooms
                        </label>
                        <Select value={filterBathrooms} onValueChange={setFilterBathrooms}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            <SelectItem value="1">1+ Bath</SelectItem>
                            <SelectItem value="2">2+ Baths</SelectItem>
                            <SelectItem value="3">3+ Baths</SelectItem>
                            <SelectItem value="4">4+ Baths</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Sort By
                        </label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent">Most Recent</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                            <SelectItem value="popular">Most Popular</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Third Row: Price Range */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Price Range (XAF)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="number"
                          placeholder="Min price"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Max price"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                      {searchTerm && (
                        <Badge variant="secondary" className="gap-1">
                          Search: {searchTerm}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setSearchTerm('')}
                          />
                        </Badge>
                      )}
                      {filterListingType !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {filterListingType === 'sale' ? 'For Sale' : 'For Rent'}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setFilterListingType('all')}
                          />
                        </Badge>
                      )}
                      {filterPropertyType !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {filterPropertyType.charAt(0).toUpperCase() + filterPropertyType.slice(1)}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setFilterPropertyType('all')}
                          />
                        </Badge>
                      )}
                      {filterStatus !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setFilterStatus('all')}
                          />
                        </Badge>
                      )}
                      {filterBedrooms !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {filterBedrooms}+ Beds
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setFilterBedrooms('all')}
                          />
                        </Badge>
                      )}
                      {filterBathrooms !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {filterBathrooms}+ Baths
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setFilterBathrooms('all')}
                          />
                        </Badge>
                      )}
                      {(priceRange.min || priceRange.max) && (
                        <Badge variant="secondary" className="gap-1">
                          {priceRange.min || '0'} - {priceRange.max || '∞'} XAF
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setPriceRange({ min: '', max: '' })}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Properties Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : properties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className={`p-4 rounded-full mb-4 ${isAgent ? 'bg-gray-100' : 'bg-pink-100'}`}>
                        <PageIcon className={`w-12 h-12 ${isAgent ? 'text-gray-400' : 'text-pink-400'}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No properties found
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        {hasActiveFilters
                          ? pageConfig.emptySearchMessage
                          : pageConfig.emptyMessage}
                      </p>
                      {hasActiveFilters ? (
                        <Button onClick={clearAllFilters} variant="outline">
                          <X className="w-4 h-4 mr-2" />
                          Clear Filters
                        </Button>
                      ) : (
                        <>
                          {isAgent && (
                            <Button onClick={() => router.push('/dashboard/propertyForm')}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Your First Property
                            </Button>
                          )}
                          {isRegularUser && (
                            <Button onClick={() => router.push('/dashboard')}>
                              <Search className="w-4 h-4 mr-2" />
                              Browse Properties
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-600">
                          Showing <span className="font-semibold">{properties.length}</span> of{' '}
                          <span className="font-semibold">{allProperties.length}</span>{' '}
                          {properties.length === 1 ? 'property' : 'properties'}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => {
                          const propertyId = property._id || property.id || '';
                          const images = property.images || [];
                          
                          const imageUrls = images.map(img => 
                            typeof img === 'string' ? img : img?.url || ''
                          ).filter(Boolean);
                          
                          const firstImage = imageUrls[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500';
                          
                          const addressParts = [
                            property.address,
                            property.city,
                            property.state || property.country
                          ].filter(Boolean);
                          const locationStr = addressParts.length > 0 
                            ? addressParts.join(', ')
                            : 'Location not specified';

                          const beds = property.amenities?.bedrooms ?? property.bedrooms ?? property.beds ?? 0;
                          const baths = property.amenities?.bathrooms ?? property.bathrooms ?? property.baths ?? 0;
                          const sqft = property.area || property.sqft || property.squareFeet || 0;
                          const viewCount = property.viewsCount ?? property.viewCount ?? property.views ?? 0;
                          const favoriteCount = property.favoriteCount ?? property.favorites ?? 0;

                          return (
                            <PropertyCard
                              key={propertyId}
                              id={propertyId}
                              image={firstImage}
                              images={imageUrls}
                              title={property.title || 'Untitled Property'}
                              location={locationStr}
                              price={property.price || 0}
                              beds={beds}
                              baths={baths}
                              sqft={sqft}
                              type={property.listingType || property.type || 'sale'}
                              status={property.status || property.availability || 'active'}
                              isFeatured={property.isFeatured || false}
                              isVerified={property.isVerified || false}
                              viewCount={viewCount}
                              favoriteCount={favoriteCount}
                              isFavorite={property.isFavorite || false}
                              onUpdate={handlePropertyUpdate}
                              timeAgo={getTimeAgo(property.createdAt)}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PropertyPage;