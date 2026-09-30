import React from "react";

interface StudioBukuLogoProps {
  className?: string;
  showText?: boolean;
  tagline?: string;
}

export const StudioBukuLogo: React.FC<StudioBukuLogoProps> = ({
  tagline = "Nulis Bareng",
}) => {
  return (
    <div className="flex flex-col select-none">
      <span className="text-lg sm:text-2xl font-black tracking-tight text-white font-sans drop-shadow-sm leading-none">
        Studio Buku
      </span>
      <p className="text-[11px] font-semibold text-amber-200/90 tracking-wide italic mt-1">
        "{tagline}"
      </p>
    </div>
  );
};
