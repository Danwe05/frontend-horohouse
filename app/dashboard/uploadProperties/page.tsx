'use client'; // <-- obligatoire pour les hooks comme useState

import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import UserProfileNotification from '@/components/dashboard/UserProfileNotification';
import type { Property } from '@/components/dashboard/types';
import UploadProperties from '@/components/dashboard/UploadProperties';

const PropertyFormPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);

  const handleAddProperty = (property: Property) => {
    setProperties([...properties, property]);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar className="fixed left-0 top-0 h-screen w-60" />

      <div className="ml-60 flex-1 flex flex-col bg-white pb-10">
        <UploadProperties  />

        <div className="mt-6 flex flex-wrap gap-4">
          {properties.map((prop, index) => (
            <div key={index} className="bg-white shadow rounded p-4 w-72">
              <h3 className="font-bold">{prop.title}</h3>
              <p>{prop.location}</p>
              <p>{prop.price}</p>
            </div>
          ))}
        </div>
      </div>

      <div className=" flex flex-col border-l-2 border-[#F0F0F0]">
        <UserProfileNotification />
        <DashboardCalendar />
      </div>
    </div>
  );
};

export default PropertyFormPage;
