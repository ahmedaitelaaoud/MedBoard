"use client";

interface FloorSelectorProps {
  floors: { number: number; name: string }[];
  selectedFloor: number | null;
  onSelect: (floorNumber: number | null) => void;
}

export function FloorSelector({ floors, selectedFloor, onSelect }: FloorSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onSelect(null)}
        className={`
          px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150
          ${selectedFloor === null
            ? "bg-brand-600 text-white shadow-sm"
            : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800"
          }
        `}
      >
        Tous
      </button>
      {floors.map((floor) => (
        <button
          key={floor.number}
          onClick={() => onSelect(floor.number)}
          className={`
            px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150
            ${selectedFloor === floor.number
              ? "bg-brand-600 text-white shadow-sm"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800"
            }
          `}
        >
          {floor.name}
        </button>
      ))}
    </div>
  );
}
