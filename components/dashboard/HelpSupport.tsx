"use client";
import React from "react";
import ProfileCompletionCard from "./CompleteYourProfile";
import HelpCard from "./HelpCard";

const HelpSupport = () => {
  const percentage = 89; // pourcentage dynamique

  return (
    <div className="px-10 py-7">
      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative w-[250px] max-w-sm">
          <input
            type="text"
            placeholder="Search"
            className="w-full border border-gray-300 rounded-md py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-blue-600">
          Help & Support
        </h1>
        <p className="text-gray-500 text-lg md:text-[12px] max-w-[140px] font-bold">
          We provide you the best services
        </p>
      </div>

      <div className="flex min-h-screen bg-white">
        {/* Sidebar */}
        <aside className="w-48 p-4 flex flex-col gap-3">
          <button className="bg-[#E9EBFF] text-[#6666A8] font-medium rounded-md px-3 py-2 text-sm">
            Help Center
          </button>
          <button className="text-gray-600 hover:text-[#6666A8] text-sm text-left px-3 py-2">
            Customer Support
          </button>
        </aside>

        {/* Main Content */}
        <main className="pb-6 flex flex-col gap-6 flex-1">
          {/* Help Card */}
          <HelpCard count={12} variant="large" />

          {/* Profile Completion Card */}
          <ProfileCompletionCard percentage={89} variant="large" />
        </main>
      </div>
    </div>
  );
};

export default HelpSupport;
