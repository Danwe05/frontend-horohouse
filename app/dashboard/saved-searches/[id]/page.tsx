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
  Bell,
  Edit,
  ExternalLink,
  MoreVertical,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import Image from 'next/image';
import SaveSearchModal from '@/components/saved-searches/SaveSearchModal';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

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
      
      console.log('🔍 Raw propertiesData:', propertiesData);
      console.log('🔍 Properties array:', propertiesData?.properties);
      
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
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!search) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <NavDash />
            <div className="container mx-auto py-8 px-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Search not found</h2>
                <Button onClick={() => router.push('/dashboard/saved-searches')}>
                  Back to Saved Searches
                </Button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 min-h-screen pt-0 px-6 lg:pt-3">
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

              <div className="flex items-start justify-between mb-6">
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Total Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{search.resultsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Matching properties
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      New Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {search.newMatchingProperties.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Since last check
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Alert Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold capitalize">{search.notificationFrequency}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search.isActive ? 'Active' : 'Paused'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Properties Table */}
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
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold w-[100px]">Property</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Price</TableHead>
                        <TableHead className="font-semibold text-center">Details</TableHead>
                        <TableHead className="font-semibold text-center">Views</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow 
                          key={property._id} 
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => router.push(`/properties/${property._id}`)}
                        >
                          {/* Property with Image */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {property.images && property.images.length > 0 ? (
                                  <Image
                                    src={property.images[0].url}
                                    alt={property.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <Home className="h-6 w-6 text-muted-foreground/50" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate w-[100px] ">{property.title}</p>
                                <div className="flex gap-2 mt-1">
                                  {property.isFeatured && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                  {search.newMatchingProperties.includes(property._id) && (
                                    <Badge variant="default" className="text-xs bg-green-500">
                                      New
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Location */}
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{property.city}, {property.state}</span>
                            </div>
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            <Badge variant={property.listingType === 'sale' ? 'default' : 'secondary'}>
                              {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                            </Badge>
                          </TableCell>

                          {/* Price */}
                          <TableCell>
                            <p className="font-bold text-primary">
                              {formatPrice(property.price)}
                            </p>
                          </TableCell>

                          {/* Details */}
                          <TableCell>
                            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
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
                                  {property.amenities.squareFootage}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Views */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              {property.views}
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/properties/${property._id}`);
                                }}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(property._id, false);
                                }}>
                                  <Heart className="h-4 w-4 mr-2" />
                                  Add to Favorites
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

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
                    <span className="text-sm text-muted-foreground px-4">
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}