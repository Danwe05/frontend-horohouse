'use client';
import React from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import NotificationDropdown  from '@/components/notifications/NotificationDropdown';

const UserProfileNotification = () => {

  const handleNotificationClick = () => {
    console.log('Notifications opened!');
  };

  return (
    <div className="flex justify-between items-center bg-white ">
      {/* Notification Dropdown */}
      <div className="mx-6 mt-6">
        <NotificationDropdown />
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-2 bg-blue-50 p-4 rounded-lg shadow mx-7 mt-7">
        <img
          src="/TopRealEstate_agent_Image.jpg"
          alt="User"
          className="w-8 h-8 rounded-sm object-cover"
        />
        <div className="text-sm">
          <p className="font-medium text-black text-xs">Ester Mickael</p>
          <p className="text-xs text-blue-500">Ester33@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfileNotification;
