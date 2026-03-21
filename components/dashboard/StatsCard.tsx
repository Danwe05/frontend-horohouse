"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  breakdown?: {
    label: string;
    value: number | string;
    percentage?: number;
    color?: string;
  }[];
  className?: string;
  variant?: 'default' | 'highlighted' | 'subtle' | 'success' | 'warning' | 'danger' | 'glass';
  animateValue?: boolean;
  loading?: boolean;
  sparklineData?: number[];
  progress?: number;
  compactMode?: boolean;
  expandable?: boolean;
  onClick?: () => void;
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      title,
      value,
      icon: Icon,
      subtitle,
      trend,
      action,
      breakdown,
      className,
      variant = 'default',
      animateValue = false,
      loading = false,
      sparklineData,
      progress,
      compactMode = false,
      expandable = false,
      onClick,
    },
    ref
  ) => {
    const router = useRouter();
    const [animatedValue, setAnimatedValue] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const numericValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]/g, ''));

    useEffect(() => {
      if (animateValue && !isNaN(numericValue)) {
        const duration = 1000;
        const steps = 60;
        const increment = numericValue / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= numericValue) {
            setAnimatedValue(numericValue);
            clearInterval(timer);
          } else {
            setAnimatedValue(Math.floor(current));
          }
        }, duration / steps);

        return () => clearInterval(timer);
      }
    }, [numericValue, animateValue]);

    const variantStyles = {
      default: 'bg-blue-50 border-0 -none',
      highlighted: 'bg-blue-50 border-0 -none',
      subtle: 'border-0 -none',
      success: 'border-0',
      warning: 'border-0',
      danger: 'border-0',
      glass: 'border-0',
    };

    const iconBgStyles = {
      default: 'bg-slate-100',
      highlighted: 'bg-blue-200/50',
      subtle: 'bg-slate-200',
      success: 'bg-emerald-200/50',
      warning: 'bg-amber-200/50',
      danger: 'bg-red-200/50',
      glass: 'bg-white/80',
    };

    const trendColor = trend?.isPositive
      ? 'text-emerald-600 bg-emerald-50'
      : 'text-red-600 bg-red-50';

    const TrendIcon = trend?.isPositive ? TrendingUp : trend?.isPositive === false ? TrendingDown : Minus;

    const displayValue = animateValue && !isNaN(numericValue) ? animatedValue : value;

    // 1. SIMPLIFIED SPARKLINE RENDERING IN StatsCard.tsx
    // Replace the renderSparkline function with this:

    const renderSparkline = () => {
      if (!sparklineData || sparklineData.length === 0) return null;

      const max = Math.max(...sparklineData);
      const min = Math.min(...sparklineData);
      const range = max - min || 1;

      return (
        <div className="h-10 w-full mt-2 flex items-end gap-1">
          {sparklineData.map((val, i) => {
            const height = ((val - min) / range) * 100;

            return (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                style={{ height: `${Math.max(height, 5)}%` }}
              />
            );
          })}
        </div>
      );
    };

    // 2. IMPROVED SPARKLINE GENERATION IN useStatsCardConfig.tsx
    // Replace the generateSparkline function with this:

    const generateSparkline = (trend: number, baseValue: number = 50, points: number = 8): number[] => {
      const data: number[] = [];
      const trendStrength = Math.min(Math.abs(trend), 30); // Cap trend influence

      for (let i = 0; i < points; i++) {
        const progress = i / (points - 1);

        // Add smooth trend progression
        const trendValue = trend > 0
          ? progress * trendStrength
          : -progress * trendStrength;

        // Add natural variation (smaller for more realistic data)
        const variation = (Math.sin(i * 0.8) * 3) + (Math.random() - 0.5) * 4;

        // Combine base value, trend, and variation
        const value = baseValue + trendValue + variation;

        data.push(Math.max(5, value)); // Ensure minimum value
      }

      return data;
    };

    const renderProgress = () => {
      if (progress === undefined) return null;

      return (
        <div className="mt-2">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 ease-out',
                variant === 'success' ? 'bg-emerald-500' :
                  variant === 'warning' ? 'bg-amber-500' :
                    variant === 'danger' ? 'bg-red-500' :
                      'bg-blue-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
        </div>
      );
    };

    const handleCardClick = () => {
      if (expandable) {
        setIsExpanded(!isExpanded);
      }
      if (onClick) {
        onClick();
      }
    };

    const handleActionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (action?.href) {
        router.push(action.href);
      }
      if (action?.onClick) {
        action.onClick();
      }
    };

    if (loading) {
      return (
        <Card className={cn('overflow-hidden animate-pulse', variantStyles[variant], className)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-10 w-10 bg-slate-200 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-48 bg-slate-200 rounded" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        ref={ref}
        className={cn(
          'overflow-hidden transition-all duration-300',
          variantStyles[variant],
          (onClick || expandable) && 'cursor-pointer',
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className={cn(
          'flex flex-row items-center justify-between space-y-0',
          compactMode ? 'pb-1' : 'pb-2'
        )}>
          <CardTitle className={cn(
            'font-medium text-slate-600',
            compactMode ? 'text-xs' : 'text-sm'
          )}>
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={cn(
                'p-2 rounded-lg transition-transform duration-300',
                iconBgStyles[variant],
                isHovered && 'scale-110'
              )}>
                <Icon className={cn(
                  'text-slate-600',
                  compactMode ? 'h-4 w-4' : 'h-5 w-5'
                )} strokeWidth={2} />
              </div>
            )}
            {expandable && breakdown && breakdown.length > 0 && (
              <div className="text-slate-400">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Main Value with Trend */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={cn(
                'font-bold text-slate-900 transition-all duration-300',
                compactMode ? 'text-2xl' : 'text-3xl',
                isHovered && ''
              )}>
                {displayValue}
              </span>
              {trend && (
                <span className={cn(
                  'text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1',
                  trendColor,
                  'transition-all duration-300',
                  isHovered && ''
                )}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>

            {/* Subtitle */}
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