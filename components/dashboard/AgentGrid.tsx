'use client';
import React from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import DashboardCalendar from './DashboardCalendar';
import AgentCard from './AgentCard';

const AgentPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <Sidebar className="fixed left-0 top-0 h-screen w-60" />

      {/* Conteneur central et partie droite */}
      <div className="flex flex-1 ml-60"> {/* ml-60 pour laisser la place au sidebar */}
        <div className="flex-1 flex justify-center items-start bg-white mr-4">
          <AgentCard name={''} username={''} role={''} tasks={0} completion={0} imageUrl={''} age={0} gender={''} city={''} state={''} country={''} rent={0} />
        </div>

        {/* Partie droite */}
        <div className="w-80 flex flex-col border-l-2 border-[#F0F0F0]">
          <DashboardHeader />
          <div className="mt-4"> {/* petit espace avant le calendrier */}
            <DashboardCalendar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
