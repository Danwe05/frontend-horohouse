'use client';
import React, { useState, useEffect } from 'react';

interface PerformanceOvertimeProps {
  data?: number[];
}

const PerformanceOvertime: React.FC<PerformanceOvertimeProps> = ({ data: initialData }) => {
  const [metric, setMetric] = useState('Impression');
  const [data, setData] = useState<number[]>(initialData || []);

  const width = 250;
  const height = 120;
  const topPadding = 15;
  const bottomPadding = 20;

  const now = new Date();
  const currentMonth = now.getMonth();
  const monthName = now.toLocaleString('fr-FR', { month: 'short' });
  const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (day) => day % 6 === 0 || day === daysInMonth
  );

  const maxValue = data.length > 0 ? Math.max(...data) : 0;

  useEffect(() => {
    if (!initialData) {
      const fetchData = async () => {
        const backendData = Array.from({ length: daysInMonth }, () =>
          Math.floor(Math.random() * 5000 + 500)
        );
        setData(backendData);
      };
      fetchData();
    }
  }, [initialData, daysInMonth]);

  return (
    <div className="bg-white rounded-lg card1 overflow-hidden w-full ">
      {/* Header */}
      <div className="flex justify-between items-center bg-blue-600 py-1 px-3">
        <h2 className="text-white font-semibold text-xs">Performance Overtime</h2>

        <div className="relative">
          <button className="bg-white text-blue-600 font-medium text-[10px] px-2 py-1 rounded-md border border-gray-300 shadow-sm">
            {metric}
          </button>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          >
            <option>Impression</option>
            <option>Sold</option>
            <option>Rent</option>
            <option>Clicks</option>
            <option>Save</option>
            <option>Likes</option>
          </select>
        </div>
      </div>

      {/* Graph */}
      <div className="relative w-full flex flex-col items-center py-2">
        <svg
          width={width + 50}
          height={height + topPadding + bottomPadding}
          viewBox={`-35 -${topPadding} ${width + 50} ${height + topPadding + bottomPadding}`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = p * height;
            const value = Math.round(maxValue * (1 - p));
            return (
              <g key={i}>
                <line
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#93c5fd"
                  strokeDasharray="4"
                />
                <text x={-10} y={y + 3} textAnchor="end" fontSize="8" fill="#374151">
                  {value}
                </text>
              </g>
            );
          })}

          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth={1.5}
            points={data
              .map(
                (val, i) => `${(i / (data.length - 1)) * width},${height - (val / maxValue) * height}`
              )
              .join(' ')}
          />
        </svg>

        <div className="flex justify-between w-[250px] mt-1 text-[8px] text-gray-700 font-medium pl-6">
          {days.map((day, i) => (
            <span key={i}>
              {day} {monthName}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between bg-blue-600 text-white py-2 px-3 text-xs font-medium">
        <span>Metrics</span>
        <span>Total {metric}: {data.reduce((sum, val) => sum + val, 0)}</span>
      </div>
    </div>
  );
};

export default PerformanceOvertime;
