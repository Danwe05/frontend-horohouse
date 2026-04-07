"use client";

import { useMemo } from "react";
import {
  Ruler, Calendar, Car, Shield, Zap, Wifi,
  TreePine, Waves, Dumbbell, Check, Home
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const amenities = property.amenities ?? {};
  const { formatMoney } = useCurrency();
  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const specs = useMemo(() => [
    ...(amenities.bedrooms ? [{ label: pd?.bedrooms || "Bedrooms", value: amenities.bedrooms.toString() }] : []),
    ...(amenities.bathrooms ? [{ label: pd?.bathrooms || "Bathrooms", value: amenities.bathrooms.toString() }] : []),
    ...(property.area ? [{ label: pd?.squareMeters || "Area", value: `${property.area} sqm` }] : []),
    ...(property.area && property.price
      ? [{ label: pd?.pricePerSqm || "Price / sqm", value: formatMoney(Math.round(property.price / property.area)) }]
      : []),
    { label: pd?.available || "Available", value: property.availability },
    ...(property.listingType === "rent"
      ? [{ label: pd?.leaseTerm || "Lease term", value: pd?.twelveMonths || "12 months" }]
      : []),
  ], [amenities.bedrooms, amenities.bathrooms, property.area, property.price, property.availability, property.listingType, pd, formatMoney]);

  interface Feature { name: string; icon?: React.ElementType }
  
  const additionalFeatures: Feature[] = useMemo(() => [
    ...(amenities.hasInternet ? [{ name: pd?.highSpeedInternet || "Wifi", icon: Wifi }] : []),
    ...(amenities.hasSecurity ? [{ name: pd?.security || "Security", icon: Shield }] : []),
    ...(amenities.hasAirConditioning ? [{ name: pd?.airConditioning || "Air conditioning", icon: Zap }] : []),
    ...(amenities.hasGarden ? [{ name: pd?.garden || "Garden", icon: TreePine }] : []),
    ...(amenities.hasPool ? [{ name: pd?.swimmingPool || "Pool", icon: Waves }] : []),
    ...(amenities.hasGym ? [{ name: pd?.gym || "Gym", icon: Dumbbell }] : []),
    ...(amenities.hasElevator ? [{ name: pd?.elevator || "Elevator" }] : []),
    ...(amenities.hasBalcony ? [{ name: pd?.balcony || "Balcony" }] : []),
    ...(amenities.hasGenerator ? [{ name: pd?.generator || "Generator" }] : []),
    ...(amenities.furnished ? [{ name: pd?.furnished || "Furnished" }] : []),
    ...(amenities.parkingSpaces ? [{ name: pd?.parkingSpaces?.replace("{count}", amenities.parkingSpaces.toString()) || `${amenities.parkingSpaces} parking space${amenities.parkingSpaces > 1 ? "s" : ""}`, icon: Car }] : []),
  ], [amenities, pd]);

  return (
    <section className="space-y-8 text-[#222222]">
      
      {/* Key Specifications */}
      {specs.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-[22px] font-semibold tracking-tight">
            {pd?.title || "Property details"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12">
            {specs.map((spec, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-4 border-b border-[#DDDDDD]"
              >
                <span className="text-[16px] text-[#222222]">{spec.label}</span>
                <span className="text-[16px] font-semibold text-[#222222]">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Features Grid */}
      {additionalFeatures.length > 0 && (
        <div className="pt-4 space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {pd?.additionalFeatures || "More about this property"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            {additionalFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="flex items-center gap-4 text-[#222222]"
                >
                  {Icon ? (
                    <Icon className="h-6 w-6 stroke-[1.5]" aria-hidden />
                  ) : (
                    <Check className="h-6 w-6 stroke-[1.5]" aria-hidden />
                  )}
                  <span className="text-[16px]">{feature.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default PropertyDetails;