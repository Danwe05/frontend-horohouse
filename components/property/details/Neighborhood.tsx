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

type IconComponent = React.FC<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;

const AMENITY_ICON_MAP: [RegExp, IconComponent][] = [
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

const TRANSPORT_ICON_MAP: [RegExp, IconComponent][] = [
  [/train|rail|metro|subway/i, Train],
  [/bus|tram|BRT/i, Bus],
  [/bike|cycle/i, Bike],
];

function getAmenityIcon(label: string): IconComponent {
  for (const [pattern, Icon] of AMENITY_ICON_MAP) {
    if (pattern.test(label)) return Icon;
  }
  return MapPin;
}

function getTransportIcon(label: string): IconComponent {
  for (const [pattern, Icon] of TRANSPORT_ICON_MAP) {
    if (pattern.test(label)) return Icon;
  }
  return Bus;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Neighborhood = ({ property }: NeighborhoodProps) => {
  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const walkScore = property.walkScore ?? 75;
  const transitScore = property.transitScore ?? 68;
  const bikeScore = property.bikeScore ?? 62;
  const scoresAreEstimated = !property.walkScore && !property.transitScore && !property.bikeScore;

  const scores: Array<{ label: string; value: number; desc: string }> = [
    {
      label: pd?.walkScore || "Walk Score",
      value: walkScore,
      desc: walkScore >= 90 ? "Walker's Paradise" : walkScore >= 70 ? "Very Walkable" : walkScore >= 50 ? "Somewhat Walkable" : "Car-Dependent",
    },
    {
      label: pd?.transitScore || "Transit Score",
      value: transitScore,
      desc: transitScore >= 90 ? "Rider's Paradise" : transitScore >= 70 ? "Excellent Transit" : transitScore >= 50 ? "Good Transit" : "Some Transit",
    },
    {
      label: pd?.bikeScore || "Bike Score",
      value: bikeScore,
      desc: bikeScore >= 90 ? "Biker's Paradise" : bikeScore >= 70 ? "Very Bikeable" : bikeScore >= 50 ? "Bikeable" : "Minimal Bike Infrastructure",
    },
  ];

  return (
    <section className="space-y-6 text-[#222222]">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight mb-2">
          {pd?.location || "Where you'll be"}
        </h2>
        <p className="text-[16px] text-[#717171] mb-6">
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

      {/* Livability score bars — Airbnb style */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-[#222222]">
            {pd?.livabilityScores || "Livability scores"}
          </h3>
          {scoresAreEstimated && (
            <span className="text-[13px] text-[#717171]">{pd?.estimated || "Estimated"}</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {scores.map(({ label, value, desc }) => (
            <div key={label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-semibold text-[#222222]">{label}</span>
                <span className="text-[#717171]">{value}/100</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-[13px] text-[#717171]">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {property.nearbyAmenities.length > 0 && (
        <div className="pt-6 border-t border-[#DDDDDD]">
          <h3 className="text-[18px] font-semibold text-[#222222] mb-5">
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
        <div className="pt-6 border-t border-[#DDDDDD]">
          <h3 className="text-[18px] font-semibold text-[#222222] mb-5">
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