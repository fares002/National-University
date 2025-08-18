import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type LoadingProps = {
  labelKey?: string; // i18n key
  label?: string; // explicit label overrides labelKey
  minHeight?: number | string; // e.g., 400 or "50vh"
  size?: "sm" | "md" | "lg"; // spinner size
};

export default function Loading({
  labelKey = "loading",
  label,
  minHeight = 400,
  size = "md",
}: LoadingProps) {
  const { t } = useTranslation();
  const msg = label ?? t(labelKey);

  const sizeClass =
    size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const minH = typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: minH }}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className={`${sizeClass} animate-spin `} />
        <span>{msg}</span>
      </div>
    </div>
  );
}
