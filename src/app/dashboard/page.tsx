"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FloorSelector } from "@/components/dashboard/FloorSelector";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { OccupancySummary } from "@/components/dashboard/OccupancySummary";
import { DoctorHome } from "@/components/dashboard/DoctorHome";
import { NurseHome } from "@/components/dashboard/NurseHome";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const debouncedSearch = useDebounce(search, 300);

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

  useEffect(() => {
    async function loadAll() {
      try {
        const res = await fetch("/api/rooms");
        if (res.ok) {
          const json = await res.json();
          const allRooms: RoomWithPatient[] = json.data;

          const floorMap = new Map<number, string>();
          allRooms.forEach((r) => floorMap.set(r.floor.number, r.floor.name));
          setFloors(
            Array.from(floorMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([number, name]) => ({ number, name }))
          );

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

  // Doctor and Nurse get their own home view
  if (user?.role === "DOCTOR") {
    return (
      <AppShell>
        <DoctorHome user={user} />
      </AppShell>
    );
  }

  if (user?.role === "NURSE") {
    return (
      <AppShell>
        <NurseHome user={user} />
      </AppShell>
    );
  }

  // Admin / Read-only see the ward dashboard
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Ward Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time room occupancy and patient status</p>
        </div>

        {/* Summary stats */}
        <OccupancySummary rooms={rooms} />

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
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-4">
            {selectedFloor !== null ? floors.find(f => f.number === selectedFloor)?.name : "All Floors"}
          </h2>
          <RoomGrid rooms={rooms} loading={loading} />
        </div>
      </div>
    </AppShell>
  );
}
