"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar />
      <Topbar />
      <main className="ml-[220px] pt-14">
        <div className="p-6 page-enter">{children}</div>
      </main>
    </div>
  );
}
