'use client';
import React from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import ProfileCard from '@/components/dashboard/ProfileCard';
import AccountExploreNew from '@/components/dashboard/AccountExploreNew';
import DreamHomeBanner from '@/components/dashboard/DreamHomeBanner';
import HelpCard from '@/components/dashboard/HelpCard';
import ProfileCompletionCard from '@/components/dashboard/CompleteYourProfile';
import UserProfileNotification from '@/components/dashboard/UserProfileNotification';

const AccountPage = () => {
  const userProfile = {
    name: 'Ester Mickael',
    phone: '+234 708 865 6617',
    email: 'Ester33@gmail.com',
    location: 'Nigeria',
    imageUrl: '/TopRealEstate_agent_Image.jpg',
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <AppSidebar />

      {/* Partie au centre de la page */}
      <div className="ml-60 flex-1 flex flex-col bg-white pb-10 space-y-6">
        <ProfileCard
          name={userProfile.name}
          phone={userProfile.phone}
          email={userProfile.email}
          location={userProfile.location}
          imageUrl={userProfile.imageUrl}
        />
        <AccountExploreNew />

        <div className="flex flex-row gap-4 p-4">
          <div className="flex flex-col gap-4">
            {/* ✅ On passe les props attendus */}
            <ProfileCompletionCard percentage={60} variant="small" />
            <DreamHomeBanner />
          </div>

          <div className="w-1/2">
            {/* On passe les props obligatoires de HelpCard */}
            <HelpCard count={12} variant="small" />
          </div>
        </div>

      </div>

      {/* Partie droite */}
      <div className="flex flex-col border-l-2 border-[#F0F0F0]">
        <UserProfileNotification />
        <DashboardCalendar />
      </div>
    </div>
  );
};

export default AccountPage;
