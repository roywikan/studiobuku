import React, { useState } from "react";
import { BookOpen } from "lucide-react";

interface StudioBukuLogoProps {
  className?: string;
  showText?: boolean;
  tagline?: string;
  size?: "sm" | "md" | "lg";
  alwaysShowText?: boolean;
  variant?: "dark" | "light";
}

export const StudioBukuLogo: React.FC<StudioBukuLogoProps> = ({
  tagline = "Platform Penulisan & Co-Authorship",
  size = "md",
  alwaysShowText = false,
  variant = "dark"
}) => {
  const [imgError, setImgError] = useState(false);

  const iconSizes = {
    sm: "w-7 h-7 p-1.5",
    md: "w-9 h-9 p-2",
    lg: "w-11 h-11 p-2.5"
  }[size];

  const textSizes = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-2xl"
  }[size];

  const textColor = variant === "light" ? "text-slate-900" : "text-white";
  const taglineColor = variant === "light" ? "text-amber-800" : "text-amber-300/90";

  const logoSrc = size === "sm" 
    ? "/studio-buku-logo-box-40-42.jpg" 
    : size === "lg" 
    ? "/studio-buku-logo-box.jpg" 
    : "/studio-buku-logo-box-100.jpg";

  return (
    <div className="flex items-center space-x-2.5 select-none shrink-0 group cursor-pointer">
      {!imgError ? (
        <img
          src={logoSrc}
          alt="Studio Buku"
          className={`${
            size === "sm" ? "w-7 h-7" : size === "lg" ? "w-11 h-11" : "w-9 h-9"
          } rounded-xl shadow-sm border border-amber-400/50 object-cover shrink-0 bg-slate-900`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`${iconSizes} rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md flex items-center justify-center shrink-0 border border-amber-300`}>
          <BookOpen className="w-full h-full stroke-[2.5]" />
        </div>
      )}

      <div className={`${alwaysShowText ? "flex" : "hidden sm:flex"} flex-col text-left`}>
        <span className={`${textSizes} font-black tracking-tight ${textColor} font-sans leading-none whitespace-nowrap`}>
          Studio Buku
        </span>
        {tagline && (
          <span className={`text-[10px] font-bold ${taglineColor} tracking-wide mt-1 whitespace-nowrap`}>
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};
