"use client";

import { Dog, Cat, Bird, Fish, Check, X, PawPrint } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PetPolicyRule {
  label: string;
  allowed: boolean;
  note?: string;
  icon?: "dog" | "cat" | "bird" | "fish" | "paw";
}

export interface PetPolicyInfo {
  petsAllowed: boolean;
  rules?: PetPolicyRule[];
  depositAmount?: number;
  monthlyPetRent?: number;
  requiresVaccination?: boolean;
  requiresLicense?: boolean;
  breedRestrictions?: boolean;
  additionalNotes?: string[];
}

interface PetPolicyProps {
  policy: PetPolicyInfo;
  currency?: string;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
import type { LucideIcon } from "lucide-react";
type IconComponent = LucideIcon;

const ICON_MAP: Record<NonNullable<PetPolicyRule["icon"]>, IconComponent> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  fish: Fish,
  paw: PawPrint,
};

// ─── Component ────────────────────────────────────────────────────────────────

const PetPolicy = ({ policy, currency = "XAF" }: PetPolicyProps) => {
  const { t } = useLanguage();
  const pd = t.propertyDetails;

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

  const infoLines: string[] = [
    ...(depositAmount != null
      ? [pd?.petDeposit?.replace("{amount}", depositAmount.toLocaleString()).replace("{currency}", currency) || `Pet deposit: ${depositAmount.toLocaleString()} ${currency} (refundable)`]
      : []),
    ...(monthlyPetRent != null
      ? [pd?.monthlyPetRent?.replace("{amount}", monthlyPetRent.toLocaleString()).replace("{currency}", currency) || `Monthly pet rent: ${monthlyPetRent.toLocaleString()} ${currency} per pet`]
      : []),
    ...(requiresVaccination ? [pd?.proofOfVaccination || "Proof of vaccination required"] : []),
    ...(requiresLicense ? [pd?.proofOfLicense || "Proof of license required"] : []),
    ...(breedRestrictions ? [pd?.breedRestrictions || "Some breed restrictions apply"] : []),
    ...additionalNotes,
  ];

  return (
    <section className="space-y-6 text-[#222222]">
      <h2 className="text-[22px] font-semibold tracking-tight">
        {pd?.petPolicy || "Pets"}
      </h2>

      {!petsAllowed ? (
        <div className="flex items-center gap-4 text-[#222222]">
          <PawPrint className="h-6 w-6 stroke-[1.5]" />
          <span className="text-[16px]">{pd?.noPets || "No pets allowed"}</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-[#222222]">
            <PawPrint className="h-6 w-6 stroke-[1.5]" />
            <span className="text-[16px]">{pd?.petFriendly || "Pets allowed"}</span>
          </div>

          {rules.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
              {rules.map((rule) => {
                const Icon = rule.icon ? ICON_MAP[rule.icon] : PawPrint;
                return (
                  <div key={rule.label} className="flex items-start gap-4">
                    <Icon className="h-6 w-6 stroke-[1.5] text-[#222222] shrink-0" aria-hidden="true" />
                    <div>
                      <p className={`text-[16px] ${rule.allowed ? "text-[#222222]" : "text-[#717171] line-through decoration-[#717171]"}`}>
                        {rule.label}
                      </p>
                      {rule.note && (
                        <p className="text-[14px] text-[#717171] mt-0.5">{rule.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {infoLines.length > 0 && (
            <div className="pt-4 border-t border-[#DDDDDD] space-y-4">
              <h3 className="text-[16px] font-semibold text-[#222222]">
                {pd?.additionalInfo || "Additional rules"}
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                {infoLines.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-[16px] text-[#222222]">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PetPolicy;