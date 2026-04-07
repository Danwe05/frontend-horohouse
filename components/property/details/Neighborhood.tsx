"use client";

import {
  GraduationCap, ShoppingBag, Train, Coffee, Dumbbell,
  Trees, MapPin, Utensils, Hospital, Landmark, Fuel,
  Hotel, Bus, Bike,
} from "lucide-react";
import MapView from "../MapView";
import { useLanguage } from "@/contexts/LanguageContext";

interface NeighborhoodProps {
  property: {
    city: string;
    neighborhood?: string;
    nearbyAmenities: string[];
    transportAccess: string[];
    latitude?: number;
    longitude?: number;
    walkScore?: number;
    transitScore?: number;
    bikeScore?: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AMENITY_ICON_MAP: [RegExp, React.ElementType][] = [
  [/market|grocery|supermarket|shop|mall/i, ShoppingBag],
  [/station|metro|train|rail|subway/i, Train],
  [/bus|tram/i, Bus],
  [/coffee|café|cafe/i, Coffee],
  [/gym|fitness|sport/i, Dumbbell],
  [/park|garden|forest|nature/i, Trees],
  [/school|university|college|education/i, GraduationCap],
  [/restaurant|food|dining|bistro/i, Utensils],
  [/hospital|clinic|pharmacy|health/i, Hospital],
  [/bank|atm|finance/i, Landmark],
  [/gas|fuel|petrol/i, Fuel],
  [/hotel|lodging/i, Hotel],
  [/bike|cycle/i, Bike],
];

const TRANSPORT_ICON_MAP: [RegExp, React.ElementType][] = [
  [/train|rail|metro|subway/i, Train],
  [/bus|tram|BRT/i, Bus],
  [/bike|cycle/i, Bike],
];

function getAmenityIcon(label: string): React.ElementType {
  for (const [pattern, Icon] of AMENITY_ICON_MAP) {
    if (pattern.test(label)) return Icon;
  }
  return MapPin;
}

function getTransportIcon(label: string): React.ElementType {
  for (const [pattern, Icon] of TRANSPORT_ICON_MAP) {
    if (pattern.test(label)) return Icon;
  }
  return Bus;
}

function getScoreDescription(score: number, type: "walk" | "transit" | "bike"): string {
  if (type === "walk") {
    if (score >= 90) return "Walker's Paradise";
    if (score >= 70) return "Very Walkable";
    if (score >= 50) return "Somewhat Walkable";
    if (score >= 25) return "Car-Dependent";
    return "Almost All Errands Require a Car";
  }
  if (type === "transit") {
    if (score >= 90) return "Rider's Paradise";
    if (score >= 70) return "Excellent Transit";
    if (score >= 50) return "Good Transit";
    if (score >= 25) return "Some Transit";
    return "Minimal Transit";
  }
  // bike
  if (score >= 90) return "Biker's Paradise";
  if (score >= 70) return "Very Bikeable";
  if (score >= 50) return "Bikeable";
  return "Minimal Bike Infrastructure";
}

// ─── Component ────────────────────────────────────────────────────────────────

const Neighborhood = ({ property }: NeighborhoodProps) => {
  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const walkScore = property.walkScore ?? 75;
  const transitScore = property.transitScore ?? 68;
  const bikeScore = property.bikeScore ?? 62;
  const scoresAreEstimated = !property.walkScore && !property.transitScore && !property.bikeScore;

  const scores: Array<{ type: "walk" | "transit" | "bike"; label: string; value: number }> = [
    { type: "walk", label: pd?.walkScore || "Walk Score", value: walkScore },
    { type: "transit", label: pd?.transitScore || "Transit Score", value: transitScore },
    { type: "bike", label: pd?.bikeScore || "Bike Score", value: bikeScore },
  ];

  return (
    <section className="space-y-8 text-[#222222]">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight mb-6">
          {pd?.location || "Where you’ll be"}
        </h2>
        <p className="text-[16px] text-[#222222] mb-6">
          {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}
        </p>

        {property.latitude !== undefined && property.longitude !== undefined ? (
          <div className="h-[400px] w-full rounded-2xl overflow-hidden bg-[#EBEBEB]">
            <MapView
              selectedLocation={{ lng: property.longitude, lat: property.latitude }}
            />
          </div>
        ) : (
          <div className="h-[400px] w-full rounded-2xl bg-[#F7F7F7] border border-[#DDDDDD] flex flex-col items-center justify-center gap-2">
            <MapPin className="h-8 w-8 text-[#717171] stroke-[1.5]" />
            <p className="text-[15px] font-medium text-[#717171]">{pd?.mapUnavailable || "Exact location provided after booking"}</p>
          </div>
        )}
      </div>

      <div className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[18px] font-semibold text-[#222222]">
            {pd?.livabilityScores || "Livability scores"}
          </h3>
          {scoresAreEstimated && (
            <span className="text-[14px] text-[#717171]">{pd?.estimated || "Estimated"}</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-12">
          {scores.map(({ type, label, value }) => (
            <div key={type} className="flex flex-col">
              <span className="text-[16px] font-semibold text-[#222222]">{value} / 100</span>
              <span className="text-[16px] text-[#222222] mt-0.5">{label}</span>
              <span className="text-[14px] text-[#717171] mt-0.5">
                {getScoreDescription(value, type)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {property.nearbyAmenities.length > 0 && (
        <div className="pt-8 border-t border-[#DDDDDD]">
          <h3 className="text-[18px] font-semibold text-[#222222] mb-6">
            {pd?.nearbyAmenities || "What's nearby"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            {property.nearbyAmenities.map((amenity, index) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <div key={index} className="flex items-center gap-4 text-[#222222]">
                  <Icon className="h-6 w-6 stroke-[1.5]" aria-hidden />
                  <span className="text-[16px]">{amenity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {property.transportAccess.length > 0 && (
        <div className="pt-8 border-t border-[#DDDDDD]">
          <h3 className="text-[18px] font-semibold text-[#222222] mb-6">
            {pd?.transportAccess || "Getting around"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            {property.transportAccess.map((transport, index) => {
              const Icon = getTransportIcon(transport);
              return (
                <div key={index} className="flex items-center gap-4 text-[#222222]">
                  <Icon className="h-6 w-6 stroke-[1.5]" aria-hidden />
                  <span className="text-[16px]">{transport}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default Neighborhood;