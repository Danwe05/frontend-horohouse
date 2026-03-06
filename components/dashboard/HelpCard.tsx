import React from "react";

interface HelpCardProps {
  count: number | string;
  variant?: "large" | "small"; 
}

const HelpCard: React.FC<HelpCardProps> = ({ count, variant = "large" }) => {
  // Styles dynamiques selon variant
  const titleSize = variant === "small" ? "text-xs" : "text-md";
  const descSize = variant === "small" ? "text-[8px]" : "text-xs";
  const countSize = variant === "small" ? "text-md" : "text-2xl";
  const imageSize = variant === "small" ? "w-28 h-28" : "w-56 h-56";
  const subtitleSize = variant === "small" ? "text-[8px]" : "text-sm";
  const marginBottom = variant === "small" ? "mb-3" : "mb-12"

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Section 1 */}
      <div className="flex justify-between items-start">
        <div className="my-4 mx-6">
          <h2 className={`font-semibold text-gray-800 ${titleSize}`}>
            Collaborate and share
          </h2>
          <p className={`${descSize} text-gray-500`}>
            Share with friends and family
          </p>
        </div>
        <span className={`${countSize} font-bold text-[#0066FF] my-4 mx-6`}>
          {count}
        </span>
      </div>

      {/* Image globe */}
      <div className="flex justify-center">
        <img
          src="/HelpSupport/helpSupport_image1.svg"
          alt="Illustration"
          className={`${imageSize}`}
        />
      </div>

      {/* Section 2 */}
      <div className="flex flex-col border-t border-slate-200 bg-slate-50">
        <div className="flex justify-center">
          <img
            src="/HelpSupport/helpSupport_image2.svg"
            className={`${imageSize}`}
            alt="Organize"
          />
        </div>
        <div className={`flex flex-col items-start mx-6 ${marginBottom}`}>
          <h3 className={`font-semibold text-gray-800 ${titleSize}`}>
            Stay organized
          </h3>
          <p className={`${subtitleSize} text-gray-500`}>
            Arrange your task in order
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpCard;
