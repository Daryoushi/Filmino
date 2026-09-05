"use client";

import * as React from "react";
import { Filter, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaType } from "@/lib/tmdb-types";
import { cn } from "@/lib/utils";

export interface FilterState {
  type: MediaType;
  genre: string;
  year: string;
  rating: number;
  country?: string;
}

export const POPULAR_COUNTRIES = [
  { code: "US", name: "ایالات متحده آمریکا (هالیوود)" },
  { code: "IR", name: "ایران" },
  { code: "GB", name: "بریتانیا (انگلستان)" },
  { code: "FR", name: "فرانسه" },
  { code: "KR", name: "کره جنوبی (کی‌دراما)" },
  { code: "JP", name: "ژاپن (انیمه و سینما)" },
  { code: "IN", name: "هندوستان (بالیوود)" },
  { code: "TR", name: "ترکیه" },
  { code: "DE", name: "آلمان" },
  { code: "IT", name: "ایتالیا" },
  { code: "ES", name: "اسپانیا" },
];

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  className?: string;
  hideType?: boolean;
}

// Separate genres per media type so every genre in the list returns valid items on TMDB.
// Animation is excluded as it has its own dedicated page and navbar section.
const MOVIE_GENRES = [
  { id: 28, name: "اکشن" },
  { id: 12, name: "ماجراجویی" },
  { id: 18, name: "درام" },
  { id: 35, name: "کمدی" },
  { id: 27, name: "ترسناک" },
  { id: 878, name: "علمی-تخیلی" },
  { id: 80, name: "جنایی" },
  { id: 9648, name: "معمایی" },
  { id: 10749, name: "عاشقانه" },
  { id: 14, name: "فانتزی" },
];

const TV_GENRES = [
  { id: 10759, name: "اکشن و ماجراجویی" },
  { id: 18, name: "درام" },
  { id: 35, name: "کمدی" },
  { id: 80, name: "جنایی" },
  { id: 9648, name: "معمایی" },
  { id: 10765, name: "علمی‌تخیلی و فانتزی" },
  { id: 10768, name: "جنگ و سیاست" },
];

export function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
  className,
  hideType = false,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Local state for smooth slider dragging without lagging the URL/page
  const [localRating, setLocalRating] = React.useState<number>(filters.rating);

  // Local state for year text input
  const [yearInput, setYearInput] = React.useState<string>(filters.year || "");
  const [yearError, setYearError] = React.useState<string>("");

  // Sync local states if external filters change (e.g. onReset or back navigation)
  React.useEffect(() => {
    setLocalRating(filters.rating);
  }, [filters.rating]);

  React.useEffect(() => {
    setYearInput(filters.year || "");
    setYearError("");
  }, [filters.year]);

  // Handle switching media type (movie vs tv)
  const handleTypeChange = (newType: MediaType) => {
    if (newType === filters.type) return;
    const availableGenres = newType === "tv" ? TV_GENRES : MOVIE_GENRES;
    const isGenreValidForNewType = availableGenres.some(
      (g) => String(g.id) === filters.genre
    );
    onFilterChange({
      type: newType,
      genre: isGenreValidForNewType ? filters.genre : "",
    });
  };

  // Handle 4-digit year input
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert Persian digits to English digits
    const rawVal = e.target.value.replace(/[۰-۹]/g, (d) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    );
    // Keep only numeric characters, max 4 digits
    const cleanVal = rawVal.replace(/\D/g, "").slice(0, 4);
    setYearInput(cleanVal);

    if (!cleanVal) {
      setYearError("");
      if (filters.year) {
        onFilterChange({ year: "" });
      }
      return;
    }

    if (cleanVal.length === 4) {
      const numYear = parseInt(cleanVal, 10);
      if (numYear >= 1950 && numYear <= 2030) {
        setYearError("");
        onFilterChange({ year: cleanVal });
      } else {
        setYearError("بین ۱۹۵۰ تا ۲۰۳۰ وارد کنید");
      }
    } else {
      setYearError("");
    }
  };

  const currentGenres = filters.type === "tv" ? TV_GENRES : MOVIE_GENRES;

  const filterContent = (
    <div className="space-y-6">
      {/* Type Selector (Movie vs TV) - optionally hidden if in animation or specific page */}
      {!hideType && (
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            نوع اثر
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={filters.type === "movie" ? "cinema" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("movie")}
              className="rounded-xl text-xs font-semibold"
            >
              فیلم سینمایی
            </Button>
            <Button
              type="button"
              variant={filters.type === "tv" ? "cinema" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("tv")}
              className="rounded-xl text-xs font-semibold"
            >
              سریال تلویزیونی
            </Button>
          </div>
        </div>
      )}

      {/* Country of Origin Filter */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            کشور سازنده
          </label>
          {filters.country && (
            <button
              type="button"
              onClick={() => onFilterChange({ country: "" })}
              className="text-[10px] text-muted-foreground hover:text-amber-400 cursor-pointer"
            >
              همه کشورها
            </button>
          )}
        </div>
        <Select
          value={filters.country || "all"}
          onValueChange={(val) =>
            onFilterChange({ country: val === "all" ? "" : val })
          }
        >
          <SelectTrigger className="w-full text-xs rounded-xl bg-card border-border/80 h-9">
            <SelectValue placeholder="همه کشورها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              همه کشورها (سراسر جهان)
            </SelectItem>
            {POPULAR_COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-xs">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Genres List */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          دسته‌بندی و ژانر
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pe-1">
          <button
            type="button"
            onClick={() => onFilterChange({ genre: "" })}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
              !filters.genre
                ? "bg-amber-500 text-black font-bold shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            همه ژانرها
          </button>

          {currentGenres.map((g) => {
            const isSelected = filters.genre === String(g.id);

            return (
              <button
                key={g.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    genre: isSelected ? "" : String(g.id),
                  })
                }
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                  isSelected
                    ? "bg-amber-500 text-black font-bold shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{g.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Release Year - 4-digit input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            سال ساخت (۴ رقمی)
          </label>
          {yearInput && (
            <button
              type="button"
              onClick={() => {
                setYearInput("");
                setYearError("");
                onFilterChange({ year: "" });
              }}
              className="text-[10px] text-muted-foreground hover:text-amber-400 cursor-pointer"
            >
              پاک کردن
            </button>
          )}
        </div>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={yearInput}
          onChange={handleYearChange}
          placeholder="از 1950 تا 2030"
          className={cn(
            "text-xs rounded-xl bg-card border-border/80 text-center tracking-widest font-mono h-9",
            yearError && "border-red-500 focus-visible:ring-red-500"
          )}
          dir="ltr"
        />
        {yearError && (
          <p className="text-[11px] text-red-500 font-medium">{yearError}</p>
        )}
      </div>

      {/* Minimum Rating Slider with smooth drag and onValueCommit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-muted-foreground uppercase tracking-wider">
            حداقل امتیاز
          </label>
          <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
            <Star className="h-3 w-3 fill-amber-400" />
            <span dir="ltr">{localRating}</span>
          </span>
        </div>
        <Slider
          value={[localRating]}
          max={9}
          min={0}
          step={0.5}
          onValueChange={([val]) => setLocalRating(val)}
          onValueCommit={([val]) => onFilterChange({ rating: val })}
          className="w-full py-1 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          <span>همه (۰)</span>
          <span>۵</span>
          <span>۹+</span>
        </div>
      </div>

      {/* Apply Filter Button */}
      <Button
        type="button"
        variant="cinema"
        size="sm"
        onClick={() => {
          onFilterChange({
            rating: localRating,
            year: yearInput || "",
          });
          setMobileOpen(false);
        }}
        className="w-full text-xs font-bold gap-1.5 mt-3 cursor-pointer shadow-sm"
      >
        <Filter className="h-3.5 w-3.5" />
        <span>اعمال فیلترها</span>
      </Button>

      {/* Reset Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setYearInput("");
          setYearError("");
          setLocalRating(0);
          onReset();
        }}
        className="w-full text-xs text-muted-foreground hover:text-foreground gap-1.5 mt-1 cursor-pointer"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>بازنشانی تمام فیلترها</span>
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile Sheet Trigger */}
      <div className="lg:hidden w-full flex items-center justify-between gap-2 p-2 bg-card/60 rounded-xl border border-border/50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs rounded-xl border-border/70"
            >
              <Filter className="h-4 w-4 text-amber-400" />
              <span>فیلترهای پیشرفته</span>
              {(filters.genre || filters.year || filters.rating > 0) && (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-6 overflow-y-auto">
            <SheetHeader className="text-start pb-4 border-b border-border/60 mb-4">
              <SheetTitle className="flex items-center gap-2 text-base font-bold">
                <Filter className="h-4 w-4 text-amber-400" />
                <span>فیلتر آثار</span>
              </SheetTitle>
            </SheetHeader>
            {filterContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sticky Sidebar */}
      <div
        className={cn(
          "hidden lg:block w-64 shrink-0 p-5 rounded-2xl bg-card/70 backdrop-blur-md border border-border/60 shadow-sm self-start sticky top-24 space-y-6",
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Filter className="h-4 w-4 text-amber-400" />
            <span>فیلترهای هوشمند</span>
          </div>
        </div>
        {filterContent}
      </div>
    </>
  );
}
