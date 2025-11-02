"use client";

import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ArrowUpRight } from "lucide-react";

const data = [
  { quarter: "Q1", propertySale: 400, propertyRent: 300 },
  { quarter: "Q2", propertySale: 300, propertyRent: 450 },
  { quarter: "Q3", propertySale: 500, propertyRent: 420 },
  { quarter: "Q4", propertySale: 450, propertyRent: 520 },
];

export const GrowthChart = () => {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">Growth Statistics</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Yearly
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">$732,629</p>
        </div>
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis 
            dataKey="quarter" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Bar 
            dataKey="propertySale" 
            fill="hsl(var(--chart-3))" 
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
          <Bar 
            dataKey="propertyRent" 
            fill="hsl(var(--chart-2))" 
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-3" />
          <span className="text-sm text-muted-foreground">Property Sale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-2" />
          <span className="text-sm text-muted-foreground">Property Rent</span>
        </div>
      </div>
    </Card>
  );
};
