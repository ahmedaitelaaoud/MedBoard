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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl shadow-card p-4 min-h-[120px] animate-pulse">
            <div className="flex justify-between mb-3">
              <div className="w-12 h-4 bg-gray-100 rounded" />
              <div className="w-16 h-5 bg-gray-100 rounded" />
            </div>
            <div className="mt-auto">
              <div className="w-28 h-4 bg-gray-100 rounded" />
              <div className="w-20 h-3 bg-gray-50 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No rooms match your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
