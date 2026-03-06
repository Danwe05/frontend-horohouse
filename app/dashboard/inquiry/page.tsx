'use client';
import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import InquiriesPage from './inquiries-page';
const PropertyPage = () => {

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

         <div className="flex-1 min-h-screen pt-3 px-6 lg:pt-3">
            <InquiriesPage/>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PropertyPage;