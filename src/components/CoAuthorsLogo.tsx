import React from "react";
import { StudioBukuLogo } from "./StudioBukuLogo";

export const CoAuthorsLogo: React.FC<{ className?: string; showText?: boolean; tagline?: string }> = (props) => {
  return <StudioBukuLogo {...props} />;
};
