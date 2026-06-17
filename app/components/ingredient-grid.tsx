"use client";

import { IngredientItem } from "@/app/components/ImageUploader";
import { motion } from "framer-motion";
import { useState } from "react";
import { getStrings } from "@/lib/i18n";
import { novaVisual, sectionTitle } from "@/lib/nova";
import type { NovaGroup } from "@/lib/verdict";

interface IngredientGridProps {
  items: IngredientItem[];
  language: string;
}

export function IngredientGrid({ items, language }: IngredientGridProps) {
  const [expandItem, setExpandItem] = useState<string | null>(null);
  const t = getStrings(language);

  const handleExpand = (itemName: string) => {
    setExpandItem((prev) => (prev === itemName ? null : itemName));
  };

  // Group by NOVA level, highest (most processed) first. Empty groups omitted.
  const groups = ([4, 3, 2, 1] as NovaGroup[])
    .map((nova) => ({
      nova,
      items: items.filter((i) => Number(i.nova_classification) === nova),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const visual = novaVisual(group.nova);
        return (
          <section key={group.nova}>
            <div className="mb-4 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: visual.dot }}
              />
              <h3 className="text-sm font-semibold tracking-tight text-ink">
                {sectionTitle(t.groupNoun[group.nova])}
              </h3>
              <span className="text-sm text-muted">· {group.items.length}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleExpand(item.name)}
                  className="group cursor-pointer rounded-2xl border border-hairline bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative">
                    <h4 className="mb-1 pr-16 text-base font-semibold text-ink">
                      {item.name}
                    </h4>

                    {/* NOVA pill with a lightweight CSS tooltip */}
                    <span className="absolute right-0 top-0">
                      <span className="group/tip relative inline-flex">
                        <span
                          tabIndex={0}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${visual.chip}`}
                        >
                          {visual.shortLabel}
                        </span>
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute right-0 top-full z-10 mt-1 w-48 rounded-lg bg-ink px-2.5 py-1.5 text-left text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
                        >
                          {visual.info}
                        </span>
                      </span>
                    </span>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: expandItem === item.name ? 1 : 0.7,
                      }}
                      className={`text-sm text-muted ${
                        expandItem === item.name ? "" : "line-clamp-2"
                      }`}
                    >
                      {item.description}
                      {expandItem === item.name && (
                        <>
                          <br />
                          <span className="font-semibold text-ink">
                            {t.processLabel}:{" "}
                          </span>
                          {item.reason}
                        </>
                      )}
                    </motion.p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
