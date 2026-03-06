"use client";
import React from "react";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NavDash } from "@/components/dashboard/NavDash";
import RecentlyViewedWidget from "@/components/dashboard/RecentlyViewedWidget";

const RecentlyViewedPage = () => {
  return (

    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 min-h-screen pt-3 lg:pt-3">
            <RecentlyViewedWidget/>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>

  );
};

export default RecentlyViewedPage;
