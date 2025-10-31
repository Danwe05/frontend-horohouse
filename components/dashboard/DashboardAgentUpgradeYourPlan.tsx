'use client';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const DashboardAgentUpgradeYourPlan = () => {
  return (
    <div className="relative bg-[#007AFF] rounded-lg p-6 flex flex-col md:flex-row items-center justify-between overflow-hidden text-white shadow-md w-[470px] max-w-2xl h-[220px]">
      
      {/* Flèche en haut à gauche */}
      <div className="absolute top-3 left-5 bg-white/20 rounded-full p-2">
        <ArrowUpRight className="text-white w-5 h-5" />
      </div>

      {/* Contenu texte */}
      <div className="flex flex-col items-start space-y-8 z-10 mt-8 ">
        <h2 className="text-white text-xl font-semibold leading-snug">
          Upgrade your <br /> plan
        </h2>
        <button className="bg-white text-black font-semibold px-10 py-2 rounded-lg hover:bg-gray-100 transition text-sm">
          Go to pro
        </button>
      </div>

      {/* Badge 3D à droite */}
      <div className="relative mt-4 md:mt-0 w-[110px] h-[150px]">
        <Image
          src="/DashboardAgentUpgradeYourPlan/DashboardAgentUpgradeYourPlanImage.svg"
          alt="Pro Badge"
          fill
          className="object-contain drop-shadow-lg"
        />
      </div>

      {/* Forme grise en bas à gauche */}
      <div className="absolute bottom-0 left-0 w-28 h-16 bg-gray-200 rounded-tr-[100px]" />
    </div>
  );
};

export default DashboardAgentUpgradeYourPlan;
