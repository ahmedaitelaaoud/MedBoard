"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/activity": "Activity Log",
  "/staff": "Staff Directory",
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path)) return title;
  }
  return "";
}

export function Topbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="fixed top-0 left-[220px] right-0 h-14 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-3">
        {pageTitle && (
          <h2 className="text-sm font-medium text-gray-500">{pageTitle}</h2>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <Badge variant="default" className="text-2xs">
            {ROLE_LABELS[user.role as Role]}
          </Badge>
        )}
      </div>
    </header>
  );
}
