'use client';
import React from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import AgentCardGrid from '@/components/dashboard/AgentGrid';

const AgentPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <AppSidebar />

      {/* Conteneur central et partie droite */}
      <div className="flex-1 p-2 lg:p-4 bg-white lg:bg-transparent"> 
        {/* Contenu central */}
        <div className="bg-white">
          <AgentCardGrid />
        </div>
      </div>
    </div>
  );
};

export default AgentPage;