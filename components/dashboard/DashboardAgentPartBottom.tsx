'use client';
import React from 'react';
import OverallPerformance from './OverallPerformance';
import DashboardAgentUpgradeYourPlan from './DashboardAgentUpgradeYourPlan';

const DashboardAgentPartBottom = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4 ">
      <OverallPerformance />
      <DashboardAgentUpgradeYourPlan />
    </div>
  );
};

export default DashboardAgentPartBottom;
