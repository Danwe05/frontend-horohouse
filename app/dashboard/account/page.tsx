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
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

const AccountPage = () => {
  const userProfile = {
    name: 'Ester Mickael',
    phone: '+234 708 865 6617',
    email: 'Ester33@gmail.com',
    location: 'Nigeria',
    imageUrl: '/TopRealEstate_agent_Image.jpg',
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
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AccountPage;
