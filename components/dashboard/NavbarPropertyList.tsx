"use client";
import React from "react";
import { Bell } from "lucide-react";

const NavbarPropertyList = () => {
  return (
    <nav className="w-full bg-white border border-gray-400 px-7 py-4 flex items-center justify-between gap-14">
      {/* Logo */}
      <div className="flex items-center gap-1">
        <img
          src="/logo_bleu.svg"
          alt="Logo"
          className="w-9 h-9 object-contain"
        />
        <span className="text-[#0089F7] font-bold text-lg">HoroHouse</span>
      </div>

      {/* Search Bar */}
      <div className="flex-1 mx-6">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search"
            className="w-full border border-gray-400 rounded-lg py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 placeholder:font-bold"
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

      {/* Links */}
      <div className="hidden md:flex items-center gap-10 text-black">
        <a href="#" className="hover:text-blue-600 font-semibold text-sm">Buy</a>
        <a href="#" className="hover:text-blue-600 font-semibold text-sm">Sell</a>
        <a href="#" className="hover:text-blue-600 font-semibold text-sm">Rent</a>
        <a href="#" className="hover:text-blue-600 font-semibold text-sm">Contact</a>
      </div>

      {/* Notifications + Sign Up */}
      <div className="flex items-center gap-17 ml-6">
        <button className="relative p-2 text-gray-600 hover:text-blue-600 cursor-pointer">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>
        <button className="bg-[#0089F7] text-white px-4 py-3 rounded-lg text-xs hover:bg-blue-600 transition cursor-pointer">
          Sign Up
        </button>
      </div>
    </nav>
  );
};

export default NavbarPropertyList;
