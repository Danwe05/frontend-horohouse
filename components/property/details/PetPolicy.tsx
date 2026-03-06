"use client"

import { Dog, Cat, Bird, Fish, Check, X, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PetPolicyRule {
  label: string;
  allowed: boolean;
  /** Optional detail note, e.g. "Up to 2 dogs, 50 lbs max each" */
  note?: string;
  icon?: "dog" | "cat" | "bird" | "fish" | "paw";
}

export interface PetPolicyInfo {
  /** Whether pets are allowed at all. Controls the top-level badge. */
  petsAllowed: boolean;
  rules?: PetPolicyRule[];
  depositAmount?: number;
  monthlyPetRent?: number;
  requiresVaccination?: boolean;
  requiresLicense?: boolean;
  breedRestrictions?: boolean;
  /** Any extra notes to show in the additional info list */
  additionalNotes?: string[];
}

interface PetPolicyProps {
  policy: PetPolicyInfo;
  currency?: string;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<NonNullable<PetPolicyRule["icon"]>, React.ElementType> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  fish: Fish,
  paw: PawPrint,
};

// ─── Component ────────────────────────────────────────────────────────────────

const PetPolicy = ({ policy, currency = "XAF" }: PetPolicyProps) => {
  const {
    petsAllowed,
    rules = [],
    depositAmount,
    monthlyPetRent,
    requiresVaccination,
    requiresLicense,
    breedRestrictions,
    additionalNotes = [],
  } = policy;

  // Build the "additional information" bullet list from structured props
  const infoLines: string[] = [
    ...(depositAmount != null
      ? [`Pet deposit: ${depositAmount.toLocaleString()} ${currency} (refundable)`]
      : []),
    ...(monthlyPetRent != null
      ? [`Monthly pet rent: ${monthlyPetRent.toLocaleString()} ${currency} per pet`]
      : []),
    ...(requiresVaccination ? ["Proof of vaccination required"] : []),
    ...(requiresLicense ? ["Proof of license required"] : []),
    ...(breedRestrictions ? ["Some breed restrictions apply"] : []),
    ...additionalNotes,
  ];

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-8 mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pet Policy</h2>
        <Badge
          className={
            petsAllowed
              ? "bg-emerald-50 text-emerald-600 px-3.5 py-1.5 font-bold border-none rounded-lg"
              : "bg-red-50 text-red-600 px-3.5 py-1.5 font-bold border-none rounded-lg shadow-sm"
          }
        >
          {petsAllowed ? "Pet Friendly" : "No Pets"}
        </Badge>
      </div>

      {/* If no pets allowed, show a simple notice and stop */}
      {!petsAllowed ? (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50 border border-red-100">
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <PawPrint className="h-6 w-6 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900">Pets not permitted</p>
            <p className="text-sm font-medium text-slate-500 mt-1">
              This property does not allow pets. Please contact the owner for exceptions.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Per-pet-type rules */}
          {rules.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {rules.map((rule) => {
                const Icon = rule.icon ? ICON_MAP[rule.icon] : PawPrint;
                return (
                  <div
                    key={rule.label}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors group ${
                      rule.allowed
                        ? "bg-slate-50 border-slate-100"
                        : "bg-red-50/50 border-red-100"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 transition-transform ${
                        rule.allowed ? "" : "opacity-50"
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${rule.allowed ? "text-blue-600" : "text-red-400"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900">{rule.label}</p>
                        {rule.allowed ? (
                          <Check className="h-4 w-4 text-emerald-500" aria-label="Allowed" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" aria-label="Not allowed" />
                        )}
                      </div>
                      {rule.note && (
                        <p className="text-sm font-medium text-slate-500">{rule.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Additional information */}
          {infoLines.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase">
                Additional Information
              </h3>
              <ul className="space-y-3 text-sm font-medium text-slate-600">
                {infoLines.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-emerald-600" aria-hidden />
                    </div>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default PetPolicy;

// ─── Usage example ────────────────────────────────────────────────────────────
//
// <PetPolicy
//   currency="XAF"
//   policy={{
//     petsAllowed: true,
//     rules: [
//       { label: "Dogs allowed", allowed: true, icon: "dog", note: "Up to 2 dogs, 50 lbs max each" },
//       { label: "Cats allowed", allowed: true, icon: "cat", note: "Up to 2 cats" },
//       { label: "Small pets", allowed: true, icon: "bird", note: "Caged pets allowed" },
//       { label: "Large dogs", allowed: false, icon: "dog", note: "Over 50 lbs not permitted" },
//     ],
//     depositAmount: 5000,
//     monthlyPetRent: 1000,
//     requiresVaccination: true,
//     requiresLicense: true,
//     breedRestrictions: true,
//   }}
// />