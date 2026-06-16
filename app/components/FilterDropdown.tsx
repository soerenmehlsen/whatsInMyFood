"use client";
import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { novaVisual } from "@/lib/nova";

// Filter dropdown component for selecting NOVA classification
export default function FilterDropdown({
  onFilterChange,
}: {
  onFilterChange: (selected: number[]) => void;
}) {
  const [selectedFilters, setSelectedFilters] = useState<number[]>([]);

  const handleFilterChange = (value: number) => {
    const newFilters = selectedFilters.includes(value)
      ? selectedFilters.filter((filter) => filter !== value)
      : [...selectedFilters, value];

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-muted [&::-webkit-details-marker]:hidden">
          <span>
            Filter{selectedFilters.length > 0 ? ` · ${selectedFilters.length}` : ""}
          </span>
          <span className="transition group-open:-rotate-180">
            <ChevronDownIcon className="size-4" />
          </span>
        </summary>

        <div className="absolute end-0 z-50 mt-2 w-48 rounded-2xl border border-hairline bg-surface p-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs text-muted">
              {selectedFilters.length} selected
            </span>
            <button
              type="button"
              className="text-xs font-medium text-accent-fg hover:underline"
              onClick={() => {
                setSelectedFilters([]);
                onFilterChange([]);
              }}
            >
              Reset
            </button>
          </div>

          <ul className="mt-1 border-t border-hairline pt-1">
            {[1, 2, 3, 4].map((nova) => (
              <li key={nova}>
                <label
                  htmlFor={`FilterNova${nova}`}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={`FilterNova${nova}`}
                    className="size-4 rounded border-gray-300 text-accent accent-[#34c759]"
                    checked={selectedFilters.includes(nova)}
                    onChange={() => handleFilterChange(nova)}
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: novaVisual(nova).dot }}
                  />
                  <span className="text-sm font-medium text-ink">
                    NOVA {nova}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
