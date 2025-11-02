"use client"

import { Home, Ruler, Calendar, Car, Shield, Zap, Wifi, TreePine, Waves, Dumbbell } from "lucide-react";

interface PropertyDetailsProps {
  property: {
    type: string;
    yearBuilt?: number;
    area?: number;
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
    availability: string;
    listingType: string;
    price: number;
  };
}

const PropertyDetails = ({ property }: PropertyDetailsProps) => {
  const amenities = property.amenities || {};
  
  const details = [
    { label: "Property Type", value: property.type, icon: Home },
    ...(property.yearBuilt ? [{ label: "Built in", value: property.yearBuilt.toString(), icon: Calendar }] : []),
    ...(property.area ? [{ label: "Area", value: `${property.area} sqm`, icon: Ruler }] : []),
    ...(amenities.parkingSpaces ? [{ label: "Parking", value: `${amenities.parkingSpaces} spaces`, icon: Car }] : []),
  ];

  const specs = [
    ...(amenities.bedrooms ? [{ label: "Bedrooms", value: amenities.bedrooms.toString() }] : []),
    ...(amenities.bathrooms ? [{ label: "Bathrooms", value: amenities.bathrooms.toString() }] : []),
    ...(property.area ? [{ label: "Square Meters", value: property.area.toString() }] : []),
    ...(property.area && property.price ? [{ label: "Price/sqm", value: `${Math.round(property.price / property.area).toLocaleString()} XAF` }] : []),
    { label: "Available", value: property.availability },
    ...(property.listingType === "rent" ? [{ label: "Lease Term", value: "12 months" }] : []),
  ];

  const additionalFeatures = [
    ...(amenities.hasInternet ? [{ name: "High-Speed Internet", icon: Wifi }] : []),
    ...(amenities.hasSecurity ? [{ name: "24/7 Security", icon: Shield }] : []),
    ...(amenities.hasAirConditioning ? [{ name: "Air Conditioning", icon: Zap }] : []),
    ...(amenities.hasGarden ? [{ name: "Garden", icon: TreePine }] : []),
    ...(amenities.hasPool ? [{ name: "Swimming Pool", icon: Waves }] : []),
    ...(amenities.hasGym ? [{ name: "Gym", icon: Dumbbell }] : []),
    ...(amenities.hasElevator ? [{ name: "Elevator" }] : []),
    ...(amenities.hasBalcony ? [{ name: "Balcony" }] : []),
    ...(amenities.hasGenerator ? [{ name: "Generator" }] : []),
    ...(amenities.furnished ? [{ name: "Furnished" }] : []),
  ];

  return (
    <section className="bg-card rounded-2xl p-6 space-y-6">
      <h2 className="text-2xl font-bold">Property Details</h2>
      
      {/* Key Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {details.map((detail) => {
          const Icon = detail.icon;
          return (
            <div key={detail.label} className="space-y-2">
              <Icon className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">{detail.label}</p>
              <p className="font-semibold">{detail.value}</p>
            </div>
          );
        })}
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border">
        {specs.map((spec) => (
          <div key={spec.label} className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">{spec.label}</span>
            <span className="font-semibold">{spec.value}</span>
          </div>
        ))}
      </div>

      {/* Additional Features */}
      {additionalFeatures.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold mb-3">Additional Features</h3>
          <div className="flex flex-wrap gap-2">
            {additionalFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <span key={feature.name} className="px-3 py-1.5 bg-secondary rounded-lg text-sm font-medium flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4" />}
                  {feature.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default PropertyDetails;
