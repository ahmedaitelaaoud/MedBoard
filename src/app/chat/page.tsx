"use client";

import { AppShell } from "@/components/layout/AppShell";
import { DirectChat } from "@/components/chat/DirectChat";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/lib/constants";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const isAllowed = user?.role === Role.DOCTOR || user?.role === Role.NURSE;

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Team Chat</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Direct messaging between nurses and doctors
          </p>
        </div>

        {loading || !user ? (
          <div className="h-[480px] rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
        ) : !isAllowed ? (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
            <p className="text-sm text-gray-500 dark:text-slate-400">Chat access is available for doctors and nurses only.</p>
          </div>
        ) : (
          <DirectChat user={user} />
        )}
      </div>
    </AppShell>
  );
}
