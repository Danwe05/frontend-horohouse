'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import PropertyForm from '@/components/dashboard/PropertyForm';
import UserProfileNotification from '@/components/dashboard/UserProfileNotification';
import { Menu } from 'lucide-react';
import type { Property, PropertyFormData } from '@/components/dashboard/types';
import Navbar from '@/components/layout/Navbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

const PropertyFormPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleAddProperty = (formData: PropertyFormData) => {
    const newProperty: Property = {
      ...formData,
      location: '', // Add default or derive from formData
      surface: '0',   // Add default or derive from formData
    };
    setProperties([...properties, newProperty]);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">

      {/* Sidebar - Slimmer */}
      <AppSidebar />
      <SidebarInset>
        <NavDash />

        {/* Main Content - Much Larger */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen pt-14 lg:pt-0">
          {/* Property Form Section */}
          <div className="flex-1 p-2 lg:p-4 bg-white lg:bg-transparent">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:border-none lg:shadow-none lg:rounded-none">
              <PropertyForm onAdd={handleAddProperty} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
    </SidebarProvider>
  );
};

export default PropertyFormPage;