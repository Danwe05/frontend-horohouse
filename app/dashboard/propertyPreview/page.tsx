// page.tsx
'use client';
import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import PropertyPreview from '@/components/dashboard/PropertyPreview';

const PropertyPreviewPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar className="fixed left-0 top-0 h-screen w-60" />

      <div className="ml-60 flex-1 flex flex-col bg-white pb-10">
        {/* Pas de props */}
        <PropertyPreview />
      </div>

      <div className="flex flex-col border-l-2 border-[#F0F0F0]">
        <DashboardHeader />
        <DashboardCalendar />
      </div>
    </div>
  );
};

export default PropertyPreviewPage;
