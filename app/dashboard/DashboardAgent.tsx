'use client';
import React from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardAgentPartBottom from '@/components/dashboard/DashboardAgentPartBottom';

const DashboardAgentPage = () => {
  return (

      <div>
        {/* Les composants empilés verticalement */}
        <DashboardAnalytics />
        <DashboardStats />
        <div className='mt-2'>
          <DashboardAgentPartBottom />
        </div>
      </div>
  );
};

export default DashboardAgentPage;
