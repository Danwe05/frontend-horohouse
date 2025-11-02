'use client';
import React from 'react';

interface OverallPerformanceProps {
  data?: string[][];
}

const OverallPerformance: React.FC<OverallPerformanceProps> = ({
  data = [
    ['Listing', 'Impression', 'Clicks', 'Save', 'Status'],
    ['Property A', '23.5K', '12.5K', '12.5K', 'Active'],
    ['Property B', '23.5K', '12.5K', '12.5K', 'Active'],
  ],
}) => {
  return (
    <div className="bg-white rounded-lg card1 overflow-hidden w-full max-w-2xl">
      <h2 className="text-black font-semibold text-sm mt-0 pb-2 p-4">
        Overall Performance
      </h2>

      <div className="flex flex-col gap-y-3"> {/* <-- espace entre les lignes */}
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid grid-cols-5 text-center text-gray-700 ${
              rowIndex === 0
                ? 'bg-gray-100 border-b border-gray-200 rounded-t-lg text-xs mx-4'
                : ''
            }`}
          >
            {row.map((cell, colIndex) => {
              const isStatusCol = colIndex === row.length - 1;
              return (
                <div
                  key={colIndex}
                  className={`${
                    rowIndex === 0
                      ? 'p-3'
                      : isStatusCol
                      ? 'p-3 flex items-end justify-center'
                      : 'p-3'
                  } text-xs font-semibold`}
                >
                  {isStatusCol && rowIndex !== 0 ? (
                    <span className="bg-green-100 text-green-700 rounded-full inline-flex items-center justify-center px-4 py-1 text-[11px]">
                      {cell}
                    </span>
                  ) : (
                    cell
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverallPerformance;
