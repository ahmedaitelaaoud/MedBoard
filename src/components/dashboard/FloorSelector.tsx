"use client";

interface FloorSelectorProps {
  floors: { number: number; name: string }[];
  selectedFloor: number | null;
  onSelect: (floorNumber: number | null) => void;
}

export function FloorSelector({ floors, selectedFloor, onSelect }: FloorSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onSelect(null)}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150
          ${selectedFloor === null
            ? "bg-gray-900 text-white"
            : "text-gray-500 hover:bg-gray-100"
          }
        `}
      >
        All Floors
      </button>
      {floors.map((floor) => (
        <button
          key={floor.number}
          onClick={() => onSelect(floor.number)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150
            ${selectedFloor === floor.number
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:bg-gray-100"
            }
          `}
        >
          {floor.name}
        </button>
      ))}
    </div>
  );
}
