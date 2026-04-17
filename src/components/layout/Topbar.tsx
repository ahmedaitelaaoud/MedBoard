"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/activity": "Activity Log",
  "/chat": "Team Chat",
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
  const { theme, toggleTheme, mounted } = useTheme();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="fixed top-0 left-[220px] right-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 z-20 transition-colors duration-200">
      <div className="flex items-center gap-3">
        {pageTitle && (
          <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400">{pageTitle}</h2>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          title="Toggle night mode"
          aria-label="Toggle night mode"
        >
          {!mounted || theme === "light" ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1.5m0 15V21m9-9h-1.5m-15 0H3m15.364 6.364l-1.06-1.06M6.697 6.697l-1.06-1.06m12.727 0l-1.06 1.06M6.697 17.303l-1.06 1.06M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            </svg>
          )}
          <span>{!mounted ? "Theme" : theme === "dark" ? "Night" : "Day"}</span>
        </button>
        {user && (
          <Badge variant="default" className="text-2xs">
            {ROLE_LABELS[user.role as Role]}
          </Badge>
        )}
      </div>
    </header>
  );
}
