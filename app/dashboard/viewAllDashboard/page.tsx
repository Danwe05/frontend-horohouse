'use client';
import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import ViewAllDashboard from '@/components/dashboard/ViewAllDashboard';

const DashboardPage = () => {
  const properties = [
    {
      image: '/TopRealEstate_Image.png',
      type: 'Apartment',
      status: 'For Sale',
      price: '$200,000',
      bedrooms: 3,
      location: 'Douala, Cameroon',
      area: '120 m²',
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
      location: 'Yaoundé, Cameroon',
      area: '200 m²',
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
      location: 'Yaoundé, Cameroon',
      area: '200 m²',
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
      location: 'Yaoundé, Cameroon',
      area: '200 m²',
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
      location: 'Yaoundé, Cameroon',
      area: '200 m²',
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
      location: 'Yaoundé, Cameroon',
      area: '200 m²',
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
      location: 'Yaoundé, Cameroon',
      area: '200 m²',
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
      location: 'Yaoundé, Cameroon',
      area: '200 m²',
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
      location: 'Yaoundé, Cameroon',
      area: '200 m²',
      agentName: 'Jane Smith',
      agentRole: 'Estate Agent',
      agentPhoto: '/TopRealEstate_agent_Image.jpg',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <Sidebar className="fixed left-0 top-0 h-screen w-60" />

      {/* Partie au centre de la page */}
      <div className="ml-60 flex-1 flex flex-col bg-white pb-10">
        <ViewAllDashboard properties={properties} />
        
      </div>
      {/* Partie droite */}
      <div className="flex flex flex-col border-l-2 border-[#F0F0F0]">
        <DashboardHeader/>
        <DashboardCalendar/>
      </div>
      
    </div>
  );
};

export default DashboardPage;
