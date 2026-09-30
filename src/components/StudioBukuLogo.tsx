import React from "react";

interface StudioBukuLogoProps {
  className?: string;
  showText?: boolean;
  tagline?: string;
  size?: "sm" | "md" | "lg";
}

export const StudioBukuLogo: React.FC<StudioBukuLogoProps> = ({
  tagline = "Nulis Buku Bareng",
  size = "md"
}) => {
  return (
    <div className="flex items-center space-x-3 select-none">
      <img
        src="/studio-buku-logo-box-100.jpg"
        alt="Studio Buku"
        className={`${
          size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-11 h-11"
        } rounded-xl shadow-md border border-amber-400/40 object-cover`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/studio-buku-logo.jpg";
        }}
      />
      <div className="flex flex-col text-left">
        <span className={`${
          size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl"
        } font-black tracking-tight text-white font-sans leading-none`}>
          Studio Buku
        </span>
        {tagline && (
          <p className="text-[11px] font-semibold text-amber-200/90 tracking-wide italic mt-0.5">
            "{tagline}"
          </p>
        )}
      </div>
    </div>
  );
};
