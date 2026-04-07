'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Building, Sparkles } from 'lucide-react';
import { SubscriptionPlan, BillingCycle } from '@/types/paiement';
import { cn } from '@/lib/utils';

interface SubscriptionCardsProps {
  plans: SubscriptionPlan[];
  currentPlan?: string;
  onSelectPlan: (plan: SubscriptionPlan, billingCycle: BillingCycle) => void;
  loading?: boolean;
}

export const SubscriptionCards: React.FC<SubscriptionCardsProps> = ({
  plans,
  currentPlan,
  onSelectPlan,
  loading = false,
}) => {
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(BillingCycle.MONTHLY);

  const getPrice = (plan: SubscriptionPlan) =>
    billingCycle === BillingCycle.MONTHLY ? plan.pricing.monthly : plan.pricing.yearly;

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Star className="h-5 w-5" />;
      case 'premium': return <Sparkles className="h-5 w-5" />;
      case 'enterprise': return <Building className="h-5 w-5" />;
      default: return <Check className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      {/* Sleek Billing Toggle */}
      <div className="flex flex-col items-center mb-12">
        <div className="flex p-1 bg-[#F7F7F7] rounded-full border border-[#EBEBEB]">
          <button
            onClick={() => setBillingCycle(BillingCycle.MONTHLY)}
            className={cn(
              "px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all focus:outline-none",
              billingCycle === BillingCycle.MONTHLY
                ? "bg-white text-[#222222] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#DDDDDD]"
                : "text-[#717171] hover:text-[#222222] border border-transparent"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle(BillingCycle.YEARLY)}
            className={cn(
              "px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all flex items-center gap-2 focus:outline-none",
              billingCycle === BillingCycle.YEARLY
                ? "bg-white text-[#222222] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#DDDDDD]"
                : "text-[#717171] hover:text-[#222222] border border-transparent"
            )}
          >
            Yearly
            <span className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-bold",
              billingCycle === BillingCycle.YEARLY ? "bg-[#EBFBF0] text-[#008A05]" : "bg-[#EBEBEB] text-[#717171]"
            )}>
              Save 25%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 md:grid-cols-3 items-stretch">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const isCurrentPlan = currentPlan === plan.name;
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.name}
              className={cn(
                "relative bg-white shadow-none flex flex-col h-full overflow-hidden transition-colors",
                isPopular ? "border-[2px] border-[#222222] rounded-2xl" : "border border-[#DDDDDD] rounded-2xl hover:border-[#B0B0B0]"
              )}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 p-5 z-10">
                  <span className="bg-[#222222] text-white px-3 py-1.5 rounded-full font-semibold text-[11px] uppercase tracking-wide">
                    Recommended
                  </span>
                </div>
              )}

              <CardHeader className="pt-8 pb-6 px-8 shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center text-[#222222] mb-6">
                  {getPlanIcon(plan.name)}
                </div>

                <h3 className="text-[22px] font-semibold tracking-tight text-[#222222] mb-4">
                  {plan.displayName}
                </h3>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-semibold tracking-tight text-[#222222] leading-none">
                    {price.toLocaleString()}
                  </span>
                  <span className="text-[14px] font-medium text-[#717171]">
                    {billingCycle === BillingCycle.MONTHLY ? 'FCFA / mo' : 'FCFA / yr'}
                  </span>
                </div>
                
                <p className="mt-4 text-[15px] text-[#717171] leading-relaxed">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="px-8 py-2 flex-1">
                <div className="h-px w-full bg-[#EBEBEB] mb-6" />
                <ul className="space-y-4">
                  {[
                    { label: `${plan.features.maxListings === -1 ? 'Unlimited' : plan.features.maxListings} property listings`, check: true },
                    { label: `${plan.features.boostsPerMonth === -1 ? 'Unlimited' : plan.features.boostsPerMonth} monthly boosts`, check: true },
                    { label: 'Featured listings', check: plan.features.featuredListings },
                    { label: 'Priority support', check: plan.features.prioritySupport },
                  ].map((feature, i) => feature.check && (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#222222] shrink-0 stroke-[2]" />
                      <span className="text-[15px] text-[#222222] pt-0.5">
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="px-8 pb-8 pt-6 mt-auto">
                <Button
                  onClick={() => onSelectPlan(plan, billingCycle)}
                  disabled={loading || isCurrentPlan}
                  className={cn(
                    "w-full h-12 rounded-lg font-semibold text-[15px] transition-all focus:outline-none active:scale-[0.98]",
                    isCurrentPlan
                      ? "bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD] cursor-not-allowed opacity-100"
                      : isPopular
                        ? "bg-[#222222] hover:bg-black text-white"
                        : "bg-blue-600 border text-white hover:bg-blue-700"
                  )}
                >
                  {isCurrentPlan ? 'Current plan' : 'Get started'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};