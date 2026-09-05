"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Film,
  Laugh,
  Ghost,
  Rocket,
  ShieldAlert,
  Eye,
  Heart,
  Wand2,
  ChevronDown,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react";
import { BROWSE_GENRES } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Flame,
  Film,
  Laugh,
  Ghost,
  Rocket,
  ShieldAlert,
  Eye,
  Heart,
  Wand2,
};

export function GenrePills() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="container mx-auto px-4 md:px-8 mt-2 mb-6 relative z-30">
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-white/15 overflow-hidden">
        {/* Toggle Bar Header */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-start transition-colors hover:bg-white/[0.03] cursor-pointer"
          aria-expanded={isOpen}
          aria-label="باز و بسته کردن نوار دسته‌بندی‌ها"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground border border-border/50">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-bold text-foreground">
                  کاوش بر اساس ژانر و موضوع
                </span>
                <span className="hidden sm:inline-block rounded-full bg-secondary border border-border/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  ۱۰ ژانر منتخب
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
                دسترسی سریع به برترین فیلم‌ها و سریال‌های هر دسته‌بندی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              {isOpen ? "بستن دسته‌بندی‌ها" : "مشاهده همه ژانرها"}
            </span>
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground transition-transform duration-300",
                isOpen && "rotate-180 text-foreground bg-secondary"
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </button>

        {/* Expandable Dropdown Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border/40"
            >
              <div className="p-4 md:p-6 bg-secondary/20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 md:gap-3">
                  {BROWSE_GENRES.map((genre) => {
                    const Icon = ICON_MAP[genre.icon] || Film;
                    return (
                      <Link
                        key={genre.slug}
                        href={`/category/${genre.slug}`}
                        className="group relative flex items-center gap-3 rounded-xl p-3 text-xs md:text-sm font-semibold transition-all duration-200 border bg-secondary/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70 hover:border-border"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/80 text-muted-foreground group-hover:text-foreground transition-transform duration-200 group-hover:scale-105">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{genre.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span>آرشیو کامل فیلم‌ها و سریال‌های ایرانی و خارجی</span>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-1.5 font-semibold text-foreground/80 hover:text-foreground transition-colors"
                  >
                    <span>مشاهده تمام عناوین در آرشیو</span>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
