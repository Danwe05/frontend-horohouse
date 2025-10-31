
import { div } from "framer-motion/m";
import React from "react";

const WavyLine = () => (
  <svg
    className="absolute top-0 left-0 w-full h-full text-white opacity-20"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    viewBox="0 0 1440 320"
  >
    <path
      fill="currentColor"
      d="M0,64L48,85.3C96,107,192,149,288,176C384,203,480,213,576,192C672,171,768,117,864,117.3C960,117,1056,171,1152,170.7C1248,171,1344,117,1392,90.7L1440,64L1440,320L0,320Z"
    ></path>
  </svg>
);

const AccountExploreNew = () => {
  return (
    <div className="px-4">
        <div className="relative bg-blue-500 rounded-lg py-8 px-10 md:px-6 flex flex-col md:flex-row items-center text-white overflow-hidden">
      {/* Ligne ondulée */}
      <WavyLine />

      <div className="flex flex-col gap-12">
        <h2 className="text-lg md:text-xl font-semibold mb-2 max-w-[220px]">
          Get Yourself In Big Discount On This Sale
        </h2>
        <button className="bg-white text-blue-500 px-10 py-2 rounded-md font-bold hover:bg-gray-100 transition">
          Explore new
        </button>
      </div>
    </div>
    </div>
  );
};

export default AccountExploreNew;
