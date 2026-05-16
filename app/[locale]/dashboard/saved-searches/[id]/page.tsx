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
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
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

    const PillWrap = ({ icon: Icon, children }: { icon: any, children: React.ReactNode }) => (
      <div className="flex items-center gap-1.5 bg-white border border-[#DDDDDD] text-[#222222] text-[12px] font-medium px-3 py-1.5 rounded-full">
        <Icon className="w-3.5 h-3.5 text-[#222222]" />
        {children}
      </div>
    );

    if (criteria.city) pills.push(<PillWrap key="city" icon={MapPin}>{criteria.city}</PillWrap>);
    if (criteria.listingType) pills.push(<PillWrap key="type" icon={HomeIcon}>{criteria.listingType === 'sale' ? 'Buy' : 'Rent'}</PillWrap>);
    if (criteria.propertyType) pills.push(<PillWrap key="ptype" icon={Home}>{criteria.propertyType}</PillWrap>);
    if (criteria.minPrice || criteria.maxPrice) {
      pills.push(
        <PillWrap key="price" icon={Banknote}>
          {criteria.minPrice ? formatPrice(criteria.minPrice) : 'Any'} - {criteria.maxPrice ? formatPrice(criteria.maxPrice) : 'Any'}
        </PillWrap>
      );
    }
    if (criteria.bedrooms) pills.push(<PillWrap key="beds" icon={Bed}>{criteria.bedrooms}+ Beds</PillWrap>);
    if (criteria.bathrooms) pills.push(<PillWrap key="baths" icon={Bath}>{criteria.bathrooms}+ Baths</PillWrap>);

    if (pills.length === 0) {
      return <span className="text-[14px] text-[#717171] italic">No specific criteria</span>;
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
        <div className="flex min-h-screen w-full bg-white">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <main className="p-6 lg:p-10">
              <div className="max-w-7xl mx-auto space-y-10">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-4 w-full">
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-10 w-80 rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24 rounded-full" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                      <Skeleton className="h-8 w-28 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-32 rounded-lg" />
                </div>

                {/* Statistics Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-[#DDDDDD] flex flex-col gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-8 w-16 rounded" />
                        <Skeleton className="h-3 w-32 rounded" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Properties Display Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
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
        <div className="flex min-h-screen w-full bg-white">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <div className="bg-[#F7F7F7] rounded-2xl border border-[#DDDDDD] py-24 mx-6 lg:mx-10 my-10 flex flex-col items-center text-center px-6">
              <div className="w-16 h-16 bg-white border border-[#DDDDDD] text-[#222222] rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Search className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-[22px] font-semibold text-[#222222] mb-2">Search not found</h3>
              <p className="text-[16px] text-[#717171] max-w-sm mb-8">
                We couldn't find the saved search you are looking for. It may have been deleted.
              </p>
              <Button onClick={() => router.push('/dashboard/saved-searches')} className="rounded-lg px-8 bg-blue-600 hover:bg-blue-700 text-white h-12 text-[15px] font-semibold">
                Back to saved searches
              </Button>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <main className="p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-10">

              {/* ── HEADER SECTION ── */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard/saved-searches')}
                    className="gap-2 text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] -ml-4 rounded-lg px-4 h-10 font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 stroke-[2]" />
                    Back to saved searches
                  </Button>

                  <h1 className="text-[32px] font-semibold tracking-tight text-[#222222]">{search.name}</h1>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {formatCriteriaPills(search.searchCriteria)}
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <Button
                    onClick={() => setShowEditModal(true)}
                    variant="outline"
                    className="border-[#DDDDDD] text-[#222222] hover:bg-[#F7F7F7] hover:border-blue-600 transition-colors rounded-lg h-11 px-6 font-semibold text-[15px]"
                  >
                    <Edit className="w-4 h-4 mr-2 stroke-[2]" /> Edit Search
                  </Button>
                </div>
              </div>

              {/* ── Statistics Cards ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-[#DDDDDD] flex flex-col hover:border-blue-600 transition-colors duration-200">
                  <div className="mb-4 text-[#222222]">
                    <HomeIcon className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#717171] mb-1">Total Results</p>
                    <h3 className="text-3xl font-semibold text-[#222222] tracking-tight">{search.resultsCount}</h3>
                    <p className="text-[14px] text-[#717171] mt-2">Matching properties found</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-[#DDDDDD] flex flex-col hover:border-blue-600 transition-colors duration-200">
                  <div className="mb-4 text-[#222222]">
                    <TrendingUp className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#717171] mb-1">New Matches</p>
                    <h3 className="text-3xl font-semibold tracking-tight text-[#FF385C]">{search.newMatchingProperties.length}</h3>
                    <p className="text-[14px] text-[#717171] mt-2">Since your last check</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-[#DDDDDD] flex flex-col hover:border-blue-600 transition-colors duration-200">
                  <div className="mb-4 text-[#222222]">
                    <Bell className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#717171] mb-1">Alert Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {search.isActive ? (
                        <span className="bg-[#ECFDF5] text-[#008A05] border border-[#008A05]/20 px-2.5 py-1 rounded-full text-[12px] font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD] px-2.5 py-1 rounded-full text-[12px] font-semibold">
                          Paused
                        </span>
                      )}
                      <span className="text-[20px] font-semibold text-[#222222] capitalize ml-1">{search.notificationFrequency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Properties Display ── */}
              <div>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <PropertyCardSkeleton key={i} />
                    ))}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="bg-[#F7F7F7] rounded-2xl border border-[#DDDDDD] py-24 flex flex-col items-center text-center px-6">
                    <div className="w-16 h-16 bg-white border border-[#DDDDDD] text-[#222222] rounded-full flex items-center justify-center mb-6">
                      <HomeIcon className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <h3 className="text-[22px] font-semibold text-[#222222] mb-2">No properties match your criteria</h3>
                    <p className="text-[16px] text-[#717171] max-w-md mb-8">
                      We currently don't have any properties matching this specific hunt. We'll automatically notify you the moment a new one hits the market!
                    </p>
                    <Button
                      onClick={() => setShowEditModal(true)}
                      variant="outline"
                      className="border-blue-600 text-[#222222] hover:bg-blue-600 hover:text-white transition-colors rounded-xl h-12 px-8 font-semibold text-[15px]"
                    >
                      <Search className="w-4 h-4 mr-2 stroke-[2]" /> Adjust Criteria
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
                          {/* Updated Blue New Match Badge Overlay */}
                          {search.newMatchingProperties.includes(property._id) && (
                            <div className="absolute top-4 left-4 z-20 pointer-events-none">
                              <Badge className="blue-blue-600 hover:blue-blue-600 text-white rounded-md border-none font-bold px-3 py-1 text-[11px] tracking-wider">
                                NEW MATCH
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-12 w-fit mx-auto">
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="rounded-xl border-[#DDDDDD] hover:border-blue-600 text-[#222222] hover:bg-[#F7F7F7] font-semibold h-11 px-6"
                        >
                          Previous
                        </Button>
                        <span className="text-[15px] font-medium text-[#717171] px-2">
                          <span className="text-[#222222] font-semibold">{page}</span> of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="rounded-xl border-[#DDDDDD] hover:border-blue-600 text-[#222222] hover:bg-[#F7F7F7] font-semibold h-11 px-6"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Edit Modal ── */}
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