"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { GooeySearch } from "@/components/ui/gooey-search";
import {
  Film,
  Search,
  Bookmark,
  Menu,
  Sparkles,
  Compass,
  Home,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { QuickSearchDialog } from "./quick-search-dialog";
import { useWatchlist } from "@/hooks/use-watchlist";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "صفحه اصلی", icon: Home },
  { href: "/browse", label: "فیلم و سریال", icon: Compass },
  { href: "/category/animation", label: "انیمیشن", icon: Sparkles },
  { href: "/search", label: "جستجو", icon: Search },
  { href: "/contact", label: "ارتباط با ما", icon: MessageSquare },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { count, isLoaded } = useWatchlist();

  // Keyboard shortcut Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = React.useCallback(async (q: string) => {
    try {
      const res = await fetch(
        `/api/tmdb/search/multi?query=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (data.results) {
        return data.results
          .filter(
            (i: { media_type?: string }) =>
              i.media_type === "movie" || i.media_type === "tv"
          )
          .slice(0, 5)
          .map(
            (i: { title?: string; name?: string }) =>
              (i.title || i.name || "") as string
          );
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, []);

  const handleSelect = React.useCallback(
    (selectedTitle: string) => {
      router.push(`/search?q=${encodeURIComponent(selectedTitle)}`);
    },
    [router]
  );

  const handleSubmit = React.useCallback(
    (query: string) => {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [router]
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          {/* Right Section: Mobile Menu + Brand Logo */}
          <div className="flex items-center gap-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-lg"
                  aria-label="منوی اصلی"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-6">
                <SheetHeader className="text-start pb-6 border-b border-border/50">
                  <SheetTitle className="flex items-center gap-2.5 text-xl font-black">
                    <div className="relative h-8 w-6 shrink-0">
                      <Image
                        src="/images/filmino-icon.png"
                        alt="Filmino"
                        width={32}
                        height={42}
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="font-black text-lg text-amber-400">Filmino</span>
                      <span className="text-[10px] text-muted-foreground font-normal">فیلمینو</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                      pathname === link.href ||
                      (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                          isActive
                            ? "bg-secondary text-foreground font-bold"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                  <Link
                    href="/watchlist"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      pathname === "/watchlist"
                        ? "bg-secondary text-foreground font-bold"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Bookmark className="h-4 w-4" />
                      <span>علاقه‌مندی‌ها</span>
                    </div>
                    {isLoaded && count > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-black">
                        {count}
                      </span>
                    )}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
            >
              <div className="relative h-9 w-7 shrink-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                <Image
                  src="/images/filmino-icon.png"
                  alt="لوگوی فیلمینو"
                  width={38}
                  height={50}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-black text-xl tracking-tight text-foreground">
                  Filmino
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold tracking-wider mt-0.5">
                  فیلمینو
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ms-6">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "text-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-secondary border border-border shadow-2xs"
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Left Section: Search Trigger, Watchlist, ThemeToggle */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Gooey Animated Search with Magnifying Glass Icon */}
            <GooeySearch
              placeholder="جستجوی فیلم و سریال..."
              onSearch={handleSearch}
              onSelect={handleSelect}
              onSubmit={handleSubmit}
            />

            {/* Watchlist Link */}
            <Link
              href="/watchlist"
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border-0 shadow-2xs",
                pathname === "/watchlist" && "bg-secondary text-foreground"
              )}
              title="لیست علاقه‌مندی‌ها"
            >
              <Bookmark className="h-4 w-4" />
              {isLoaded && count > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black shadow-sm">
                  {count}
                </span>
              )}
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <QuickSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
