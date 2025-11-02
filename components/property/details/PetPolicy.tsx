"use client"

import { Dog, Cat, Bird, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PetPolicy = () => {
  const policies = [
    { label: "Dogs allowed", allowed: true, icon: Dog, note: "Up to 2 dogs, 50 lbs max each" },
    { label: "Cats allowed", allowed: true, icon: Cat, note: "Up to 2 cats" },
    { label: "Small pets", allowed: true, icon: Bird, note: "Caged pets allowed" },
  ];

  return (
    <section className="bg-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pet Policy</h2>
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          Pet Friendly
        </Badge>
      </div>

      <div className="space-y-4">
        {policies.map((policy) => {
          const Icon = policy.icon;
          return (
            <div key={policy.label} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{policy.label}</p>
                  {policy.allowed ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <X className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{policy.note}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border space-y-3">
        <h3 className="font-semibold">Additional Information</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <span>Pet deposit: $500 (refundable)</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <span>Monthly pet rent: $50 per pet</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <span>Proof of vaccination and license required</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <span>Some breed restrictions apply</span>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default PetPolicy;
