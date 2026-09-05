"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "محبوب‌ترین" },
  { value: "vote_average.desc", label: "بالاترین امتیاز" },
  { value: "primary_release_date.desc", label: "جدیدترین تاریخ انتشار" },
  { value: "vote_count.desc", label: "بیشترین تعداد آرا" },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline flex-shrink-0">
        مرتب‌سازی:
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[170px] h-9 text-xs bg-card border-border/70 rounded-xl">
          <div className="flex items-center gap-1.5 truncate">
            <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
            <SelectValue placeholder="مرتب‌سازی بر اساس" />
          </div>
        </SelectTrigger>
        <SelectContent align="end">
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
