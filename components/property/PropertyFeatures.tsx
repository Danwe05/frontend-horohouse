'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Bed, 
  Bath, 
  Car, 
  Trees, 
  Waves, 
  Dumbbell, 
  Shield, 
  ArrowUpDown, 
  Building2,
  AirVent,
  Wifi,
  Zap,
  Sofa
} from 'lucide-react';

export interface PropertyAmenities {
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

export interface PropertyFeaturesProps {
  amenities: PropertyAmenities;
  area?: number;
  yearBuilt?: number;
  nearbyAmenities?: string[];
  transportAccess?: string[];
  className?: string;
}

const amenityIcons = {
  hasGarden: Trees,
  hasPool: Waves,
  hasGym: Dumbbell,
  hasSecurity: Shield,
  hasElevator: ArrowUpDown,
  hasBalcony: Building2,
  hasAirConditioning: AirVent,
  hasInternet: Wifi,
  hasGenerator: Zap,
  furnished: Sofa,
};

const amenityLabels = {
  hasGarden: 'Garden',
  hasPool: 'Swimming Pool',
  hasGym: 'Gym/Fitness Center',
  hasSecurity: '24/7 Security',
  hasElevator: 'Elevator',
  hasBalcony: 'Balcony',
  hasAirConditioning: 'Air Conditioning',
  hasInternet: 'Internet/WiFi',
  hasGenerator: 'Generator',
  furnished: 'Furnished',
};

export function PropertyFeatures({ 
  amenities, 
  area, 
  yearBuilt, 
  nearbyAmenities = [], 
  transportAccess = [],
  className 
}: PropertyFeaturesProps) {
  const basicFeatures = [
    {
      icon: Bed,
      label: 'Bedrooms',
      value: amenities.bedrooms || 0,
      show: (amenities.bedrooms ?? 0) > 0
    },
    {
      icon: Bath,
      label: 'Bathrooms',
      value: amenities.bathrooms || 0,
      show: (amenities.bathrooms ?? 0) > 0
    },
    {
      icon: Car,
      label: 'Parking',
      value: amenities.parkingSpaces || 0,
      show: (amenities.parkingSpaces ?? 0) > 0
    }
  ];

  const booleanAmenities = Object.entries(amenityIcons).filter(
    ([key]) => amenities[key as keyof PropertyAmenities] === true
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Property Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Features */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3">Basic Features</h4>
          <div className="grid grid-cols-3 gap-4">
            {basicFeatures.filter(feature => feature.show).map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {feature.value} {feature.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Property Details */}
        {(area || yearBuilt) && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Property Details</h4>
              <div className="grid grid-cols-2 gap-4">
                {area && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Area:</span>
                    <span className="ml-2 font-medium">{area} m²</span>
                  </div>
                )}
                {yearBuilt && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Year Built:</span>
                    <span className="ml-2 font-medium">{yearBuilt}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Amenities */}
        {booleanAmenities.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Amenities</h4>
              <div className="grid grid-cols-2 gap-2">
                {booleanAmenities.map(([key, IconComponent]) => (
                  <div key={key} className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{amenityLabels[key as keyof typeof amenityLabels]}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Nearby Amenities */}
        {nearbyAmenities.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Nearby Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {nearbyAmenities.map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Transport Access */}
        {transportAccess.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Transport Access</h4>
              <div className="flex flex-wrap gap-2">
                {transportAccess.map((transport, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {transport}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PropertyFeatures;
