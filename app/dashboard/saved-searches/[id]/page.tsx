"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Bed,
  Bath,
  Home,
  Square,
  TrendingUp,
  Bell,
  Edit,
  Banknote,
  Search,
  BellRing,
  Home as HomeIcon,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import SaveSearchModal from '@/components/saved-searches/SaveSearchModal';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { PropertyCard } from '@/components/dashboard/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton';

interface Property {
  _id: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  listingType: string;
  type: string;
  city: string;
  state: string;
  country?: string;
  address: string;
  amenities: {
    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;
    [key: string]: any;
  };
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  baths?: number;
  area?: number;
  sqft?: number;
  squareFeet?: number;
  status?: string;
  availability?: string;
  images: Array<{ url: string; publicId?: string } | string>;
  isFeatured: boolean;
  isVerified: boolean;
  isFavorite?: boolean;
  views: number;
  viewsCount?: number;
  viewCount?: number;
  favoriteCount?: number;
  favorites?: number;
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
  }, [searchId]);

  useEffect(() => {
    if (search && page > 1) {
      fetchProperties();
    }
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [searchData, propertiesData] = await Promise.all([
        apiClient.getSavedSearchById(searchId),
        apiClient.getSavedSearchProperties(searchId, 1, 20)
      ]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatCriteriaPills = (criteria: SavedSearch['searchCriteria']) => {
    const pills = [];

    if (criteria.city) {
      pills.push(
        <div key="city" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <MapPin className="w-3 h-3 text-indigo-500" />
          {criteria.city}
        </div>
      );
    }
    if (criteria.listingType) {
      pills.push(
        <div key="type" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <HomeIcon className="w-3 h-3 text-indigo-500" />
          {criteria.listingType === 'sale' ? 'Buy' : 'Rent'}
        </div>
      );
    }
    if (criteria.propertyType) {
      pills.push(
        <div key="ptype" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <Home className="w-3 h-3 text-indigo-500" />
          {criteria.propertyType}
        </div>
      );
    }
    if (criteria.minPrice || criteria.maxPrice) {
      pills.push(
        <div key="price" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <Banknote className="w-3 h-3 text-emerald-500" />
          {criteria.minPrice ? formatPrice(criteria.minPrice) : 'Any'} - {criteria.maxPrice ? formatPrice(criteria.maxPrice) : 'Any'}
        </div>
      );
    }
    if (criteria.bedrooms) {
      pills.push(
        <div key="beds" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <Bed className="w-3 h-3 text-blue-500" />
          {criteria.bedrooms}+ Beds
        </div>
      );
    }
    if (criteria.bathrooms) {
      pills.push(
        <div key="baths" className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm">
          <Bath className="w-3 h-3 text-cyan-500" />
          {criteria.bathrooms}+ Baths
        </div>
      );
    }

    if (pills.length === 0) {
      return <span className="text-xs text-slate-400 italic">No specific criteria</span>;
    }

    return pills;
  };

  const transformPropertyProps = (p: Property) => {
    const images = p.images || [];
    const imageUrls = images.map((img: any) => typeof img === 'string' ? img : img?.url || '').filter(Boolean);
    return {
      id: p._id || p.id || '',
      image: imageUrls[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500',
      images: imageUrls,
      title: p.title || 'Untitled Property',
      location: [p.address, p.city, p.state || p.country].filter(Boolean).join(', ') || 'Location not specified',
      price: p.price || 0,
      beds: p.amenities?.bedrooms ?? p.bedrooms ?? p.beds ?? 0,
      baths: p.amenities?.bathrooms ?? p.bathrooms ?? p.baths ?? 0,
      sqft: p.amenities?.squareFootage ?? p.area ?? p.sqft ?? p.squareFeet ?? 0,
      type: p.listingType || p.type || 'sale',
      status: p.status || p.availability || 'active',
      isFavorite: p.isFavorite || false,
      viewCount: p.views ?? p.viewsCount ?? p.viewCount ?? 0,
      favoriteCount: p.favoriteCount ?? p.favorites ?? 0,
      isNewMatch: search?.newMatchingProperties.includes(p._id)
    };
  };

  if (loading && !search) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#f8fafc]">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <main className="p-4 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-4 w-full">
                    <Skeleton className="h-4 w-40 rounded-md ml-1" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                      <Skeleton className="h-8 w-64 rounded-md" />
                    </div>
                    <div className="pl-11 pr-4 flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-md" />
                      <Skeleton className="h-6 w-16 rounded-md" />
                      <Skeleton className="h-6 w-24 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-32 rounded-md md:mt-12" />
                </div>

                {/* Statistics Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2 flex-1 mt-1">
                        <Skeleton className="h-3 w-24 rounded-md" />
                        <Skeleton className="h-6 w-12 rounded-md" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Properties Display Skeleton */}
                <div className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <PropertyCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!search) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#f8fafc]">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 mx-4 lg:mx-8 my-8 flex flex-col items-center text-center px-4">
              <div className="p-6 bg-slate-100 text-slate-400 rounded-full mb-6">
                <Search className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Search not found</h3>
              <p className="text-slate-500 max-w-sm mb-8">
                We couldn't find the saved search you are looking for. It may have been deleted.
              </p>
              <Button onClick={() => router.push('/dashboard/saved-searches')} className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 h-11">
                Back to Saved Searches
              </Button>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* HEADER SECTION */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard/saved-searches')}
                    className="gap-2 text-slate-500 hover:text-slate-900 -ml-3"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Saved Searches
                  </Button>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50">
                      <BellRing className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{search.name}</h1>
                    </div>
                  </div>

                  <div className="pl-11 pr-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formatCriteriaPills(search.searchCriteria)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:mt-12">
                  <Button onClick={() => setShowEditModal(true)} variant="outline" className="shadow-sm border-slate-200 hover:bg-slate-50 transition-all">
                    <Edit className="w-4 h-4 mr-2" /> Edit Search
                  </Button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium text-sm mb-1">Total Results</p>
                    <h3 className="text-2xl font-bold text-slate-800">{search.resultsCount}</h3>
                    <p className="text-xs text-slate-400 mt-1">Matching properties found</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium text-sm mb-1">New Matches</p>
                    <h3 className="text-2xl font-bold text-slate-800 text-emerald-600">{search.newMatchingProperties.length}</h3>
                    <p className="text-xs text-slate-400 mt-1">Since your last check</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium text-sm mb-1">Alert Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {search.isActive ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-2 py-0 h-5 text-[10px] font-semibold uppercase tracking-wider">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-none px-2 py-0 h-5 text-[10px] font-semibold uppercase tracking-wider">Paused</Badge>
                      )}
                      <span className="text-lg font-bold text-slate-800 capitalize">{search.notificationFrequency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Properties Display */}
              <div className="mt-8">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <PropertyCardSkeleton key={i} />
                    ))}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center text-center px-4">
                    <div className="p-6 bg-slate-50 text-slate-400 rounded-full mb-6">
                      <HomeIcon className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No properties match your criteria</h3>
                    <p className="text-slate-500 max-w-sm mb-8">
                      We currently don't have any properties matching this specific hunt. We'll automatically notify you the moment a new one hits the market!
                    </p>
                    <Button onClick={() => setShowEditModal(true)} variant="outline" className="rounded-full px-8 h-11 border-dashed">
                      <Search className="w-4 h-4 mr-2" /> Adjust Criteria
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {properties.map((property) => (
                        <div className="relative" key={property._id}>
                          <PropertyCard
                            {...transformPropertyProps(property)}
                            onUpdate={fetchProperties}
                          />
                          {/* New Match Badge Overlay */}
                          {search.newMatchingProperties.includes(property._id) && (
                            <div className="absolute top-4 left-4 z-20 pointer-events-none">
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md border-2 border-white font-bold px-3 py-1">
                                NEW MATCH
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 w-fit mx-auto">
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="rounded-xl border-slate-200"
                        >
                          Previous
                        </Button>
                        <span className="text-sm font-semibold text-slate-600 px-2">
                          Page <span className="text-indigo-600">{page}</span> of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="rounded-xl border-slate-200"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

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
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}