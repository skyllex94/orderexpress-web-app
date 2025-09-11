// React import not required with modern JSX transform
import type { ReactNode } from "react";

export default function DashboardNavbar({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle?: string | null;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-6 px-4 sm:px-6 bg-gradient-to-b from-[#0f1114] to-[#15181c] text-white border-b border-[color:var(--oe-border)]">
      <div className="h-16 flex items-center justify-between gap-4 pl-12 md:pl-0">
        <h1 className="text-base font-semibold text-white">
          {title}
          {subtitle ? (
            <span className="ml-2 text-sm text-gray-300">/ {subtitle}</span>
          ) : null}
        </h1>
        {extra ? <div className="flex items-center">{extra}</div> : null}
      </div>
    </div>
  );
}
