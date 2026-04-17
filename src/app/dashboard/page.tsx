"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FloorSelector } from "@/components/dashboard/FloorSelector";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { OccupancySummary } from "@/components/dashboard/OccupancySummary";
import { useDebounce } from "@/hooks/useDebounce";
import type { RoomWithPatient } from "@/types/domain";

interface Floor {
  number: number;
  name: string;
}

interface Ward {
  code: string;
  name: string;
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<RoomWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  // Derive floors and wards from room data
  const [floors, setFloors] = useState<Floor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedFloor !== null) params.set("floor", String(selectedFloor));
    if (wardFilter) params.set("ward", wardFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const res = await fetch(`/api/rooms?${params}`);
      if (res.ok) {
        const json = await res.json();
        setRooms(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedFloor, wardFilter, statusFilter, debouncedSearch]);

  // Initial load to get all rooms for floor/ward derivation
  useEffect(() => {
    async function loadAll() {
      try {
        const res = await fetch("/api/rooms");
        if (res.ok) {
          const json = await res.json();
          const allRooms: RoomWithPatient[] = json.data;

          // Extract unique floors
          const floorMap = new Map<number, string>();
          allRooms.forEach((r) => floorMap.set(r.floor.number, r.floor.name));
          setFloors(
            Array.from(floorMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([number, name]) => ({ number, name }))
          );

          // Extract unique wards
          const wardMap = new Map<string, string>();
          allRooms.forEach((r) => wardMap.set(r.ward.code, r.ward.name));
          setWards(Array.from(wardMap.entries()).map(([code, name]) => ({ code, name })));
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    }
    loadAll();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Ward Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time room occupancy and patient status</p>
        </div>

        {/* Summary stats */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-card px-6 py-4">
          <OccupancySummary rooms={rooms} />
        </div>

        {/* Floor selector + filters */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <FloorSelector
            floors={floors}
            selectedFloor={selectedFloor}
            onSelect={setSelectedFloor}
          />
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            wardFilter={wardFilter}
            onWardChange={setWardFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            wards={wards}
          />
        </div>

        {/* Room grid */}
        <RoomGrid rooms={rooms} loading={loading} />
      </div>
    </AppShell>
  );
}
