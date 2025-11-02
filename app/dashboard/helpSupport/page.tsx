"use client";
import React from "react";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import HelpSupport from "@/components/dashboard/HelpSupport";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NavDash } from "@/components/dashboard/NavDash";

const HelpSupportPage = () => {
  return (

    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <NavDash />

          <div className="flex-1 min-h-screen pt-14 px-6 lg:pt-0">
            <HelpSupport />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>

  );
};

export default HelpSupportPage;
