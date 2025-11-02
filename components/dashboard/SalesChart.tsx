'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface DataSeries {
  key: string;
  label: string;
  color: string;
}

interface SalesChartProps {
  title?: string;
  data?: ChartDataPoint[];
  type?: 'line' | 'bar' | 'composed';
  dataKeys?: DataSeries[];
  xAxisKey?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  strokeWidth?: number;
  timeframe?: 'week' | 'month' | 'year';
  onTimeframeChange?: (timeframe: 'week' | 'month' | 'year') => void;
}

const defaultData = [
  { name: 'Jan', sales: 45000, rentals: 28000, leads: 120 },
  { name: 'Feb', sales: 52000, rentals: 31000, leads: 145 },
  { name: 'Mar', sales: 48000, rentals: 29000, leads: 135 },
  { name: 'Apr', sales: 61000, rentals: 35000, leads: 165 },
  { name: 'May', sales: 55000, rentals: 32000, leads: 150 },
  { name: 'Jun', sales: 68000, rentals: 38000, leads: 180 },
];

const defaultDataKeys = [
  { key: 'sales', label: 'Sales', color: '#3b82f6' },
  { key: 'rentals', label: 'Rentals', color: '#10b981' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{ color: entry.color }} className="text-sm">
          {entry.name}:{' '}
          <span className="font-semibold">
            {typeof entry.value === 'number'
              ? entry.value > 1000
                ? `${(entry.value / 1000).toFixed(0)}k XAF`
                : `${entry.value}`
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export const SalesChart = React.forwardRef<HTMLDivElement, SalesChartProps>(
  (
    {
      title = 'Sales & Revenue Overview',
      data = defaultData,
      type = 'line',
      dataKeys = defaultDataKeys,
      xAxisKey = 'name',
      height = 350,
      className,
      showLegend = true,
      showGrid = true,
      strokeWidth = 2,
      timeframe = 'month',
      onTimeframeChange,
    },
    ref
  ) => {
    const [activeTimeframe, setActiveTimeframe] = useState(timeframe);

    const handleTimeframeChange = (value: 'week' | 'month' | 'year') => {
      setActiveTimeframe(value);
      onTimeframeChange?.(value);
    };

    const ChartComponent = 
      type === 'line' ? LineChart : 
      type === 'bar' ? BarChart : 
      ComposedChart;

    const DataComponent = type === 'line' ? Line : Bar;

    // Calculate total and average
    const firstDataKey = dataKeys[0]?.key;
    const total = data.reduce((sum, item) => {
      const value = item[firstDataKey];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    const average = Math.round(total / data.length);

    return (
      <Card
        ref={ref}
        className={cn(
          'overflow-hidden transition-all duration-300 hover:shadow-lg',
          className
        )}
      >
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {title}
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total: {(total / 1000).toFixed(0)}k XAF | Average: {(average / 1000).toFixed(0)}k XAF
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={activeTimeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <ChartComponent
              data={data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
              )}
              <XAxis
                dataKey={xAxisKey}
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) => {
                  if (typeof value === 'number' && value > 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
    XAF               }
                  return value;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  iconType={type === 'line' ? 'line' : 'square'}
                />
              )}
              {dataKeys.map((dataKey, index) => {
                if (type === 'composed') {
                  return index === 0 ? (
                    <Line
                      key={dataKey.key}
                      type="monotone"
                      dataKey={dataKey.key}
                      name={dataKey.label}
                      stroke={dataKey.color}
                      strokeWidth={strokeWidth}
                      dot={{ fill: dataKey.color, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      yAxisId="left"
                    />
                  ) : (
                    <Bar
                      key={dataKey.key}
                      dataKey={dataKey.key}
                      name={dataKey.label}
                      fill={dataKey.color}
                      radius={[8, 8, 0, 0]}
                      opacity={0.8}
                      yAxisId="right"
                    />
                  );
                }

                return (
                  <DataComponent
                    key={dataKey.key}
                    type="monotone"
                    dataKey={dataKey.key}
                    name={dataKey.label}
                    stroke={dataKey.color}
                    fill={dataKey.color}
                    strokeWidth={type === 'line' ? strokeWidth : 0}
                    radius={type === 'bar' ? [8, 8, 0, 0] : 0}
                    dot={
                      type === 'line'
                        ? {
                            fill: dataKey.color,
                            r: 4,
                            strokeWidth: 0,
                          }
                        : false
                    }
                    activeDot={
                      type === 'line'
                        ? {
                            r: 6,
                            strokeWidth: 0,
                          }
                        : { fill: dataKey.color }
                    }
                    opacity={0.85}
                  />
                );
              })}
            </ChartComponent>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }
);

SalesChart.displayName = 'SalesChart';