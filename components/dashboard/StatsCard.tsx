import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'highlighted' | 'subtle';
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      title,
      value,
      icon: Icon,
      subtitle,
      trend,
      className,
      variant = 'default',
    },
    ref
  ) => {
    const variantStyles = {
      default: 'bg-white border-slate-200',
      highlighted: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
      subtle: 'bg-slate-50 border-slate-100',
    };

    const trendColor = trend?.isPositive
      ? 'text-emerald-600'
      : 'text-red-600';

    return (
      <Card
        ref={ref}
        className={cn(
          'overflow-hidden transition-all duration-300 ',
          variantStyles[variant],
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            {title}
          </CardTitle>
          {Icon && (
            <Icon className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {value}
              </span>
              {trend && (
                <span className={cn('text-sm font-semibold', trendColor)}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';