import { useMemo } from "react";
import {
  Home, Ruler, Calendar, Car, Shield, Zap, Wifi,
  TreePine, Waves, Dumbbell, Check,
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

  const details = useMemo(() => [
    { label: pd?.propertyType || "Property Type", value: property.type, icon: Home },
    ...(property.yearBuilt
      ? [{ label: pd?.builtIn || "Built in", value: property.yearBuilt.toString(), icon: Calendar }]
      : []),
    ...(property.area
      ? [{ label: pd?.area || "Area", value: `${property.area} sqm`, icon: Ruler }]
      : []),
    ...(amenities.parkingSpaces
      ? [{ label: pd?.parking || "Parking", value: pd?.parkingSpaces?.replace("{count}", amenities.parkingSpaces.toString()) || `${amenities.parkingSpaces} space${amenities.parkingSpaces > 1 ? "s" : ""}`, icon: Car }]
      : []),
  ], [property.type, property.yearBuilt, property.area, amenities.parkingSpaces, pd]);

  const specs = useMemo(() => [
    ...(amenities.bedrooms ? [{ label: "Bedrooms", value: amenities.bedrooms.toString() }] : []),
    ...(amenities.bathrooms ? [{ label: "Bathrooms", value: amenities.bathrooms.toString() }] : []),
    ...(property.area ? [{ label: pd?.squareMeters || "Square Meters", value: property.area.toString() }] : []),
    ...(property.area && property.price
      ? [{ label: pd?.pricePerSqm || "Price / sqm", value: formatMoney(Math.round(property.price / property.area)) }]
      : []),
    { label: pd?.available || "Available", value: property.availability },
    ...(property.listingType === "rent"
      ? [{ label: pd?.leaseTerm || "Lease Term", value: pd?.twelveMonths || "12 months" }]
      : []),
  ], [amenities.bedrooms, amenities.bathrooms, property.area, property.price, property.availability, property.listingType, pd, formatMoney]);

  interface Feature { name: string; icon?: React.ElementType }
  const additionalFeatures: Feature[] = useMemo(() => [
    ...(amenities.hasInternet ? [{ name: pd?.highSpeedInternet || "High-Speed Internet", icon: Wifi }] : []),
    ...(amenities.hasSecurity ? [{ name: pd?.security || "24/7 Security", icon: Shield }] : []),
    ...(amenities.hasAirConditioning ? [{ name: pd?.airConditioning || "Air Conditioning", icon: Zap }] : []),
    ...(amenities.hasGarden ? [{ name: pd?.garden || "Garden", icon: TreePine }] : []),
    ...(amenities.hasPool ? [{ name: pd?.swimmingPool || "Swimming Pool", icon: Waves }] : []),
    ...(amenities.hasGym ? [{ name: pd?.gym || "Gym", icon: Dumbbell }] : []),
    ...(amenities.hasElevator ? [{ name: pd?.elevator || "Elevator" }] : []),
    ...(amenities.hasBalcony ? [{ name: pd?.balcony || "Balcony" }] : []),
    ...(amenities.hasGenerator ? [{ name: pd?.generator || "Generator" }] : []),
    ...(amenities.furnished ? [{ name: pd?.furnished || "Furnished" }] : []),
  ], [amenities, pd]);

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 space-y-8 mt-10">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{pd?.title || "Property Details"}</h2>

      {/* Quick-glance tiles */}
      {details.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {details.map((detail, idx) => {
            const Icon = detail.icon;
            return (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                <Icon className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {detail.label}
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">{detail.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-px bg-slate-100 w-full" />

      {/* Key specifications */}
      {specs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase">
            {pd?.keySpecifications || "Key Specifications"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
            {specs.map((spec, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-3 border-b border-slate-100"
              >
                <span className="text-slate-500 font-medium">{spec.label}</span>
                <span className="font-bold text-slate-900 text-right">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional features */}
      {additionalFeatures.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase">
            {pd?.additionalFeatures || "Additional Features"}
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {additionalFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <span
                  key={feature.name}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2"
                >
                  {Icon ? (
                    <Icon className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
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