"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import imagesLoaded from "imagesloaded";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface BentoItem {
  id: number | string;
  title: string;
  subtitle?: string;
  description?: string;
  icon: React.ReactNode;
  content?: React.ReactNode;
  image?: string;
  href?: string;
}

export interface StaggeredGridProps {
  images?: string[];
  bentoItems: BentoItem[];
  centerText?: string;
  credits?: {
    madeBy?: { text: string; href: string };
    moreDemos?: { text: string; href: string };
  };
  className?: string;
  showFooter?: boolean;
  scroller?: string | Element | Window | null;
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80",
];

export function StaggeredGrid({
  images = DEFAULT_IMAGES,
  bentoItems,
  centerText = "FILMINO",
  credits = {
    moreDemos: { text: "کاوش در آرشیو فیلم‌ها ←", href: "/browse" },
  },
  className,
  showFooter = true,
  scroller,
}: StaggeredGridProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const gridFullRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  // Bento Grid State: default to first card (matching VengeanceUI pattern)
  const [activeBento, setActiveBento] = useState<number>(0);

  const splitText = (text: string) => {
    return text.split("").map((char, i) => (
      <span
        key={i}
        className="char inline-block"
        style={{ willChange: "transform" }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  useEffect(() => {
    const handleLoad = () => {
      document.body.classList.remove("loading");
      setIsLoaded(true);
    };

    const imgElements = document.querySelectorAll(".grid__item-img");
    if (imgElements.length === 0) {
      handleLoad();
      return;
    }

    // Wait for background images to load
    try {
      imagesLoaded(imgElements, { background: true }, handleLoad);
    } catch {
      handleLoad();
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    // Animate Text Element
    if (textRef.current) {
      const chars = textRef.current.querySelectorAll(".char");
      gsap
        .timeline({
          scrollTrigger: {
            trigger: textRef.current,
            scroller: scroller || undefined,
            start: "top bottom",
            end: "center center-=25%",
            scrub: 1,
          },
        })
        .from(chars, {
          ease: "sine.out",
          yPercent: 300,
          autoAlpha: 0,
          stagger: {
            each: 0.05,
            from: "center",
          },
        });
    }

    // Scroll Hint animation (fades out as user scrolls)
    if (scrollHintRef.current) {
      gsap.to(scrollHintRef.current, {
        scrollTrigger: {
          trigger: scrollHintRef.current,
          scroller: scroller || undefined,
          start: "top center+=15%",
          end: "bottom top+=20%",
          scrub: 1,
        },
        autoAlpha: 0,
        y: -25,
        ease: "power2.out",
      });
    }

    // Animate Full Grid
    if (gridFullRef.current) {
      const gridFullItems = gridFullRef.current.querySelectorAll(".grid__item");
      const numColumns =
        getComputedStyle(gridFullRef.current)
          .getPropertyValue("grid-template-columns")
          .split(" ").length || 7;
      const middleColumnIndex = Math.floor(numColumns / 2);

      const columns: Element[][] = Array.from({ length: numColumns }, () => []);
      gridFullItems.forEach((item: Element) => {
        const colAttr = item.getAttribute("data-col");
        const columnIndex = colAttr !== null ? parseInt(colAttr, 10) : 0;
        if (columns[columnIndex]) {
          columns[columnIndex].push(item);
        }
      });

      columns.forEach((columnItems, columnIndex) => {
        const delayFactor = Math.abs(columnIndex - middleColumnIndex) * 0.2;

        gsap
          .timeline({
            scrollTrigger: {
              trigger: gridFullRef.current,
              scroller: scroller || undefined,
              start: "top bottom",
              end: "center center",
              scrub: 1.5,
            },
          })
          .from(columnItems, {
            yPercent: 450,
            autoAlpha: 0,
            delay: delayFactor,
            ease: "sine.out",
          })
          .from(
            columnItems
              .map((item) => item.querySelector(".grid__item-img"))
              .filter(Boolean),
            {
              transformOrigin: "50% 0%",
              ease: "sine.out",
            },
            0
          );
      });

      // Specific animation for Bento Container (VengeanceUI hardware-accelerated movement)
      const bentoContainer = gridFullRef.current.querySelector(".bento-container");

      if (bentoContainer) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: gridFullRef.current,
            scroller: scroller || undefined,
            start: "top top+=15%",
            end: "bottom center",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        // Animate Bento Container to move down and scale into empty rows 4 & 5
        tl.to(
          bentoContainer,
          {
            y: typeof window !== "undefined" ? window.innerHeight * 0.08 : 40,
            scale: 1.35,
            zIndex: 1000,
            ease: "power2.out",
            duration: 1,
            force3D: true,
          },
          0
        );
      }
    }
  }, [isLoaded, scroller]);

  // Prepare grid items: fill up to the end of Row 3 (21 slots total)
  // This perfectly balances the 3rd row with 2 cards on each side of the bento container.
  const mixedGridItems: (string | "BENTO_GROUP")[] = Array.from(
    { length: 21 },
    (_, i) => images[i % images.length]
  );

  // Position at index 16 = Row 3 (middle row), spanning columns 3-5 (center)
  mixedGridItems[16] = "BENTO_GROUP";

  // Calculate widths so sum is always exactly 100% without flex reflow lag
  const itemCount = bentoItems?.length || 1;
  const activeWidth = itemCount <= 3 ? 60 : 48;
  const inactiveWidth = Math.floor(
    (100 - activeWidth) / Math.max(1, itemCount - 1)
  );

  return (
    <div
      className={cn("shadow relative overflow-hidden w-full", className)}
      style={
        {
          "--grid-item-translate": "0px",
        } as React.CSSProperties
      }
    >
      {/* Center text section */}
      <section className="grid place-items-center w-full relative mt-4">
        <div
          ref={textRef}
          dir="ltr"
          className="text font-black uppercase flex flex-row items-center justify-center content-center text-[clamp(2.5rem,10vw,8rem)] leading-[0.85] text-neutral-900 dark:text-white tracking-widest"
        >
          {splitText(centerText)}
        </div>

        {/* Scroll hint in English that fades out smoothly on scroll */}
        <div
          ref={scrollHintRef}
          dir="ltr"
          className="flex flex-col items-center justify-center gap-2 mt-4 text-muted-foreground/75 tracking-[0.25em] font-sans text-xs uppercase select-none transition-opacity"
        >
          <span className="text-[11px] font-semibold text-muted-foreground/80 tracking-[0.2em]">
            Scroll to explore
          </span>
          <div className="w-5 h-8 rounded-full border border-muted-foreground/30 flex items-start justify-center p-1 shadow-xs">
            <div className="w-1.5 h-2 rounded-full bg-amber-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Grid section with canonical VengeanceUI 5-row structure */}
      <section className="grid place-items-center w-full relative">
        <div
          ref={gridFullRef}
          className="grid--full relative w-full my-[6vh] md:my-[10vh] h-auto aspect-[1.1] max-w-none p-4 grid gap-4 grid-cols-7 grid-rows-5"
        >
          <div className="grid-overlay absolute inset-0 z-[15] pointer-events-none opacity-0 bg-white/80 dark:bg-black/80 rounded-lg transition-opacity duration-500" />
          {mixedGridItems.map((item, i) => {
            if (item === "BENTO_GROUP") {
              if (!bentoItems || bentoItems.length === 0) return null;

              return (
                <div
                  key="bento-group"
                  data-col={2}
                  className="grid__item bento-container col-span-3 row-span-1 relative z-20 flex items-center justify-center gap-2 h-full w-full will-change-transform"
                >
                  {bentoItems.map((bentoItem, index) => {
                    const isActive = activeBento === index;

                    return (
                      <div
                        key={bentoItem.id}
                        className={cn(
                          "relative cursor-pointer overflow-hidden rounded-2xl h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[width]",
                          isActive
                            ? "bg-zinc-900/10 shadow-2xl"
                            : "bg-zinc-950"
                        )}
                        style={{
                          width: `${isActive ? activeWidth : inactiveWidth}%`,
                        }}
                        onMouseEnter={() => setActiveBento(index)}
                        onClick={() => {
                          setActiveBento(index);
                          if (bentoItem.href && typeof window !== "undefined") {
                            window.open(bentoItem.href, "_blank");
                          }
                        }}
                      >
                        {/* Border Overlay */}
                        <div
                          className={cn(
                            "absolute inset-0 rounded-2xl border z-50 pointer-events-none transition-colors duration-700",
                            isActive
                              ? "border-amber-500/80 shadow-[0_0_15px_rgba(229,160,13,0.3)]"
                              : "border-zinc-800/60 group-hover:border-zinc-700"
                          )}
                        />

                        {/* Content Container */}
                        <div className="relative z-10 w-full h-full flex flex-col p-0">
                          {/* Active State Content */}
                          <div
                            className={cn(
                              "absolute inset-0 flex flex-col transition-all duration-500 ease-in-out",
                              isActive
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-4 pointer-events-none"
                            )}
                          >
                            {/* Image - Full Coverage */}
                            <div className="absolute inset-0 bg-zinc-900 overflow-hidden z-0 group/img">
                              {bentoItem.image && (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={bentoItem.image}
                                    alt={bentoItem.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 opacity-90 group-hover/img:opacity-100"
                                  />
                                  {/* Text Protection Gradient */}
                                  <div className="absolute bottom-0 left-0 w-full h-36 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
                                </>
                              )}
                            </div>

                            {/* Footer Row */}
                            <div className="absolute bottom-0 left-0 w-full h-20 flex items-center justify-between px-4 sm:px-5 z-20">
                              <div className="flex flex-col relative z-10 text-right">
                                <h3 className="text-sm font-bold text-white drop-shadow-md leading-none tracking-tight">
                                  {bentoItem.title}
                                </h3>
                                {bentoItem.description && (
                                  <p className="text-[11px] text-zinc-300/95 mt-1.5 font-medium line-clamp-1 max-w-[220px] drop-shadow">
                                    {bentoItem.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-amber-400 drop-shadow-md relative z-10 text-lg">
                                {bentoItem.icon}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Inactive State - Icon + Title Centered */}
                        <div
                          className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-500",
                            isActive
                              ? "opacity-0 scale-90 pointer-events-none"
                              : "opacity-100 scale-100"
                          )}
                        >
                          <div className="text-white/60 group-hover:text-amber-400 transition-colors text-lg">
                            {bentoItem.icon}
                          </div>
                          <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-wider text-center px-1 line-clamp-1">
                            {bentoItem.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Skip rendering for the slots that the group takes up (cols 4 and 5)
            if (i === 17 || i === 18) return null;

            if (typeof item === "string") {
              return (
                <figure
                  key={`img-${i}`}
                  data-col={i % 7}
                  className="grid__item m-0 relative z-10 [perspective:800px] will-change-[transform,opacity] pointer-events-none select-none"
                >
                  <div className="grid__item-img w-full h-full [backface-visibility:hidden] will-change-transform rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-950">
                    {item && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item}
                        alt=""
                        className="w-full h-full object-cover opacity-80 dark:opacity-60"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                </figure>
              );
            }
            return null;
          })}
        </div>
      </section>

      {/* Footer link section - Clean, spaced, and isolated from grid animations */}
      {showFooter && credits && (credits.madeBy || credits.moreDemos) && (
        <footer
          className={cn(
            "frame__footer w-full max-w-6xl mx-auto my-8 px-6 py-4 flex items-center relative z-50 text-muted-foreground hover:text-foreground font-medium text-xs tracking-wider",
            credits.madeBy && credits.moreDemos ? "justify-between" : "justify-center"
          )}
        >
          {credits.madeBy && (
            <a
              href={credits.madeBy.href}
              className="hover:text-amber-400 transition-colors font-semibold"
            >
              {credits.madeBy.text}
            </a>
          )}
          {credits.moreDemos && (
            <a
              href={credits.moreDemos.href}
              className="hover:text-amber-400 transition-colors font-semibold text-center text-sm"
            >
              {credits.moreDemos.text}
            </a>
          )}
        </footer>
      )}
    </div>
  );
}

export default StaggeredGrid;
