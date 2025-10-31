import React from "react";

interface CircularProgressProps {
  completion: number; // 0 à 100
  size?: number; // largeur/hauteur du cercle
  color?: string; // couleur du cercle rempli
  bgColor?: string; // couleur du cercle de fond
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  completion,
  size = 40,
  color = "#6666A8",
  bgColor = "#e5e7eb",
}) => {
  return (
    <div
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${completion * 3.6}deg, ${bgColor} 0deg)`,
      }}
    >
     
    </div>
  );
};

export default CircularProgress;
