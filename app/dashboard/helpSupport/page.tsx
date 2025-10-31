"use client";
import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import HelpSupport from "@/components/dashboard/HelpSupport";

const HelpSupportPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <Sidebar className="fixed left-0 top-0 h-screen w-60" />

      {/* Conteneur central et colonne droite */}
      <div className="flex flex-1 ml-60">
        {/* Contenu central */}
        <main className="flex-1 bg-white">
          <HelpSupport />
        </main>

        {/* Colonne droite */}
        <aside className="w-90 flex flex-col border-l border-gray-200 bg-white">
          <DashboardHeader />
          <DashboardCalendar />
        </aside>
      </div>
    </div>
  );
};

export default HelpSupportPage;
