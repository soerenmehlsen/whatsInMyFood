"use client";
import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function FilterDropdown({ onFilterChange }: { onFilterChange: (selected: string[]) => void }) { 
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

    const handleFilterChange = (value: string) => {
      const newFilters = selectedFilters.includes(value)
        ? selectedFilters.filter(filter => filter !== value)
        : [...selectedFilters, value];
      
      setSelectedFilters(newFilters);
      onFilterChange(newFilters);}

    return  (
        <div className="flex gap-8">
  <div className="relative">
    <details className="group">
      <summary
        className="flex cursor-pointer items-center gap-2 border-b border-gray-400 pb-1 text-black transition hover:border-gray-600"
      >
        <span className="text-sm font-medium"> Filter </span>

        <span className="transition group-open:-rotate-180">
            <ChevronDownIcon className="size-4" />
        </span>
      </summary>

      <div className="z-50 group-open:absolute group-open:end-0 group-open:top-auto group-open:mt-2">
        <div
          className="w-40 rounded-sm border border-gray-200 bg-white"
        >
          <header className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700"> {selectedFilters.length} Selected </span>

            <button
              type="button"
              className="text-sm text-gray-900 underline underline-offset-4"
              onClick={() => {
                setSelectedFilters([]);
                onFilterChange([]);
              }}
            >
              Reset
            </button>
          </header>
            
          <ul className="space-y-1 border-t border-gray-200 p-4 flex flex-col items-start">
                {[1, 2, 3, 4].map((nova) => (
                  <li key={nova}>
                    <label htmlFor={`FilterNova${nova}`} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`FilterNova${nova}`}
                        className="size-5 rounded-sm border-gray-300"
                        checked={selectedFilters.includes(`${nova}`)}
                        onChange={() => handleFilterChange(`${nova}`)}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Nova {nova}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
        </div>
      </div>
    </details>
  </div>
</div>
    ); }
