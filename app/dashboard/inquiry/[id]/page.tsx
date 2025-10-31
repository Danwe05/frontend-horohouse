'use client';
import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import InquiryDetailPage from './inquiry-detail-page';
const InquiryDetail = () => {

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

         <div className="flex-1 min-h-screen pt-14 lg:pt-0">
            <InquiryDetailPage/>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default InquiryDetail;