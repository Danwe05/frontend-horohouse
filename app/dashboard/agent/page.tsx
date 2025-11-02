'use client';
import React from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import AgentsGrid from '@/components/dashboard/AgentGrid';
import AgentCard from '@/components/dashboard/AgentCard';

const AgentPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <AppSidebar />

      {/* Conteneur central et partie droite */}
      <div className="flex-1 p-2 lg:p-4 bg-white lg:bg-transparent"> 
        {/* Contenu central */}
        <div className=" bg-white ">
          <AgentCard name={''} username={''} role={''} tasks={0} completion={0} imageUrl={''} age={0} gender={''} city={''} state={''} country={''} rent={0} />
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
