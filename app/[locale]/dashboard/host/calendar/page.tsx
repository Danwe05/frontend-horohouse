'use client';

import { AppSidebar } from '@/components/dashboard/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';
import HostBookingCalendar from '@/components/dashboard/HostBookingCalendar';

export default function HostCalendarPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white text-[#222222]">
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <HostBookingCalendar />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
