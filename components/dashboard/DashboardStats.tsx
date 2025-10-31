'use client';
import React from 'react';
import PerformanceOvertime from './PerformanceOvertime';
import PropertySold from './PropertySold';
import PropertyRent from './PropertyRent';

const DashboardStats: React.FC = () => {
  return (
    <div className="w-full flex flex-wrap flex-col px-2">
      <div className="">
        <PerformanceOvertime />
      </div>
      <div className="">
        <PropertySold />
      </div>
      <div className="">
        <PropertyRent />
      </div>
    </div>
  );
};

export default DashboardStats;
