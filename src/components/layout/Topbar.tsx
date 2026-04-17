"use client";

import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-20">
      <div />
      <div className="flex items-center gap-4">
        {user && (
          <>
            <Badge variant="default">{ROLE_LABELS[user.role as Role]}</Badge>
            <div className="flex items-center gap-2.5">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
