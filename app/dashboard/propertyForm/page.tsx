'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import PropertyForm from '@/components/dashboard/PropertyForm';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

// Import the PropertyFormData interface from PropertyForm
interface PropertyImage {
  id: string;
  file: File;
  preview: string;
  caption: string;
  category: string;
}

interface PropertyFormData {
  // Basic Information
  title: string;
  description: string;
  type: string;
  listingType: string;
  price: string;
  
  // Property Details
  area: string;
  yearBuilt: string;
  floorNumber: string;
  totalFloors: string;
  pricePerSqm: string;
  depositAmount: string;
  maintenanceFee: string;
  
  // Location
  address: string;
  city: string;
  neighborhood: string;
  country: string;
  latitude: string;
  longitude: string;
  
  // Amenities
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  hasGarden: boolean;
  hasPool: boolean;
  hasGym: boolean;
  hasSecurity: boolean;
  hasElevator: boolean;
  hasBalcony: boolean;
  hasAirConditioning: boolean;
  hasInternet: boolean;
  hasGenerator: boolean;
  furnished: boolean;
  
  // Features
  keywords: string;
  nearbyAmenities: string[];
  transportAccess: string[];
  
  // Media
  images: PropertyImage[];
  floorPlan: File | null;
  floorPlanPreview: string;
  documents: File[];
  virtualTourUrl: string;
  videoUrl: string;
}

const PropertyFormPage = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleAddProperty = (formData: PropertyFormData) => {
    // Handle the property data here if needed
    console.log('Property added:', formData);
    // You can make API calls or other operations here
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          {/* Main Content */}
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