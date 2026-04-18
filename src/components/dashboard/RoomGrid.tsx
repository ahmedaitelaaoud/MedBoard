"use client";

import { RoomCard } from "./RoomCard";
import type { RoomWithPatient } from "@/types/domain";

interface RoomGridProps {
  rooms: RoomWithPatient[];
  loading?: boolean;
}

export function RoomGrid({ rooms, loading }: RoomGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[140px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl animate-pulse">
            <div className="px-4 py-3.5 space-y-3">
              <div className="flex justify-between">
                <div className="w-16 h-3 bg-gray-100 dark:bg-slate-800 rounded" />
                <div className="w-12 h-4 bg-gray-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full" />
                <div className="space-y-1.5">
                  <div className="w-24 h-3.5 bg-gray-100 dark:bg-slate-800 rounded" />
                  <div className="w-16 h-2.5 bg-gray-50 dark:bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-400 dark:text-slate-400">Aucune chambre ne correspond aux filtres</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map((room, i) => (
        <div key={room.id} className="card-enter" style={{ animationDelay: `${i * 30}ms` }}>
          <RoomCard room={room} />
        </div>
      ))}
    </div>
  );
}
