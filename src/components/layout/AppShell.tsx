"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <Topbar />
      <main className="ml-56 pt-14">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
