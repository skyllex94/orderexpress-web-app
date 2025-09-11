import React from "react";

export default function DashboardNavbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-6 px-4 sm:px-6 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-[color:var(--oe-border)]">
      <div className="h-14 flex items-center">
        <h1 className="text-base font-semibold text-[var(--oe-black)]">
          {title}
          {subtitle ? (
            <span className="ml-2 text-sm text-gray-600">/ {subtitle}</span>
          ) : null}
        </h1>
      </div>
    </div>
  );
}
