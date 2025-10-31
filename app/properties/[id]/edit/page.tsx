'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Save, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Home
} from 'lucide-react';

interface PropertyFormData {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  type: 'rent' | 'sale';
  address: string;
  city: string;
  state: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  area?: number;
  yearBuilt?: number;
  amenities: {
    hasGarden: boolean;
    hasPool: boolean;
    hasGym: boolean;
    hasSecurity: boolean;
    hasElevator: boolean;
    hasBalcony: boolean;
    hasAirConditioning: boolean;
    hasInternet: boolean;
    hasGenerator: boolean;
    furnished: boolean;
  };
  price: number;
  currency: string;
  status: 'active' | 'sold' | 'rented' | 'pending' | 'draft';
  agentId: string;
}

const PROPERTY_TYPES = [
  'Apartment', 'House', 'Villa', 'Duplex', 'Bungalow', 'Penthouse', 
  'Studio', 'Office', 'Shop', 'Warehouse', 'Land'
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', icon: CheckCircle, color: 'text-green-600' },
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  { value: 'sold', label: 'Sold', icon: Home, color: 'text-blue-600' },
  { value: 'rented', label: 'Rented', icon: Home, color: 'text-purple-600' },
  { value: 'draft', label: 'Draft', icon: AlertTriangle, color: 'text-gray-600' }
];

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/properties/${params.id}`);
        // const data = await response.json();
        
        // Mock data for now
        const mockProperty: PropertyFormData = {
          id: params.id as string,
          title: "Luxury 3BR Apartment in Victoria Island",
          description: "Beautiful modern apartment with stunning views of the Lagos lagoon.",
          propertyType: "Apartment",
          type: "rent",
          address: "123 Ahmadu Bello Way, Victoria Island",
          city: "Lagos",
          state: "Lagos",
          bedrooms: 3,
          bathrooms: 2,
          parkingSpaces: 2,
          area: 120,
          yearBuilt: 2020,
          amenities: {
            hasGarden: false,
            hasPool: true,
            hasGym: true,
            hasSecurity: true,
            hasElevator: true,
            hasBalcony: true,
            hasAirConditioning: true,
            hasInternet: true,
            hasGenerator: false,
            furnished: true
          },
          price: 2500000,
          currency: "NGN",
          status: "active",
          agentId: "agent-1"
        };

        // Check permissions
        const canEdit = user?.role === 'admin' || (user?.role === 'agent' && mockProperty.agentId === user?.id);
        
        if (!canEdit) {
          router.push('/properties');
          return;
        }

        setFormData(mockProperty);
      } catch (error) {
        console.error('Error fetching property:', error);
        router.push('/properties');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id && user) {
      fetchProperty();
    }
  }, [params.id, user, router]);

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    if (!formData) return;
    
    setFormData(prev => ({ ...prev!, ...updates }));
    setHasChanges(true);
    
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(updates).forEach(key => {
        delete newErrors[key];
      });
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!formData || !validateForm()) return;

    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      console.log('Updating property:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      
      // Show success message or redirect
      router.push(`/properties/${formData.id}`);
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateFormData({ status: newStatus as PropertyFormData['status'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
          <p className="text-muted-foreground mb-4">The property you're trying to edit doesn't exist.</p>
          <Button onClick={() => router.push('/properties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(option => option.value === formData.status);
  const StatusIcon = currentStatus?.icon || AlertTriangle;

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
                <h1 className="text-xl font-bold">Edit Property</h1>
                <p className="text-sm text-muted-foreground">
                  Property ID: {formData.id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <StatusIcon className={`h-4 w-4 ${currentStatus?.color}`} />
                <span className="capitalize">{formData.status}</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Button 
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Don't forget to save your changes before leaving this page.
              </AlertDescription>
            </Alert>
          )}

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Property Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.status === option.value;
                  
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusChange(option.value)}
                      className="justify-start"
                    >
                      <Icon className={`h-4 w-4 mr-2 ${isSelected ? '' : option.color}`} />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => updateFormData({ propertyType: value })}>
                    <SelectTrigger className={errors.propertyType ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyType && <p className="text-sm text-red-500 mt-1">{errors.propertyType}</p>}
                </div>

                <div>
                  <Label htmlFor="type">Listing Type</Label>
                  <Select value={formData.type} onValueChange={(value: 'rent' | 'sale') => updateFormData({ type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="sale">For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData({ address: e.target.value })}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData({ city: e.target.value })}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => updateFormData({ state: value })}>
                    <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms || ''}
                    onChange={(e) => updateFormData({ bedrooms: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms || ''}
                    onChange={(e) => updateFormData({ bathrooms: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="parking">Parking Spaces</Label>
                  <Input
                    id="parking"
                    type="number"
                    min="0"
                    value={formData.parkingSpaces || ''}
                    onChange={(e) => updateFormData({ parkingSpaces: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="area">Floor Area (sqm)</Label>
                  <Input
                    id="area"
                    type="number"
                    min="0"
                    value={formData.area || ''}
                    onChange={(e) => updateFormData({ area: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.yearBuilt || ''}
                  onChange={(e) => updateFormData({ yearBuilt: parseInt(e.target.value) || undefined })}
                />
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold">Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {Object.entries(formData.amenities).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => 
                          updateFormData({
                            amenities: { ...formData.amenities, [key]: checked as boolean }
                          })
                        }
                      />
                      <Label htmlFor={key} className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price */}
          <Card>
            <CardHeader>
              <CardTitle>Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price || ''}
                    onChange={(e) => updateFormData({ price: parseInt(e.target.value) || 0 })}
                    className={errors.price ? 'border-red-500' : ''}
                  />
                  {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => updateFormData({ currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Price Preview</h4>
                <p className="text-2xl font-bold text-primary">
                  {formData.currency === 'NGN' ? '₦' : '$'}{formData.price.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.type === 'rent' ? 'per year' : 'total price'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
