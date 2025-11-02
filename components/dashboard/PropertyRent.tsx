'use client';
import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

interface PropertyRentProps {
  sold?: number;
  view?: number;
}

const PropertyRent: React.FC<PropertyRentProps> = ({
  sold = 80,
  view = 20,
}) => {
  const data = [
    { name: 'Sold', value: sold },
    { name: 'View', value: view },
  ];

  const COLORS = ['#2563EB', '#FACC15'];

  return (
    <div className="bg-white rounded-lg card overflow-hidden w-full  flex flex-col justify-between p-3">
    
      {/* Header */}
      <div className="flex justify-between items-center text-black mb-2">
        <h2 className="font-semibold text-sm">Property Rent</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-600 rounded-sm border border-white"></span>
            <span className="text-xs text-black">Sold</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-400 rounded-sm border border-white"></span>
            <span className="text-xs text-black">View</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <PieChart width={180} height={180}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              cornerRadius={10}  // coins arrondis
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center text-black font-bold text-3xl">
            {sold}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyRent;
