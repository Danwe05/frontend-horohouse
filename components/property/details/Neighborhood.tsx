"use client"

import {
  GraduationCap, ShoppingBag, Train, Coffee, Dumbbell,
  Trees, MapPin, Utensils, Hospital, Landmark, Fuel,
  Hotel, Bus, Bike,
} from "lucide-react";
import MapView from "../MapView";
import { Progress } from "@/components/ui/progress";

interface ScoreInfo {
  value: number;
  label: string;
  description: string;
}

interface NeighborhoodProps {
  property: {
    city: string;
    neighborhood?: string;
    nearbyAmenities: string[];
    transportAccess: string[];
    latitude?: number;
    longitude?: number;
    /** Optional: pass real scores from your API instead of showing mocks */
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
  // Use prop-supplied scores when available; fall back to demo values clearly
  // marked as estimated so the UI can communicate uncertainty.
  const walkScore = property.walkScore ?? 75;
  const transitScore = property.transitScore ?? 68;
  const bikeScore = property.bikeScore ?? 62;
  const scoresAreEstimated = !property.walkScore && !property.transitScore && !property.bikeScore;

  const scores: Array<{ type: "walk" | "transit" | "bike"; label: string; value: number; color: string }> = [
    { type: "walk", label: "Walk Score", value: walkScore, color: "bg-emerald-500" },
    { type: "transit", label: "Transit Score", value: transitScore, color: "bg-blue-500" },
    { type: "bike", label: "Bike Score", value: bikeScore, color: "bg-amber-500" },
  ];

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-8 mt-10">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Neighborhood</h2>

      {/* Walk / Transit / Bike Scores */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase">
            Livability Scores
          </h3>
          {scoresAreEstimated && (
            <span className="text-xs text-slate-400 italic">Estimated</span>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {scores.map(({ type, label, value, color }) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <span className="font-bold text-lg text-slate-900">{value}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
                className="h-2.5 bg-slate-100 rounded-full overflow-hidden"
              >
                <div
                  className={`${color} h-full rounded-full transition-all duration-700`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="text-xs font-bold text-slate-500">
                {getScoreDescription(value, type)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Location</h3>
        </div>

        {property.neighborhood && (
          <p className="text-base font-medium text-slate-600">{property.neighborhood}</p>
        )}

        {property.latitude !== undefined && property.longitude !== undefined ? (
          <div className="mt-4 h-[300px] rounded-2xl overflow-hidden border border-slate-200">
            <MapView
              selectedLocation={{ lng: property.longitude, lat: property.latitude }}
            />
          </div>
        ) : (
          <div className="mt-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
            <MapPin className="h-6 w-6 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-400">Map unavailable for this listing</p>
          </div>
        )}
      </div>

      {/* Nearby Amenities */}
      {property.nearbyAmenities.length > 0 && (
        <div className="pt-6 border-t border-slate-100 space-y-5">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Nearby Amenities</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {property.nearbyAmenities.map((amenity, index) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 transition-transform">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-bold text-slate-700 truncate">{amenity}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transport Access */}
      {property.transportAccess.length > 0 && (
        <div className="pt-6 border-t border-slate-100 space-y-5">
          <div className="flex items-center gap-2.5">
            <Train className="h-6 w-6 text-blue-500" />
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Transport Access</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {property.transportAccess.map((transport, index) => {
              const Icon = getTransportIcon(transport);
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 transition-transform">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-bold text-slate-700 truncate">{transport}</p>
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