"use client";
import React from "react";
import NavbarPropertyList from "@/components/dashboard/NavbarPropertyList";
import PeopertyListCards from "@/components/dashboard/PropertyListCards";
import MapComponent from "@/components/dashboard/Maps";
import PropertyListFilters from "@/components/dashboard/PropertyListFilters";

const DashboardPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar en haut */}
      <NavbarPropertyList />

      {/* Contenu principal : map à gauche, liste à droite */}
      <div className="flex flex-1 flex-row ">
        {/* Map à gauche (plus petite) */}
        <div className="flex-1 py-4 pl-4 pr-1">
          <MapComponent />
        </div>

        {/* Liste des propriétés à droite (plus large) */}
        <div className="flex-[1.5] flex flex-col gap-4 h-full overflow-auto">
          <PeopertyListCards />
          {/* Ajouter plus de cartes selon besoin */}
        </div>

        {/* Filtres à droite */}
        <div className="w-[230px]">
          <PropertyListFilters />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
