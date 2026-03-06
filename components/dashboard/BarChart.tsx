import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  subtitle?: string;
  height?: number;
  showValues?: boolean;
  showGrid?: boolean;
  variant?: 'default' | 'gradient' | 'minimal';
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  (
    {
      data,
      title,
      subtitle,
      height = 300,
      showValues = true,
      showGrid = true,
      variant = 'default',
      className,
      orientation = 'vertical',
    },
    ref
  ) => {
    const maxValue = Math.max(...data.map((d) => d.value));
    const defaultColors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-purple-500',
      'bg-rose-500',
      'bg-cyan-500',
    ];

    const getBarColor = (index: number, customColor?: string) => {
      if (customColor) return customColor;
      return defaultColors[index % defaultColors.length];
    };

    const getGradientClass = (index: number) => {
      const gradients = [
        'bg-gradient-to-t from-blue-500 to-blue-400',
        'bg-gradient-to-t from-emerald-500 to-emerald-400',
        'bg-gradient-to-t from-amber-500 to-amber-400',
        'bg-gradient-to-t from-purple-500 to-purple-400',
        'bg-gradient-to-t from-rose-500 to-rose-400',
        'bg-gradient-to-t from-cyan-500 to-cyan-400',
      ];
      return gradients[index % gradients.length];
    };

    if (orientation === 'horizontal') {
      return (
        <Card ref={ref} className={cn('overflow-hidden', className)}>
          {title && (
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
            </CardHeader>
          )}
          <CardContent>
            <div className="space-y-4">
              {data.map((item, index) => {
                const percentage = (item.value / maxValue) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                      {showValues && (
                        <span className="text-slate-600 font-semibold">
                          {item.value}
                        </span>
                      )}
                    </div>
                    <div className="relative w-full bg-slate-100 rounded-full h-8 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500 ease-out',
                          variant === 'gradient'
                            ? getGradientClass(index)
                            : getBarColor(index, item.color)
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)}>
        {title && (
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </CardHeader>
        )}
        <CardContent>
          <div className="relative" style={{ height: `${height}px` }}>
            {/* Grid lines */}
            {showGrid && (
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full border-t border-slate-200"
                  />
                ))}
              </div>
            )}

            {/* Bars */}
            <div className="relative h-full flex items-end justify-around gap-2 px-2">
              {data.map((item, index) => {
                const barHeight = (item.value / maxValue) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    {/* Value label on hover */}
                    {showValues && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-semibold text-slate-700 mb-1">
                        {item.value}
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all duration-500 ease-out hover:opacity-80 cursor-pointer',
                        variant === 'gradient'
                          ? getGradientClass(index)
                          : getBarColor(index, item.color),
                        variant === 'minimal' && 'opacity-70 hover:opacity-100'
                      )}
                      style={{ height: `${barHeight}%` }}
                    />

                    {/* Label */}
                    <div className="text-xs text-slate-600 font-medium text-center mt-2 line-clamp-2">
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

BarChart.displayName = 'BarChart';