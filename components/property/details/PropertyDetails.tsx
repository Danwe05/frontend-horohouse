"use client";

import { useMemo } from "react";
import {
  Ruler, Car, Shield, Zap, Wifi,
  TreePine, Waves, Dumbbell, Check, Home,
  LucideIcon
} from "lucide-react";
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

interface Feature { name: string; icon?: LucideIcon }

const PropertyDetails = ({ property }: PropertyDetailsProps) => {
  const amenities = property.amenities ?? {};
  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const additionalFeatures: Feature[] = useMemo(() => [
    ...(amenities.hasInternet ? [{ name: pd?.highSpeedInternet || "High-speed wifi", icon: Wifi }] : []),
    ...(amenities.hasSecurity ? [{ name: pd?.security || "Security system", icon: Shield }] : []),
    ...(amenities.hasAirConditioning ? [{ name: pd?.airConditioning || "Air conditioning", icon: Zap }] : []),
    ...(amenities.hasGarden ? [{ name: pd?.garden || "Garden", icon: TreePine }] : []),
    ...(amenities.hasPool ? [{ name: pd?.swimmingPool || "Swimming pool", icon: Waves }] : []),
    ...(amenities.hasGym ? [{ name: pd?.gym || "Gym / fitness centre", icon: Dumbbell }] : []),
    ...(amenities.hasElevator ? [{ name: pd?.elevator || "Elevator", icon: Home }] : []),
    ...(amenities.hasBalcony ? [{ name: pd?.balcony || "Balcony", icon: Ruler }] : []),
    ...(amenities.hasGenerator ? [{ name: pd?.generator || "Backup generator", icon: Zap }] : []),
    ...(amenities.furnished ? [{ name: pd?.furnished || "Fully furnished" }] : []),
    ...(amenities.parkingSpaces
      ? [{ name: pd?.parkingSpaces?.replace("{count}", amenities.parkingSpaces.toString()) || `${amenities.parkingSpaces} parking space${amenities.parkingSpaces > 1 ? "s" : ""}`, icon: Car }]
      : []),
  ], [amenities, pd]);

  if (additionalFeatures.length === 0) return null;

  return (
    <section className="space-y-6 text-[#222222]">
      <h2 className="text-[22px] font-semibold tracking-tight">
        {pd?.additionalFeatures || "More about this property"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
        {additionalFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.name} className="flex items-center gap-4 text-[#222222]">
              {Icon ? (
                <Icon className="h-6 w-6 stroke-[1.5] shrink-0" aria-hidden />
              ) : (
                <Check className="h-6 w-6 stroke-[1.5] shrink-0" aria-hidden />
              )}
              <span className="text-[16px]">{feature.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PropertyDetails;