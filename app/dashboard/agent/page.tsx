'use client';
import React from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import AgentCardGrid from '@/components/dashboard/AgentCard';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

const AgentPage = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar fixe à gauche */}
        <AppSidebar />
        <SidebarInset>
          <NavDash />
          {/* Conteneur central et partie droite */}
          <div className="flex-1 p-2 lg:p-4 bg-white lg:bg-transparent">
            {/* Contenu central */}
            <div className="bg-white">
              <AgentCardGrid />
            </div>
          </div>
          </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AgentPage;