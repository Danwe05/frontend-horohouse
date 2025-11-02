'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Home, 
  DollarSign, 
  MapPin, 
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Dumbbell,
  Trees,
  ShoppingCart,
  GraduationCap,
  Stethoscope,
  Save,
  Check,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import apiClient from '@/lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: string;
  preferences?: UserPreferences;
}

interface UserPreferences {
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  cities?: string[];
  amenities?: string[];
  maxRadius?: number;
  preferredLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minArea?: number;
  maxArea?: number;
}

interface PreferencesSettingsProps {
  user: User;
}

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: <Home className="h-4 w-4" /> },
  { id: 'house', label: 'House', icon: <Home className="h-4 w-4" /> },
  { id: 'condo', label: 'Condo', icon: <Home className="h-4 w-4" /> },
  { id: 'villa', label: 'Villa', icon: <Home className="h-4 w-4" /> },
  { id: 'townhouse', label: 'Townhouse', icon: <Home className="h-4 w-4" /> },
  { id: 'studio', label: 'Studio', icon: <Home className="h-4 w-4" /> }
];

const AMENITIES = [
  { id: 'parking', label: 'Parking', icon: <Car className="h-4 w-4" /> },
  { id: 'wifi', label: 'WiFi', icon: <Wifi className="h-4 w-4" /> },
  { id: 'gym', label: 'Gym', icon: <Dumbbell className="h-4 w-4" /> },
  { id: 'pool', label: 'Swimming Pool', icon: <Trees className="h-4 w-4" /> },
  { id: 'garden', label: 'Garden', icon: <Trees className="h-4 w-4" /> },
  { id: 'balcony', label: 'Balcony', icon: <Home className="h-4 w-4" /> },
  { id: 'elevator', label: 'Elevator', icon: <Home className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <Home className="h-4 w-4" /> },
  { id: 'furnished', label: 'Furnished', icon: <Home className="h-4 w-4" /> },
  { id: 'air_conditioning', label: 'Air Conditioning', icon: <Home className="h-4 w-4" /> }
];

const NEARBY_AMENITIES = [
  { id: 'shopping', label: 'Shopping Centers', icon: <ShoppingCart className="h-4 w-4" /> },
  { id: 'schools', label: 'Schools', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'hospitals', label: 'Hospitals', icon: <Stethoscope className="h-4 w-4" /> },
  { id: 'parks', label: 'Parks', icon: <Trees className="h-4 w-4" /> },
  { id: 'restaurants', label: 'Restaurants', icon: <Home className="h-4 w-4" /> },
  { id: 'public_transport', label: 'Public Transport', icon: <Car className="h-4 w-4" /> }
];

export const PreferencesSettings: React.FC<PreferencesSettingsProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    minPrice: user.preferences?.minPrice || 0,
    maxPrice: user.preferences?.maxPrice || 1000000,
    propertyTypes: user.preferences?.propertyTypes || [],
    cities: user.preferences?.cities || [],
    amenities: user.preferences?.amenities || [],
    maxRadius: user.preferences?.maxRadius || 25,
    minBedrooms: user.preferences?.minBedrooms || 1,
    maxBedrooms: user.preferences?.maxBedrooms || 5,
    minBathrooms: user.preferences?.minBathrooms || 1,
    maxBathrooms: user.preferences?.maxBathrooms || 4,
    minArea: user.preferences?.minArea || 500,
    maxArea: user.preferences?.maxArea || 5000
  });

  const [newCity, setNewCity] = useState('');

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePropertyTypeToggle = (typeId: string) => {
    const currentTypes = preferences.propertyTypes || [];
    const newTypes = currentTypes.includes(typeId)
      ? currentTypes.filter(id => id !== typeId)
      : [...currentTypes, typeId];
    
    handlePreferenceChange('propertyTypes', newTypes);
  };

  const handleAmenityToggle = (amenityId: string) => {
    const currentAmenities = preferences.amenities || [];
    const newAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter(id => id !== amenityId)
      : [...currentAmenities, amenityId];
    
    handlePreferenceChange('amenities', newAmenities);
  };

  const handleAddCity = () => {
    if (newCity.trim() && !preferences.cities?.includes(newCity.trim())) {
      const newCities = [...(preferences.cities || []), newCity.trim()];
      handlePreferenceChange('cities', newCities);
      setNewCity('');
    }
  };

  const handleRemoveCity = (cityToRemove: string) => {
    const newCities = preferences.cities?.filter(city => city !== cityToRemove) || [];
    handlePreferenceChange('cities', newCities);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      await apiClient.updatePreferences(preferences);
      
      setMessage({ type: 'success', text: 'Preferences updated successfully' });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Search Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Property Search Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Range */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Price Range</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Minimum Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="minPrice"
                    type="number"
                    value={preferences.minPrice}
                    onChange={(e) => handlePreferenceChange('minPrice', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">{formatPrice(preferences.minPrice || 0)}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Maximum Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="maxPrice"
                    type="number"
                    value={preferences.maxPrice}
                    onChange={(e) => handlePreferenceChange('maxPrice', parseInt(e.target.value) || 1000000)}
                    placeholder="1000000"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">{formatPrice(preferences.maxPrice || 1000000)}</p>
              </div>
            </div>
          </div>

          {/* Property Types */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Preferred Property Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handlePropertyTypeToggle(type.id)}
                  className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors ${
                    preferences.propertyTypes?.includes(type.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type.icon}
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Bedrooms</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minBedrooms">Minimum</Label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="minBedrooms"
                      type="number"
                      min="0"
                      max="10"
                      value={preferences.minBedrooms}
                      onChange={(e) => handlePreferenceChange('minBedrooms', parseInt(e.target.value) || 1)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxBedrooms">Maximum</Label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="maxBedrooms"
                      type="number"
                      min="0"
                      max="10"
                      value={preferences.maxBedrooms}
                      onChange={(e) => handlePreferenceChange('maxBedrooms', parseInt(e.target.value) || 5)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Bathrooms</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minBathrooms">Minimum</Label>
                  <div className="relative">
                    <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="minBathrooms"
                      type="number"
                      min="0"
                      max="10"
                      value={preferences.minBathrooms}
                      onChange={(e) => handlePreferenceChange('minBathrooms', parseInt(e.target.value) || 1)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxBathrooms">Maximum</Label>
                  <div className="relative">
                    <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="maxBathrooms"
                      type="number"
                      min="0"
                      max="10"
                      value={preferences.maxBathrooms}
                      onChange={(e) => handlePreferenceChange('maxBathrooms', parseInt(e.target.value) || 4)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Area Range */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Area Range (sq ft)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minArea">Minimum Area</Label>
                <div className="relative">
                  <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="minArea"
                    type="number"
                    value={preferences.minArea}
                    onChange={(e) => handlePreferenceChange('minArea', parseInt(e.target.value) || 500)}
                    placeholder="500"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxArea">Maximum Area</Label>
                <div className="relative">
                  <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="maxArea"
                    type="number"
                    value={preferences.maxArea}
                    onChange={(e) => handlePreferenceChange('maxArea', parseInt(e.target.value) || 5000)}
                    placeholder="5000"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preferred Cities */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Preferred Cities</Label>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Add a city..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCity()}
                />
                <Button
                  type="button"
                  onClick={handleAddCity}
                  disabled={!newCity.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {preferences.cities && preferences.cities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preferences.cities.map((city) => (
                    <Badge
                      key={city}
                      variant="secondary"
                      className="flex items-center space-x-1 px-3 py-1"
                    >
                      <span>{city}</span>
                      <button
                        onClick={() => handleRemoveCity(city)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Radius */}
          <div>
            <Label htmlFor="maxRadius" className="text-sm font-medium text-gray-700 mb-3 block">
              Maximum Search Radius: {preferences.maxRadius} km
            </Label>
            <input
              type="range"
              id="maxRadius"
              min="5"
              max="100"
              step="5"
              value={preferences.maxRadius}
              onChange={(e) => handlePreferenceChange('maxRadius', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Preferred Amenities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Property Amenities */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Property Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES.map((amenity) => (
                  <button
                    key={amenity.id}
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors ${
                      preferences.amenities?.includes(amenity.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {amenity.icon}
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nearby Amenities */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Nearby Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {NEARBY_AMENITIES.map((amenity) => (
                  <button
                    key={amenity.id}
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors ${
                      preferences.amenities?.includes(amenity.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {amenity.icon}
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};