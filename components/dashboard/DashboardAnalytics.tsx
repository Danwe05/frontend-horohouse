'use client';
import React from 'react';
import { AiOutlineBuild } from 'react-icons/ai'; 
import { FiTrendingDown } from 'react-icons/fi';
import UserProfileNotification from './UserProfileNotification';

interface StatCardProps {
  title: string;
  value: number;
  percentage: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, percentage }) => {
  return (
    <div className="bg-white rounded-xl card border border-gray-100 w-44 flex flex-col justify-between hover:shadow-md transition-shadow flex-shrink-0">
      <div className="flex items-center gap-2 text-gray-700">
        <AiOutlineBuild className="text-gray-600" size={18} />
        <span className="text-sm font-medium">{title}</span>
      </div>

      <div className="mt-3 text-2xl font-semibold text-gray-900">{value}</div>

      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
        <FiTrendingDown className="text-red-500" size={12} />
        <span className="text-red-500 font-semibold">{percentage}%</span>
        <span>Compared to last month</span>
      </div>
    </div>
  );
};

const DashboardAnalytics: React.FC = () => {
  const stats = [
    { title: 'Total Listing', value: 60, percentage: 8 },
    { title: 'Total impression', value: 60, percentage: 8 },
    { title: 'Total clicks', value: 56, percentage: 10 },
    { title: 'Total save', value: 40, percentage: 7 },
    { title: 'Total like', value: 65, percentage: 26 },
  ];

  return (
    <div>
      {/* Search Bar + UserProfileNotification aligned */}
      <div className="mb-5 flex items-center w-full max-w-full">
        {/* Input search */}
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

        {/* UserProfileNotification aligné à l’extrémité droite */}
        <div className="flex-1 flex justify-end">
          <UserProfileNotification />
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-black">Dashboard Analytics</h2>

      {/* Container pour aligner toutes les cards horizontalement */}
      <div className="flex gap-5 overflow-x-auto p-2">
        {stats.map((item, index) => (
          <StatCard
            key={index}
            title={item.title}
            value={item.value}
            percentage={item.percentage}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardAnalytics;
