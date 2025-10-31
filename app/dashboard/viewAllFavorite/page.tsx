'use client';
import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SavedProperties from '@/components/dashboard/SavedProperties';
import DashboardActivity from '@/components/dashboard/DashboardActivity';

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <Sidebar className="fixed left-0 top-0 h-screen w-60" />

      {/* Contenu collé à droite de la sidebar */}
      <div className="ml-60 flex-1 flex flex-col bg-white">
        {/* Passer les propriétés à SavedProperties */}
        <SavedProperties properties={properties.map(p => ({
          image: p.image,
          title: `${p.type} - ${p.status}`,
          price: p.price,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          area: p.area,
          location: p.location,
        }))} />   
      </div>

      {/* Header ou autre section */}
      <div className=" flex flex-col border-l-2 border-[#F0F0F0]">
        <DashboardHeader />
        <DashboardActivity />
      </div>
    </div>
  );
};

export default DashboardPage;
