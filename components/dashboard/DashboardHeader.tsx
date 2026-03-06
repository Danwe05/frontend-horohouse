'use client';
import React from 'react';
import UserProfileNotification from './UserProfileNotification';
import DreamHomeBanner from './DreamHomeBanner';

const DashboardHeader = () => {
  return (
    <div className="space-y-6 max-w-90 bg-white" style={{ borderColor: '#F0F0F0' }}>
      <UserProfileNotification />
      <div className='p-4'>
        <DreamHomeBanner />
      </div>
    </div>
  );
};

export default DashboardHeader;
