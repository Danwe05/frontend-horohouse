"use client";
import React from "react";
import Image from "next/image";

interface ProfileCompletionCardProps {
  avatar?: string;
  percentage: number;
  variant?: "large" | "small"; // 👈 nouvelle prop
}

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  avatar,
  percentage,
  variant = "large", // par défaut "large"
}) => {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${(percentage / 100) * circumference}, ${circumference}`;

  // Styles dynamiques selon variant
  const avatarSize = variant === "small" ? 36 : 50;
  const progressSize = variant === "small" ? "w-14 h-14" : "w-20 h-20";
  const titleSize = variant === "small" ? "text-sm" : "text-md";
  const descSize = variant === "small" ? "text-[10px]" : "text-xs";
  const buttonSize =
    variant === "small"
      ? "text-[10px] px-4 py-1"
      : "text-xs px-8 py-1.5";

  return (
    <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-4 flex items-center justify-between">
      {/* Avatar + Texte */}
      <div className="flex gap-4">
        <Image
          src={"/TopRealEstate_agent_Image.jpg"}
          alt="User"
          width={avatarSize}
          height={avatarSize}
          className="rounded-full object-cover h-12 w-12"
        />
        <div className="space-y-2">
          <h3 className={`font-semibold text-gray-800 ${titleSize}`}>
            Complete Your Profile
          </h3>
          <p className={`${descSize} text-gray-500 max-w-[140px] leading-relaxed`}>
            Add more info to get the best experience
          </p>
          <button
            className={`mt-2 bg-[#2B95F6] text-white rounded-md hover:bg-[#0052cc] transition ${buttonSize}`}
          >
            Complete Now
          </button>
        </div>
      </div>

      {/* Circular progress */}
      <div className={`flex items-center justify-center relative ${progressSize}`}>
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            className="text-gray-200"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-[#2B95F6]"
            strokeDasharray={dashArray}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            stroke="currentColor"
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span
          className={`absolute font-bold text-[#2B95F6] ${
            variant === "small" ? "text-sm" : "text-lg"
          }`}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export default ProfileCompletionCard;
