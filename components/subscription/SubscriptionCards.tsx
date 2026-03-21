import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Building, Sparkles } from 'lucide-react';
import { SubscriptionPlan, BillingCycle } from '@/types/paiement';

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
    <div className="w-full max-w-6xl mx-auto space-y-12 py-10">
      {/* Sleek Billing Toggle */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex p-1 bg-slate-100/50 rounded-2xl border border-slate-200">
          <button
            onClick={() => setBillingCycle(BillingCycle.MONTHLY)}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === BillingCycle.MONTHLY
              ? 'bg-white -sm text-blue-600'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle(BillingCycle.YEARLY)}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === BillingCycle.YEARLY
              ? 'bg-white -sm text-blue-600'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Yearly
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase font-black tracking-wider">Save 25%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const isCurrentPlan = currentPlan === plan.name;
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.name}
              className={`relative overflow-hidden border-0 transition-all duration-500 group hover:-translate-y-2 rounded-[32px] ${isPopular
                ? 'bg-slate-900 text-white -2xl -slate-900/40 scale-105 z-10'
                : 'bg-white text-slate-900 -xl -slate-200/50 border border-slate-100'
                }`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 p-5">
                  <Badge className="bg-blue-500 hover:bg-blue-400 text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-10 pb-4 px-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${isPopular ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                  {getPlanIcon(plan.name)}
                </div>

                <h3 className="text-2xl font-black tracking-tight">{plan.displayName}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tighter">
                    {price.toLocaleString()}
                  </span>
                  <span className={`text-sm font-bold uppercase tracking-widest ${isPopular ? 'text-slate-400' : 'text-slate-400'}`}>
                    {billingCycle === BillingCycle.MONTHLY ? 'FCFA / mo' : 'FCFA / yr'}
                  </span>
                </div>
                <p className={`mt-4 text-sm font-medium leading-relaxed ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="px-8 py-6">
                <div className={`h-px w-full mb-8 ${isPopular ? 'bg-slate-800' : 'bg-slate-50'}`} />
                <ul className="space-y-4">
                  {[
                    { label: `${plan.features.maxListings === -1 ? 'Unlimited' : plan.features.maxListings} property listings`, check: true },
                    { label: `${plan.features.boostsPerMonth === -1 ? 'Unlimited' : plan.features.boostsPerMonth} monthly boosts`, check: true },
                    { label: 'Featured listings', check: plan.features.featuredListings },
                    { label: 'Priority support', check: plan.features.prioritySupport },
                  ].map((feature, i) => feature.check && (
                    <li key={i} className="flex items-start gap-4">
                      <div className={`mt-1 rounded-full p-1 ${isPopular ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                        <Check className="h-3 w-3 text-blue-500" />
                      </div>
                      <span className={`text-sm font-bold ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="px-8 pb-10">
                <Button
                  onClick={() => onSelectPlan(plan, billingCycle)}
                  disabled={loading || isCurrentPlan}
                  className={`w-full h-12 rounded-2xl font-black text-sm transition-all active:scale-95 ${isCurrentPlan
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : isPopular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white -lg -blue-500/25'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                >
                  {isCurrentPlan ? '✓ Current Plan' : 'Get Started'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};