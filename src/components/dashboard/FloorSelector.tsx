"use client";

interface FloorSelectorProps {
  floors: { number: number; name: string }[];
  selectedFloor: number | null;
  onSelect: (floorNumber: number | null) => void;
}

export function FloorSelector({ floors, selectedFloor, onSelect }: FloorSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {floors.map((floor) => (
        <button
          key={floor.number}
          onClick={() => onSelect(floor.number)}
          className={`
            px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2
            ${selectedFloor === floor.number
              ? "border-teal-400 text-teal-500"
              : "border-transparent text-teal-500/60 hover:text-teal-500 hover:border-teal-200"
            }
          `}
        >
          {floor.name}
        </button>
      ))}
    </div>
  );
}
