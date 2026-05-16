'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Home,
  DollarSign,
  Calendar,
  Ruler,
  Save,
  Share2,
  Info,
  Loader2
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: 'rent' | 'sale';
  propertyType: string;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };
  images: string[];
  amenities: {
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
  };
  area?: number;
  yearBuilt?: number;
  status: 'active' | 'sold' | 'rented' | 'pending';
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

interface ComparisonSave {
  id: string;
  name: string;
  propertyIds: string[];
  createdAt: string;
}

const MAX_PROPERTIES = 3;

const ComparePropertiesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedComparisons, setSavedComparisons] = useState<ComparisonSave[]>([]);
  const [comparisonName, setComparisonName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/properties?status=active');
        // const data = await response.json();
        
        // Mock data for now
        const mockProperties: Property[] = [
          {
            id: '507f1f77bcf86cd799439011',
            title: 'Luxury 3BR Apartment in Victoria Island',
            description: 'Beautiful modern apartment with stunning lagoon views.',
            price: 2500000,
            currency: 'NGN',
            type: 'rent',
            propertyType: 'Apartment',
            location: {
              address: '123 Ahmadu Bello Way, Victoria Island',
              city: 'Lagos',
              state: 'Lagos',
              coordinates: [3.4273, 6.4281]
            },
            images: ['/api/placeholder/400/300'],
            amenities: {
              bedrooms: 3,
              bathrooms: 2,
              parkingSpaces: 2,
              hasPool: true,
              hasGym: true,
              hasSecurity: true,
              hasElevator: true,
              hasBalcony: true,
              hasAirConditioning: true,
              hasInternet: true,
              furnished: true
            },
            area: 120,
            yearBuilt: 2020,
            status: 'active',
            agent: {
              id: 'agent-1',
              name: 'John Doe',
              email: 'john@horohouse.com',
              phone: '+234 801 234 5678'
            },
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            id: '507f1f77bcf86cd799439012',
            title: 'Modern 4BR House in Lekki',
            description: 'Spacious family home in a gated community.',
            price: 45000000,
            currency: 'NGN',
            type: 'sale',
            propertyType: 'House',
            location: {
              address: '456 Lekki Phase 1',
              city: 'Lagos',
              state: 'Lagos',
              coordinates: [3.4700, 6.4474]
            },
            images: ['/api/placeholder/400/300'],
            amenities: {
              bedrooms: 4,
              bathrooms: 3,
              parkingSpaces: 3,
              hasGarden: true,
              hasPool: true,
              hasSecurity: true,
              hasGenerator: true,
              hasInternet: true,
              furnished: false
            },
            area: 200,
            yearBuilt: 2019,
            status: 'active',
            agent: {
              id: 'agent-2',
              name: 'Jane Smith',
              email: 'jane@horohouse.com',
              phone: '+234 802 345 6789'
            },
            createdAt: '2024-01-10T14:00:00Z'
          },
          {
            id: '507f1f77bcf86cd799439013',
            title: 'Cozy 2BR Duplex in Ikeja',
            description: 'Perfect starter home with modern amenities.',
            price: 1800000,
            currency: 'NGN',
            type: 'rent',
            propertyType: 'Duplex',
            location: {
              address: '789 Allen Avenue, Ikeja',
              city: 'Lagos',
              state: 'Lagos',
              coordinates: [3.3792, 6.5964]
            },
            images: ['/api/placeholder/400/300'],
            amenities: {
              bedrooms: 2,
              bathrooms: 2,
              parkingSpaces: 1,
              hasGarden: false,
              hasPool: false,
              hasGym: false,
              hasSecurity: true,
              hasGenerator: true,
              hasInternet: true,
              furnished: true
            },
            area: 85,
            yearBuilt: 2018,
            status: 'active',
            agent: {
              id: 'agent-1',
              name: 'John Doe',
              email: 'john@horohouse.com',
              phone: '+234 801 234 5678'
            },
            createdAt: '2024-01-05T11:30:00Z'
          }
        ];

        setAvailableProperties(mockProperties);
        setFilteredProperties(mockProperties);

        // Load properties from URL params if provided
        const propertyIds = searchParams.get('properties')?.split(',') || [];
        const preSelectedProperties = mockProperties.filter(p => propertyIds.includes(p.id));
        setSelectedProperties(preSelectedProperties.slice(0, MAX_PROPERTIES));

      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams]);

  useEffect(() => {
    const filtered = availableProperties.filter(property =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.propertyType.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProperties(filtered);
  }, [availableProperties, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      // Load saved comparisons
      const saved = localStorage.getItem('saved-comparisons');
      if (saved) {
        try {
          setSavedComparisons(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading saved comparisons:', error);
        }
      }
    }
  }, [isAuthenticated]);

  const addProperty = (property: Property) => {
    if (selectedProperties.length < MAX_PROPERTIES && !selectedProperties.find(p => p.id === property.id)) {
      setSelectedProperties(prev => [...prev, property]);
    }
  };

  const removeProperty = (propertyId: string) => {
    setSelectedProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  const saveComparison = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!comparisonName.trim() || selectedProperties.length === 0) return;

    setIsSaving(true);
    try {
      const newComparison: ComparisonSave = {
        id: Date.now().toString(),
        name: comparisonName.trim(),
        propertyIds: selectedProperties.map(p => p.id),
        createdAt: new Date().toISOString()
      };

      const updatedComparisons = [...savedComparisons, newComparison];
      setSavedComparisons(updatedComparisons);
      localStorage.setItem('saved-comparisons', JSON.stringify(updatedComparisons));
      
      setComparisonName('');
      // Show success message
    } catch (error) {
      console.error('Error saving comparison:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const shareComparison = () => {
    const propertyIds = selectedProperties.map(p => p.id).join(',');
    const shareUrl = `${window.location.origin}/properties/compare?properties=${propertyIds}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Property Comparison - HoroHouse',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      // Show copied message
    }
  };

  const getComparisonValue = (property: Property, field: string): string | number | boolean => {
    switch (field) {
      case 'price':
        return `${property.currency === 'NGN' ? '₦' : '$'}${property.price.toLocaleString()}`;
      case 'location':
        return `${property.location.city}, ${property.location.state}`;
      case 'bedrooms':
        return property.amenities.bedrooms || 'N/A';
      case 'bathrooms':
        return property.amenities.bathrooms || 'N/A';
      case 'parking':
        return property.amenities.parkingSpaces || 'N/A';
      case 'area':
        return property.area ? `${property.area} sqm` : 'N/A';
      case 'yearBuilt':
        return property.yearBuilt || 'N/A';
      case 'type':
        return property.type === 'rent' ? 'For Rent' : 'For Sale';
      case 'propertyType':
        return property.propertyType;
      default:
        return 'N/A';
    }
  };

  const comparisonFields = [
    { key: 'price', label: 'Price', icon: DollarSign },
    { key: 'type', label: 'Listing Type', icon: Home },
    { key: 'propertyType', label: 'Property Type', icon: Home },
    { key: 'location', label: 'Location', icon: MapPin },
    { key: 'bedrooms', label: 'Bedrooms', icon: Bed },
    { key: 'bathrooms', label: 'Bathrooms', icon: Bath },
    { key: 'parking', label: 'Parking', icon: Car },
    { key: 'area', label: 'Floor Area', icon: Ruler },
    { key: 'yearBuilt', label: 'Year Built', icon: Calendar }
  ];

  const amenityFields = [
    { key: 'hasPool', label: 'Swimming Pool' },
    { key: 'hasGym', label: 'Gym' },
    { key: 'hasSecurity', label: 'Security' },
    { key: 'hasElevator', label: 'Elevator' },
    { key: 'hasBalcony', label: 'Balcony' },
    { key: 'hasAirConditioning', label: 'Air Conditioning' },
    { key: 'hasInternet', label: 'Internet' },
    { key: 'hasGenerator', label: 'Generator' },
    { key: 'hasGarden', label: 'Garden' },
    { key: 'furnished', label: 'Furnished' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Compare Properties</h1>
                <p className="text-sm text-muted-foreground">
                  Compare up to {MAX_PROPERTIES} properties side by side
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedProperties.length > 0 && (
                <>
                  <Button variant="outline" onClick={shareComparison}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  {isAuthenticated && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Comparison name..."
                        value={comparisonName}
                        onChange={(e) => setComparisonName(e.target.value)}
                        className="w-40"
                      />
                      <Button 
                        onClick={saveComparison}
                        disabled={!comparisonName.trim() || isSaving}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Guest Notice */}
        {!isAuthenticated && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You can view property comparisons as a guest, but you'll need to{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/auth/login')}>
                log in
              </Button>{' '}
              to save comparisons for later.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Property Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search properties..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredProperties.map((property) => {
                      const isSelected = selectedProperties.find(p => p.id === property.id);
                      const canAdd = selectedProperties.length < MAX_PROPERTIES;
                      
                      return (
                        <div
                          key={property.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : canAdd 
                                ? 'hover:border-primary/50 hover:bg-muted/50' 
                                : 'opacity-50 cursor-not-allowed'
                          }`}
                          onClick={() => !isSelected && canAdd && addProperty(property)}
                        >
                          <div className="flex items-start gap-2">
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2">
                                {property.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {property.location.city}
                              </p>
                              <p className="text-xs font-medium text-primary">
                                {property.currency === 'NGN' ? '₦' : '$'}{property.price.toLocaleString()}
                              </p>
                            </div>
                            {isSelected && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeProperty(property.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    {selectedProperties.length} of {MAX_PROPERTIES} properties selected
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="lg:col-span-3">
            {selectedProperties.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Properties Selected</h3>
                  <p className="text-muted-foreground">
                    Select properties from the sidebar to start comparing them side by side.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Property Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {selectedProperties.map((property) => (
                    <Card key={property.id} className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => removeProperty(property.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {property.location.city}, {property.location.state}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-primary">
                            {property.currency === 'NGN' ? '₦' : '$'}{property.price.toLocaleString()}
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {property.type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Comparison Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Feature</th>
                            {selectedProperties.map((property) => (
                              <th key={property.id} className="text-left p-3 font-medium min-w-[200px]">
                                <div className="truncate">{property.title}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonFields.map((field) => {
                            const Icon = field.icon;
                            return (
                              <tr key={field.key} className="border-b hover:bg-muted/50">
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{field.label}</span>
                                  </div>
                                </td>
                                {selectedProperties.map((property) => (
                                  <td key={property.id} className="p-3">
                                    {getComparisonValue(property, field.key)}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Amenities Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Amenity</th>
                            {selectedProperties.map((property) => (
                              <th key={property.id} className="text-center p-3 font-medium min-w-[200px]">
                                <div className="truncate">{property.title}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {amenityFields.map((amenity) => (
                            <tr key={amenity.key} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{amenity.label}</td>
                              {selectedProperties.map((property) => (
                                <td key={property.id} className="p-3 text-center">
                                  {property.amenities[amenity.key as keyof typeof property.amenities] ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                      No
                                    </Badge>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Map Placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle>Location Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          MapLibre GL JS integration will show all selected properties on the map
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InquiriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading compare...</p>
        </div>
      }
    >
      <ComparePropertiesContent />
    </Suspense>
  );
}