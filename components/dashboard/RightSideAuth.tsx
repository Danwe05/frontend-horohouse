"use client";

export default function PromoSection() {
  return (
    // Right Side - Fixed Promo Section
    <div className="hidden md:flex fixed right-0 top-18 h-screen w-1/2 bg-blue-500 text-white flex-col justify-center items-center p-30 bg-[url('/signUp/bg-image1.png')] bg-no-repeat bg-[length:280px_280px]">
      
      {/* Image décorative en bas à droite */}
      <div className="absolute bottom-12 -right-3 w-[280px] h-[280px] bg-[url('/signUp/bg-image2.png')] bg-no-repeat bg-contain"></div>

      {/* Contenu texte */}
      <div className="max-w-md">
        <h2 className="text-3xl font-semibold mb-10">
          Join the Premier Real Estate Community
        </h2>
        <p className="text-[15px] leading-loose">
          Sign up today to explore exclusive listings, connect with top agents,
          and find your perfect African home. Become part of HoroHouse and
          unlock a world of property opportunities !
        </p>
      </div>
    </div>
  );
}
