import React from "react";

interface StudioBukuLogoProps {
  className?: string;
  showText?: boolean;
  tagline?: string;
  size?: "sm" | "md" | "lg";
  alwaysShowText?: boolean;
}

export const StudioBukuLogo: React.FC<StudioBukuLogoProps> = ({
  tagline = "Nulis Buku Bareng",
  size = "md",
  alwaysShowText = false
}) => {
  return (
    <div className="flex items-center space-x-2.5 select-none shrink-0">
      <img
        src="/studio-buku-logo-box-100.jpg"
        alt="Studio Buku"
        className={`${
          size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10 lg:w-11 lg:h-11"
        } rounded-xl shadow-md border border-amber-400/40 object-cover shrink-0`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/studio-buku-logo.jpg";
        }}
      />
      <div className={`${alwaysShowText ? "flex" : "hidden lg:flex"} flex-col text-left`}>
        <span className={`${
          size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl"
        } font-black tracking-tight text-white font-sans leading-none whitespace-nowrap`}>
          Studio Buku
        </span>
        {tagline && (
          <p className="text-[11px] font-semibold text-amber-200/90 tracking-wide italic mt-0.5 whitespace-nowrap">
            "{tagline}"
          </p>
        )}
      </div>
    </div>
  );
};
