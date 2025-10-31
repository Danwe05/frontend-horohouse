'use client';
import React from 'react';
import { ChartBar } from 'lucide-react';

interface PropertySoldProps {
  data?: { month: string; view: number; engage: number }[];
}

const PropertySold: React.FC<PropertySoldProps> = ({
  data = [
    { month: 'Jan', view: 40, engage: 20 },
    { month: 'Feb', view: 50, engage: 25 },
    { month: 'Mar', view: 45, engage: 20 },
    { month: 'Apr', view: 55, engage: 25 },
    { month: 'May', view: 35, engage: 15 },
    { month: 'Jun', view: 45, engage: 20 },
    { month: 'Jul', view: 50, engage: 25 },
  ],
}) => {
  const maxValue = Math.max(...data.map(d => d.view + d.engage));

  return (
    <div className="bg-white rounded-lg card overflow-hidden w-full flex flex-col justify-start p-2">
      
      {/* Titre */}
      <h2 className="text-black font-semibold text-sm mt-0 pb-2">Property Sold</h2>

      {/* Légende */}
      <div className="flex items-center gap-5 pb-1">
        <div className="flex items-center gap-1">
          <ChartBar className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-gray-600">View</span>
        </div>
        <div className="flex items-center gap-1">
          <ChartBar className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-gray-600">Engage</span>
        </div>
      </div>

      {/* Graphiques + mois */}
      <div className="flex flex-col justify-end flex-1">
        <div className="flex justify-between items-end flex-1 h-full">
          {data.map((item, idx) => {
            const viewHeight = (item.view / maxValue) * 100;
            const engageHeight = (item.engage / maxValue) * 100;

            return (
              <div key={idx} className="flex flex-col items-center w-5">
                <div className="flex flex-col justify-end h-36 w-full rounded-xl overflow-hidden gap-0.5">
                  <div
                    className="bg-blue-600 w-full rounded-xl transition-all"
                    style={{ height: `${viewHeight}%` }}
                    title={`View: ${item.view}`}
                  ></div>
                  <div
                    className="bg-yellow-400 w-full rounded-xl transition-all"
                    style={{ height: `${engageHeight}%` }}
                    title={`Engage: ${item.engage}`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mois tout en bas */}
        <div className="flex justify-between w-full mt-1 gap-6">
          {data.map((item, idx) => (
            <span key={idx} className="text-[10px] text-gray-600 text-center w-8">
              {item.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertySold;
