'use client';
import React from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import Favorite from '@/components/dashboard/Favorite';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

const DashboardPage = () => {
  const properties = [
    {
      image: '/TopRealEstate_Image.png',
      type: 'Apartment',
      status: 'For Sale',
      price: '$200,000',
      bedrooms: 3,
      bathrooms: 2,
      area: '120 m²',
      location: 'Douala, Cameroon',
      agentName: 'John Doe',
      agentRole: 'Estate Agent',
      agentPhoto: '/TopRealEstate_agent_Image.jpg',
    },
    {
      image: '/TopRealEstate_Image.png',
      type: 'House',
      status: 'For Rent',
      price: '$1,200/mo',
      bedrooms: 4,
      bathrooms: 3,
      area: '200 m²',
      location: 'Yaoundé, Cameroon',
      agentName: 'Jane Smith',
      agentRole: 'Estate Agent',
      agentPhoto: '/TopRealEstate_agent_Image.jpg',
    },
    {
      image: '/TopRealEstate_Image.png',
      type: 'House',
      status: 'For Rent',
      price: '$1,200/mo',
      bedrooms: 4,
      bathrooms: 3,
      area: '200 m²',
      location: 'Yaoundé, Cameroon',
      agentName: 'Jane Smith',
      agentRole: 'Estate Agent',
      agentPhoto: '/TopRealEstate_agent_Image.jpg',
    },
    {
      image: '/TopRealEstate_Image.png',
      type: 'House',
      status: 'For Rent',
      price: '$1,200/mo',
      bedrooms: 4,
      bathrooms: 3,
      area: '200 m²',
      location: 'Yaoundé, Cameroon',
      agentName: 'Jane Smith',
      agentRole: 'Estate Agent',
      agentPhoto: '/TopRealEstate_agent_Image.jpg',
    },
  ];

  return (

    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 min-h-screen pt-14 px-6 lg:pt-0">
            <Favorite />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardPage;
