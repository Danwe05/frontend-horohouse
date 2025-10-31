'use client';

import React, { useState, useEffect, JSX } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  CheckCircle, 
  XCircle,
  MoreHorizontal,
  MapPin,
  Home,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

// Import your actual API client
import { apiClient } from '@/lib/api';

// TypeScript interfaces
interface PropertyAmenities {
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  hasGarden?: boolean;
  hasPool?: boolean;
  hasGym?: boolean;
  hasSecurity?: boolean;
  hasElevator?: boolean;
  hasBalcony?: boolean;
  hasAirConditioning?: boolean;
  hasInternet?: boolean;
  hasGenerator?: boolean;
  furnished?: boolean;
}

interface PropertyImage {
  url: string;
  publicId: string;
  caption?: string;
  isMain?: boolean;
}

interface Property {
  _id: string;
  id?: string;
  title: string;
  price: number;
  type: string;
  listingType: string;
  images?: PropertyImage[];
  description: string;
  amenities: PropertyAmenities;
  city: string;
  address: string;
  neighborhood?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  viewsCount: number;
  availability: string;
  ownerId: string;
  agentId?: string;
  area?: number;
  yearBuilt?: number;
  floorNumber?: number;
  totalFloors?: number;
  pricePerSqm?: number;
  depositAmount?: number;
  maintenanceFee?: number;
  contactPhone?: string;
  contactEmail?: string;
  keywords: string[];
  slug?: string;
  nearbyAmenities: string[];
  transportAccess: string[];
  inquiriesCount: number;
  favoritesCount: number;
  sharesCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  virtualTourUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface PropertyFilters {
  propertyType: string;
  listingType: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  includeInactive: boolean;
}

interface PropertyStats {
  totalProperties: number;
  activeProperties: number;
  featuredProperties: number;
  totalViews: number;
}

interface ApiResponse {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

// Property type options
const propertyTypeOptions = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
  { value: 'shop', label: 'Shop' },
  { value: 'warehouse', label: 'Warehouse' }
] as const;

const listingTypeOptions = [
  { value: 'sale', label: 'Sale' },
  { value: 'rent', label: 'Rent' }
] as const;

const PropertyManagementDashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<PropertyFilters>({
    propertyType: '',
    listingType: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    includeInactive: true
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    activeProperties: 0,
    featuredProperties: 0,
    totalViews: 0
  });

  useEffect(() => {
    fetchProperties();
  }, [currentPage, filters]);

  const fetchProperties = async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: 20,
        ...filters,
        includeInactive: filters.includeInactive
      };

      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response: ApiResponse = await apiClient.getMyProperties(params);
      
      setProperties(response.properties || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 0);
      
      // Calculate stats
      const activeCount = response.properties?.filter(p => p.isActive).length || 0;
      const featuredCount = response.properties?.filter(p => p.isFeatured).length || 0;
      const totalViews = response.properties?.reduce((sum, p) => sum + (p.viewsCount || 0), 0) || 0;
      
      setStats({
        totalProperties: response.total || 0,
        activeProperties: activeCount,
        featuredProperties: featuredCount,
        totalViews
      });

    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PropertyFilters, value: string | boolean): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = (): void => {
    setFilters({
      propertyType: '',
      listingType: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      includeInactive: true
    });
    setCurrentPage(1);
  };

  const handlePropertyAction = async (
    propertyId: string, 
    action: string, 
    newValue?: boolean
  ): Promise<void> => {
    setActionLoading(prev => ({ ...prev, [propertyId]: action }));
    
    try {
      let response: any;
      switch (action) {
        case 'toggleActive':
          response = await apiClient.togglePropertyActive(propertyId, newValue!);
          break;
        case 'toggleFeatured':
          response = await apiClient.togglePropertyFeatured(propertyId, newValue!);
          break;
        case 'toggleVerified':
          response = await apiClient.togglePropertyVerified(propertyId, newValue!);
          break;
        case 'delete':
          response = await apiClient.deleteProperty(propertyId);
          break;
        default:
          return;
      }

      if (response) {
        await fetchProperties();
      }
    } catch (error) {
      console.error(`Failed to ${action} property:`, error);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[propertyId];
        return newState;
      });
    }
  };

  const handleDelete = (property: Property): void => {
    setPropertyToDelete(property);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (propertyToDelete) {
      await handlePropertyAction(propertyToDelete._id || propertyToDelete.id!, 'delete');
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const togglePropertySelection = (propertyId: string): void => {
    const newSelection = new Set(selectedProperties);
    if (newSelection.has(propertyId)) {
      newSelection.delete(propertyId);
    } else {
      newSelection.add(propertyId);
    }
    setSelectedProperties(newSelection);
  };

  const selectAllProperties = (): void => {
    if (selectedProperties.size === properties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(properties.map(p => p._id || p.id!)));
    }
  };

  const formatPrice = (price: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (property: Property): JSX.Element => {
    if (!property.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: 'default',
      sold: 'secondary',
      rented: 'secondary',
      pending: 'outline',
      draft: 'outline'
    };
    
    const variant = statusVariants[property.availability] || 'default';
    
    return (
      <Badge variant={variant}>
        {property.availability?.charAt(0).toUpperCase() + property.availability?.slice(1) || 'Active'}
      </Badge>
    );
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
  }> = ({ title, value, icon: Icon }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );

  const getPropertyId = (property: Property): string => {
    return property._id || property.id || '';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Property Management</h1>
            <p className="text-muted-foreground mt-1">Manage your property listings</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Properties" 
            value={stats.totalProperties} 
            icon={Home}
          />
          <StatCard 
            title="Active Listings" 
            value={stats.activeProperties} 
            icon={CheckCircle}
          />
          <StatCard 
            title="Featured" 
            value={stats.featuredProperties} 
            icon={Star}
          />
          <StatCard 
            title="Total Views" 
            value={stats.totalViews} 
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Select
                  value={filters.propertyType}
                  onValueChange={(value) => handleFilterChange('propertyType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {propertyTypeOptions.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.listingType}
                  onValueChange={(value) => handleFilterChange('listingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sale & Rent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type">Sale & Rent</SelectItem>
                    {listingTypeOptions.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  placeholder="City"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeInactive"
                    checked={filters.includeInactive}
                    onCheckedChange={(checked) => handleFilterChange('includeInactive', Boolean(checked))}
                  />
                  <Label htmlFor="includeInactive" className="text-sm">
                    Include Inactive
                  </Label>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </>
          )}
        </CardHeader>
      </Card>

      {/* Bulk Actions */}
      {selectedProperties.size > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                {selectedProperties.size} properties selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Toggle Active
                </Button>
                <Button variant="destructive" size="sm">
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading properties...</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No properties found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating a new property listing.
              </p>
              <div className="mt-6">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProperties.size === properties.length && properties.length > 0}
                        onCheckedChange={selectAllProperties}
                      />
                    </TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => {
                    const propertyId = getPropertyId(property);
                    return (
                      <TableRow key={propertyId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProperties.has(propertyId)}
                            onCheckedChange={() => togglePropertySelection(propertyId)}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {property.images && property.images.length > 0 ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover"
                                  src={property.images[0].url}
                                  alt={property.title}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                  <Home className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-medium truncate max-w-xs">
                                  {property.title}
                                </div>
                                {property.isFeatured && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                )}
                                {property.isVerified && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {property.amenities?.bedrooms || 0} bed • {property.amenities?.bathrooms || 0} bath
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="font-medium">
                            {formatPrice(property.price)}
                          </div>
                          {property.listingType === 'rent' && (
                            <div className="text-sm text-muted-foreground">/month</div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="secondary">
                            {property.type?.charAt(0).toUpperCase() + property.type?.slice(1)}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {property.listingType?.charAt(0).toUpperCase() + property.listingType?.slice(1)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                            <div>
                              <div className="font-medium">{property.city}</div>
                              {property.neighborhood && (
                                <div className="text-xs text-muted-foreground">{property.neighborhood}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(property)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Eye className="h-4 w-4 text-muted-foreground mr-1" />
                            {property.viewsCount || 0}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {actionLoading[propertyId] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handlePropertyAction(
                                  propertyId, 
                                  'toggleActive', 
                                  !property.isActive
                                )}
                              >
                                {property.isActive ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePropertyAction(
                                  propertyId, 
                                  'toggleFeatured', 
                                  !property.isFeatured
                                )}
                              >
                                <Star className="mr-2 h-4 w-4" />
                                {property.isFeatured ? 'Unfeature' : 'Feature'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(property)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, total)} of {total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{propertyToDelete?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PropertyManagementDashboard;