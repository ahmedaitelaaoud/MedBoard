"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { ROOM_STATUS_LABELS } from "@/lib/constants";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  wardFilter: string;
  onWardChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  wards: { code: string; name: string }[];
}

export function FilterBar({
  search,
  onSearchChange,
  wardFilter,
  onWardChange,
  statusFilter,
  onStatusChange,
  wards,
}: FilterBarProps) {
  const wardOptions = [
    { value: "", label: "All Wards" },
    ...wards.map((w) => ({ value: w.code, label: w.name })),
  ];

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...Object.entries(ROOM_STATUS_LABELS).map(([val, label]) => ({
      value: val,
      label,
    })),
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="w-64">
        <SearchInput
          placeholder="Search rooms or patients..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
        />
      </div>
      <Select
        options={wardOptions}
        value={wardFilter}
        onChange={(e) => onWardChange(e.target.value)}
      />
      <Select
        options={statusOptions}
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
      />
    </div>
  );
}
