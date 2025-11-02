"use client"

import { GraduationCap, ShoppingBag, Train, Coffee, Dumbbell, Trees, MapPin } from "lucide-react";
import MapView from "../MapView";
import { Progress } from "@/components/ui/progress";

interface NeighborhoodProps {
  property: {
    city: string;
    neighborhood?: string;
    nearbyAmenities: string[];
    transportAccess: string[];
    // optional coordinates for showing location on a map
    latitude?: number;
    longitude?: number;
  };
}

const Neighborhood = ({ property }: NeighborhoodProps) => {
  // Mock data - in a real app, this would come from an API
  const walkScore = 75;
  const transitScore = 68;
  const bikeScore = 62;

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('market') || lower.includes('grocery') || lower.includes('shop')) return ShoppingBag;
    if (lower.includes('station') || lower.includes('metro') || lower.includes('train')) return Train;
    if (lower.includes('coffee') || lower.includes('cafe')) return Coffee;
    if (lower.includes('gym') || lower.includes('fitness')) return Dumbbell;
    if (lower.includes('park') || lower.includes('garden')) return Trees;
    return MapPin;
  };

  return (
    <section className="bg-card rounded-2xl p-6 space-y-8">
      <h2 className="text-2xl font-bold">Neighborhood</h2>

      {/* Walk Score */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Walk Score®</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Walk Score</span>
              <span className="font-bold text-lg">{walkScore}</span>
            </div>
            <Progress value={walkScore} className="h-2" />
            <p className="text-xs text-muted-foreground">Very Walkable</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transit Score</span>
              <span className="font-bold text-lg">{transitScore}</span>
            </div>
            <Progress value={transitScore} className="h-2" />
            <p className="text-xs text-muted-foreground">Excellent Transit</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bike Score</span>
              <span className="font-bold text-lg">{bikeScore}</span>
            </div>
            <Progress value={bikeScore} className="h-2" />
            <p className="text-xs text-muted-foreground">Bikeable</p>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Location</h3>
        </div>
        <div className="">
          {property.neighborhood && (
            <p className="text-sm text-muted-foreground mt-1">{property.neighborhood}</p>
          )}

          {/* Location map */}
          {property.latitude !== undefined && property.longitude !== undefined ? (
            <div className="mt-3 h-[300px] rounded-md overflow-hidden">
              <MapView
                // no properties clustering needed here; just show a selected marker
                selectedLocation={{ lng: property.longitude, lat: property.latitude }}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Location map unavailable</p>
          )}
        </div>
      </div>

      {/* Nearby Amenities */}
      {property.nearbyAmenities.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-semibold text-lg">Nearby Amenities</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {property.nearbyAmenities.map((amenity, index) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{amenity}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transport Access */}
      {property.transportAccess.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Train className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Transport Access</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {property.transportAccess.map((transport, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Train className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{transport}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Neighborhood;
