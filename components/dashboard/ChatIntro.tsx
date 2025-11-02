import React from "react";
import Image from "next/image";

export default function ChatIntro() {
  return (
    <div className="relative flex flex-col items-center justify-center flex-1 p-6">
      {/* Cercle flou bleu subtil derrière l'image */}
      <div className="absolute w-64 h-64 sm:w-80 sm:h-80 md:w-55 md:h-55 bg-blue-900 opacity-30 rounded-full filter blur-2xl top-35 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>

      <Image
        src="/messagePage/chatIntroImage.png"
        alt="Chat Illustration"
        width={220}
        height={220}
        className="relative z-10"
      />

      <h2 className="text-lg font-semibold text-blue-600 mb-1 relative z-10">
        Chat with HoroHouse
      </h2>

      <p className="text-gray-500 text-sm mb-6 text-center relative z-10">
        Connect Instantly, Find Your Perfect Home
      </p>

      <button className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition relative z-10 cursor-pointer">
        New Message
      </button>
    </div>
  );
}
