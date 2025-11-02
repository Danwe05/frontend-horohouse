"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const chartData = [
  { value: 30 },
  { value: 45 },
  { value: 35 },
  { value: 55 },
  { value: 40 },
  { value: 60 },
  { value: 50 },
];

export const AISuggestionCard = () => {
  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="font-semibold">AI Suggestion</h3>
      </div>

      <div className="mb-4">
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#aiGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-sm text-slate-300 mb-4">
        Hi Aman, look at how your sales are going today?
      </p>

      <div className="flex gap-2">
        <Input 
          placeholder="Ask anything..."
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
        />
        <Button size="icon" className="bg-primary hover:bg-primary/90 flex-shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
