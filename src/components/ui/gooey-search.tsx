"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Utilities ────────────────────────────────────────────────────────────────

function detectUnsupportedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox");
  return isSafari || ua.includes("crios");
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SearchSvgIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11 7C11 9.20914 9.20914 11 7 11C4.79086 11 3 9.20914 3 7C3 4.79086 4.79086 3 7 3C9.20914 3 11 4.79086 11 7ZM10.2372 10.9443C9.3664 11.6053 8.23235 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C9.76142 2 12 4.23858 12 7C12 8.23235 11.6053 9.3664 10.9443 10.2372L13.8536 13.1464C14.0488 13.3417 14.0488 13.6583 13.8536 13.8536C13.6583 14.0488 13.3417 14.0488 13.1464 13.8536L10.2372 10.9443Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LoadingSvgIcon() {
  const lines: [number, number, number, number][] = [
    [128, 32, 128, 64],
    [195.88, 60.12, 173.25, 82.75],
    [224, 128, 192, 128],
    [195.88, 195.88, 173.25, 173.25],
    [128, 224, 128, 192],
    [60.12, 195.88, 82.75, 173.25],
    [32, 128, 64, 128],
    [60.12, 60.12, 82.75, 82.75],
  ];
  return (
    <svg
      className="gooey-search-loading"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-label="Loading"
      role="status"
      style={{ width: 18, height: 18 }}
    >
      <rect width="256" height="256" fill="none" />
      {lines.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={18}
        />
      ))}
    </svg>
  );
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface GooeySearchProps {
  items?: string[];
  onSearch?: (query: string) => Promise<string[]> | string[];
  placeholder?: string;
  buttonLabel?: string;
  onSelect?: (item: string) => void;
  onSubmit?: (query: string) => void;
  className?: string;
  debounceMs?: number;
  maxResults?: number;
  initialOpen?: boolean;
}

export function GooeySearch({
  items = [],
  onSearch,
  placeholder = "جستجوی فیلم و سریال...",
  buttonLabel,
  onSelect,
  onSubmit,
  className,
  debounceMs = 350,
  maxResults = 5,
  initialOpen = false,
}: GooeySearchProps) {
  const uid = useId().replace(/:/g, "_");
  const filterId = `gooey-search-${uid}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isUnsupported = useMemo(() => detectUnsupportedBrowser(), []);
  const debouncedQuery = useDebounce(searchText, debounceMs);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!searchText.trim()) {
          setIsOpen((prev) => (prev ? false : prev));
          setResults((prev) => (prev.length > 0 ? [] : prev));
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchText]);

  useEffect(() => {
    let cancelled = false;

    if (!debouncedQuery.trim()) {
      setResults((prev) => (prev.length === 0 ? prev : []));
      setIsLoading(false);
      return;
    }

    const run = async () => {
      setIsLoading(true);
      try {
        let data: string[] = [];
        if (onSearchRef.current) {
          data = await onSearchRef.current(debouncedQuery);
        } else {
          await new Promise<void>((r) => setTimeout(r, 200));
          const curItems = itemsRef.current || [];
          data = curItems.filter((item) =>
            item.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
          );
        }
        if (!cancelled) setResults(data.slice(0, maxResults));
      } catch (err) {
        console.error("GooeySearch error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, maxResults]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchText.trim()) {
        if (onSubmit) onSubmit(searchText.trim());
        else if (onSelect) onSelect(searchText.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchText("");
      setResults([]);
    }
  };

  const hasLabel = Boolean(buttonLabel);
  const closedWidth = hasLabel ? 110 : 36;
  const openWidth = 260;

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center justify-center z-30", className)}
    >
      <style>{`
        .gooey-search-loading {
          animation: gooeySearchSpin 0.5s linear infinite;
          transform-origin: center center;
        }
        @keyframes gooeySearchSpin { to { transform: rotate(180deg); } }
      `}</style>

      {/* SVG gooey filter */}
      <svg
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -14"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Gooey container */}
      <div
        style={{
          filter: isUnsupported || !isOpen ? "none" : `url(#${filterId})`,
          position: "relative",
        }}
      >
        {/* Results dropdown */}
        <AnimatePresence mode="popLayout">
          {isOpen && results.length > 0 && (
            <motion.div
              key="results-wrapper"
              role="listbox"
              style={{ position: "relative", zIndex: -1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="popLayout">
                {results.map((item, index) => (
                  <motion.div
                    key={item}
                    role="option"
                    tabIndex={0}
                    onClick={() => {
                      onSelect?.(item);
                      setIsOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSelect?.(item);
                        setIsOpen(false);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    initial={{ y: 0, scale: 0.3, filter: "blur(6px)" }}
                    animate={{ y: (index + 1) * 44, scale: 1, filter: "blur(0px)" }}
                    exit={{ y: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.08,
                      type: "spring",
                      bounce: 0.25,
                    }}
                    className="bg-card text-card-foreground border border-border rounded-2xl px-4 py-2.5 shadow-xl text-xs font-semibold cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis hover:bg-secondary transition-colors"
                    style={{
                      width: openWidth,
                      position: "absolute",
                      right: -10,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <SearchSvgIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Morphing search button & input */}
        <motion.div
          animate={{
            width: isOpen ? openWidth : closedWidth,
            x: isOpen ? -10 : 0,
          }}
          transition={{ duration: 0.45, type: "spring", bounce: 0.2 }}
          onClick={() => !isOpen && setIsOpen(true)}
          whileHover={{ scale: isOpen ? 1 : 1.05 }}
          whileTap={{ scale: 0.96 }}
          role={!isOpen ? "button" : undefined}
          aria-label="جستجو"
          title="جستجو"
          className={cn(
            "cursor-pointer outline-none rounded-full h-9 flex items-center justify-center transition-colors duration-200",
            isOpen
              ? "bg-card text-foreground border border-border px-3.5 shadow-xs"
              : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border-0 shadow-2xs px-0"
          )}
        >
          {!isOpen ? (
            <div className="flex items-center justify-center gap-1.5 text-inherit transition-colors">
              <SearchSvgIcon className="h-4 w-4 stroke-[2]" />
              {hasLabel && (
                <span className="text-xs font-semibold leading-none pe-1">
                  {buttonLabel}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center w-full gap-2">
              <SearchSvgIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchText}
                placeholder={placeholder}
                aria-label="جستجوی فیلم و سریال"
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none border-none text-foreground text-xs font-medium placeholder:text-muted-foreground"
              />
              {isLoading && (
                <div className="text-muted-foreground shrink-0">
                  <LoadingSvgIcon />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
