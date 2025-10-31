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
  const imageSize = variant === "small" ? "w-26 h-26" : "w-55 h-55";
  const subtitleSize = variant === "small" ? "text-[8px]" : "text-sm";
  const marginBottom = variant === "small" ? "mb-3" : "mb-12"

  return (
    <div className="bg-white rounded-xl border border-gray-500 flex flex-col">
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
      <div className="flex flex-col border-t border-gray-300 bg-[#F3F6FF] rounded-xl">
        <div className="flex justify-center">
          <img
            src="/HelpSupport/helpSupport_image2.svg"
            className={`${imageSize}`}
            alt="Organize"
          />
        </div>
        <div className={`flex flex-col items-start mx-6 ${marginBottom}`}>
          <h3 className={`font-semibold text-gray-800 ${titleSize}`}>
            Stay organize
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
