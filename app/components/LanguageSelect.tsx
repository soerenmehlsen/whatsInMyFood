"use client";

import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { cn } from "@/lib/utils";

interface LanguageSelectProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export default function LanguageSelect({
  value,
  onChange,
  className,
}: LanguageSelectProps) {
  return (
    <label className={cn("flex items-center gap-2 text-sm text-muted", className)}>
      <span>Results in</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-hairline-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34c759]/40"
      >
        {LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
