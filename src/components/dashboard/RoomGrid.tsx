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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6 animate-pulse">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-full h-[130px] bg-gray-200 rounded-xl" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
