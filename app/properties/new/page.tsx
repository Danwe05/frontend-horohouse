'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  X, 
  Plus, 
  MapPin, 
  Home, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  AlertCircle,
  Loader2,
  ImageIcon,
  Video
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { createPropertyWithMedia } from '@/lib/services/propertyCreateWithMedia';

// Enums matching your schema
const PROPERTY_TYPES = [
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
];

const LISTING_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' }
];

interface PropertyFormData {
  title: string;
  price: string;
  type: string; // Changed from propertyType to match schema
  listingType: string;
  description: string;
  city: string;
  address: string; // Changed to string to match schema
  neighborhood: string;
  country: string;
  latitude: string;
  longitude: string;
  area: string;
  yearBuilt: string;
  floorNumber: string;
  totalFloors: string;
  pricePerSqm: string;
  depositAmount: string;
  maintenanceFee: string;
  contactPhone: string;
  contactEmail: string;
  keywords: string[];
  nearbyAmenities: string[];
  transportAccess: string[];
  virtualTourUrl: string;
  videoUrl: string;
  // Amenities matching your schema interface
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
  images: File[];
  videos?: File[];
}

const AMENITIES_OPTIONS = [
  { key: 'hasGarden', label: 'Garden' },
  { key: 'hasPool', label: 'Swimming Pool' },
  { key: 'hasGym', label: 'Gym/Fitness Center' },
  { key: 'hasSecurity', label: '24/7 Security' },
  { key: 'hasElevator', label: 'Elevator' },
  { key: 'hasBalcony', label: 'Balcony' },
  { key: 'hasAirConditioning', label: 'Air Conditioning' },
  { key: 'hasInternet', label: 'Internet/WiFi' },
  { key: 'hasGenerator', label: 'Generator' },
  { key: 'furnished', label: 'Furnished' }
];

const NEARBY_AMENITIES = [
  'Schools', 'Hospitals', 'Shopping Malls', 'Restaurants', 
  'Parks', 'Banks', 'Pharmacies', 'Gas Stations', 'Markets', 
  'Churches', 'Mosques', 'Government Offices'
];

const TRANSPORT_ACCESS = [
  'Bus Stop', 'Taxi Station', 'Train Station', 'Airport', 
  'Highway Access', 'Metro Station', 'Ferry Terminal'
];

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    price: '',
    type: '',
    listingType: '',
    description: '',
    city: '',
    address: '',
    neighborhood: '',
    country: '',
    latitude: '',
    longitude: '',
    area: '',
    yearBuilt: '',
    floorNumber: '',
    totalFloors: '',
    pricePerSqm: '',
    depositAmount: '',
    maintenanceFee: '',
    contactPhone: '',
    contactEmail: '',
    keywords: [],
    nearbyAmenities: [],
    transportAccess: [],
    virtualTourUrl: '',
    videoUrl: '',
    amenities: {},
    images: [],
    videos: []
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  // Geocoding function to convert address to coordinates
  const geocodeAddress = async (address: string, city: string, country: string) => {
    try {
      setGeocoding(true);
      const fullAddress = `${address}, ${city}, ${country}`;
      
      // Using a free geocoding service (you can replace with your preferred service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }));
        return { lat: parseFloat(lat), lon: parseFloat(lon) };
      } else {
        throw new Error('Address not found');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Could not find coordinates for the provided address. Please enter coordinates manually.');
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityChange = (key: string, value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [key]: value
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageUploading(true);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    // Add files to form data
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));

    setImageUploading(false);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Basic preview via object URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setVideoPreviews(prev => [...prev, ...newPreviews]);

    setFormData(prev => ({
      ...prev,
      videos: [...(prev.videos || []), ...files]
    }));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
    }
    setNewKeyword('');
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const toggleArrayItem = (array: string[], item: string, field: 'nearbyAmenities' | 'transportAccess') => {
    const newArray = array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
    
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Property title is required');
      return false;
    }
    if (!formData.type) {
      setError('Property type is required');
      return false;
    }
    if (!formData.listingType) {
      setError('Listing type is required');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Location coordinates are required. Please use the geocoding button or enter manually.');
      return false;
    }

    return true;
  };

  const handleGeocoding = async () => {
    if (!formData.address || !formData.city || !formData.country) {
      setError('Please fill in address, city, and country before geocoding');
      return;
    }

    await geocodeAddress(formData.address, formData.city, formData.country);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare the property data matching your schema exactly
      const propertyData = {
        title: formData.title.trim(),
        price: parseFloat(formData.price),
        type: formData.type, // This matches your schema
        listingType: formData.listingType,
        description: formData.description.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(), // String as per schema
        neighborhood: formData.neighborhood.trim() || undefined,
        country: formData.country.trim() || undefined,
        
        // Required location field matching your schema
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)] // [lng, lat]
        },
        
        // Optional coordinates (your schema has both)
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        
        // Optional numeric fields
        area: formData.area ? parseFloat(formData.area) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : undefined,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
        pricePerSqm: formData.pricePerSqm ? parseFloat(formData.pricePerSqm) : undefined,
        depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : undefined,
        maintenanceFee: formData.maintenanceFee ? parseFloat(formData.maintenanceFee) : undefined,
        
        // Contact info
        contactPhone: formData.contactPhone.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        
        // Arrays
        keywords: formData.keywords,
        nearbyAmenities: formData.nearbyAmenities,
        transportAccess: formData.transportAccess,
        
        // Media
        virtualTourUrl: formData.virtualTourUrl.trim() || undefined,
        videoUrl: formData.videoUrl.trim() || undefined,
        
        // Amenities object matching your schema interface
        amenities: formData.amenities,
        
        // Images - you'll need to handle file uploads separately
        images: [] // Handle image uploads in a separate request
      };

      console.log('Submitting property data:', propertyData);

      // Create property then upload media
      const created = await createPropertyWithMedia(
        propertyData as any,
        formData.images,
        formData.videos || []
      );

      setSuccess('Property created successfully!');
      router.push(`/properties/${created.id || created._id}`);
      
    } catch (err: any) {
      console.error('Property creation error:', err);
      setError(err.response?.data?.message || 'Failed to create property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Property Listing</h1>
        <p className="text-gray-600">Fill in the details below to create your property listing</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Basic Property Information
                </CardTitle>
                <CardDescription>
                  Enter the basic details about your property
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Modern 3BR Apartment in City Center"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your property in detail..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Property Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="listingType">Listing Type *</Label>
                    <Select
                      value={formData.listingType}
                      onValueChange={(value) => handleInputChange('listingType', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LISTING_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>
                  Provide specific details about your property
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Measurements */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.amenities.bedrooms || ''}
                      onChange={(e) => handleAmenityChange('bedrooms', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.amenities.bathrooms || ''}
                      onChange={(e) => handleAmenityChange('bathrooms', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parkingSpaces">Parking Spaces</Label>
                    <Input
                      id="parkingSpaces"
                      type="number"
                      value={formData.amenities.parkingSpaces || ''}
                      onChange={(e) => handleAmenityChange('parkingSpaces', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="area">Area (sqm)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Building Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                      placeholder="e.g., 2020"
                      min="1800"
                      max={new Date().getFullYear() + 5}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="floorNumber">Floor Number</Label>
                    <Input
                      id="floorNumber"
                      type="number"
                      value={formData.floorNumber}
                      onChange={(e) => handleInputChange('floorNumber', e.target.value)}
                      placeholder="e.g., 5"
                      min="0"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="totalFloors">Total Floors</Label>
                    <Input
                      id="totalFloors"
                      type="number"
                      value={formData.totalFloors}
                      onChange={(e) => handleInputChange('totalFloors', e.target.value)}
                      placeholder="e.g., 10"
                      min="1"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Pricing Details */}
                <Separator />
                <h4 className="font-medium">Pricing Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pricePerSqm">Price per Sqm</Label>
                    <Input
                      id="pricePerSqm"
                      type="number"
                      value={formData.pricePerSqm}
                      onChange={(e) => handleInputChange('pricePerSqm', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                  </div>

                  {formData.listingType === 'rent' && (
                    <>
                      <div>
                        <Label htmlFor="depositAmount">Deposit Amount</Label>
                        <Input
                          id="depositAmount"
                          type="number"
                          value={formData.depositAmount}
                          onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maintenanceFee">Monthly Maintenance</Label>
                        <Input
                          id="maintenanceFee"
                          type="number"
                          value={formData.maintenanceFee}
                          onChange={(e) => handleInputChange('maintenanceFee', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Property Amenities */}
                <Separator />
                <h4 className="font-medium">Property Amenities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {AMENITIES_OPTIONS.map(amenity => (
                    <div key={amenity.key} className="flex items-center space-x-2">
                      <Switch
                        id={amenity.key}
                        checked={!!formData.amenities[amenity.key as keyof typeof formData.amenities]}
                        onCheckedChange={(checked) => handleAmenityChange(amenity.key, checked)}
                      />
                      <Label htmlFor={amenity.key} className="text-sm">{amenity.label}</Label>
                    </div>
                  ))}
                </div>

                {/* Media URLs */}
                <Separator />
                <h4 className="font-medium">Media Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="virtualTourUrl">Virtual Tour URL</Label>
                    <Input
                      id="virtualTourUrl"
                      type="url"
                      value={formData.virtualTourUrl}
                      onChange={(e) => handleInputChange('virtualTourUrl', e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="videoUrl">Video URL</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Property Location
                </CardTitle>
                <CardDescription>
                  Enter the complete address and location details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Complete street address"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="neighborhood">Neighborhood</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      placeholder="Neighborhood/District"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Country"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Coordinates */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Location Coordinates *</h4>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGeocoding}
                      disabled={geocoding || !formData.address || !formData.city}
                      size="sm"
                    >
                      {geocoding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Getting Coordinates...
                        </>
                      ) : (
                        'Get Coordinates'
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude *</Label>
                      <Input
                        id="latitude"
                        type="number"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange('latitude', e.target.value)}
                        placeholder="e.g., 3.8480"
                        step="any"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="longitude">Longitude *</Label>
                      <Input
                        id="longitude"
                        type="number"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange('longitude', e.target.value)}
                        placeholder="e.g., 11.5021"
                        step="any"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle>Keywords</CardTitle>
                  <CardDescription>
                    Add keywords to help people find your property
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add keyword..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword(newKeyword);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addKeyword(newKeyword)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Selected Keywords</h5>
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map(keyword => (
                        <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nearby Amenities */}
              <Card>
                <CardHeader>
                  <CardTitle>Nearby Amenities</CardTitle>
                  <CardDescription>
                    Select nearby amenities and facilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {NEARBY_AMENITIES.map(amenity => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`nearby-${amenity}`}
                          checked={formData.nearbyAmenities.includes(amenity)}
                          onChange={() => toggleArrayItem(formData.nearbyAmenities, amenity, 'nearbyAmenities')}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`nearby-${amenity}`} className="text-sm">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transport Access */}
            <Card>
              <CardHeader>
                <CardTitle>Transport Access</CardTitle>
                <CardDescription>
                  Select available transportation options nearby
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {TRANSPORT_ACCESS.map(transport => (
                    <div key={transport} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`transport-${transport}`}
                        checked={formData.transportAccess.includes(transport)}
                        onChange={() => toggleArrayItem(formData.transportAccess, transport, 'transportAccess')}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`transport-${transport}`} className="text-sm">{transport}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Image Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Property Images
                </CardTitle>
                <CardDescription>
                  Upload photos of your property (max 10 images)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={imageUploading || formData.images.length >= 10}
                  />
                  <label
                    htmlFor="images"
                    className={`cursor-pointer ${
                      imageUploading || formData.images.length >= 10 ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {imageUploading ? 'Uploading...' : 'Upload Property Images'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.images.length >= 10 
                        ? 'Maximum 10 images allowed' 
                        : `Click to select images or drag and drop (${formData.images.length}/10)`
                      }
                    </p>
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Property Videos
                </CardTitle>
                <CardDescription>
                  Upload short clips or walkthroughs (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="videos"
                    multiple
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <label htmlFor="videos" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Upload Property Videos
                    </p>
                    <p className="text-sm text-gray-600">
                      Click to select videos or drag and drop
                    </p>
                  </label>
                </div>

                {videoPreviews.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoPreviews.map((preview, index) => (
                      <video key={index} src={preview} controls className="w-full rounded-lg" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Provide contact details for potential buyers/renters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="Phone number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="Email address"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <Card>
              <CardHeader>
                <CardTitle>Review and Submit</CardTitle>
                <CardDescription>
                  Review your property listing and submit for publication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Listing Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Title:</span> {formData.title || 'Not specified'}</div>
                    <div><span className="font-medium">Type:</span> {formData.type ? PROPERTY_TYPES.find(t => t.value === formData.type)?.label : 'Not specified'}</div>
                    <div><span className="font-medium">Listing:</span> {formData.listingType ? LISTING_TYPES.find(t => t.value === formData.listingType)?.label : 'Not specified'}</div>
                    <div><span className="font-medium">Price:</span> {formData.price ? `${formData.price}` : 'Not specified'}</div>
                    <div><span className="font-medium">Location:</span> {formData.city ? `${formData.city}${formData.country ? `, ${formData.country}` : ''}` : 'Not specified'}</div>
                    <div><span className="font-medium">Coordinates:</span> {formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : 'Not specified'}</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Property...
                      </>
                    ) : (
                      'Create Property Listing'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}