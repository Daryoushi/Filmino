"use client";

import * as React from "react";
import { UnifiedMedia } from "@/lib/tmdb-types";
import { MediaCard } from "./media-card";
import { SectionHeader } from "@/components/shared/section-header";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface MediaCarouselProps {
  title: string;
  items: UnifiedMedia[];
  viewAllHref?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MediaCarousel({
  title,
  items,
  viewAllHref,
  subtitle,
  className,
}: MediaCarouselProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className={cn("relative my-8 space-y-4", className)}>
      {/* Unified Section Header */}
      <div className="px-4 md:px-8">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          href={viewAllHref}
          actionLabel="مشاهده همه"
        />
      </div>

      {/* Carousel */}
      <div className="relative px-4 md:px-8">
        <Carousel
          opts={{
            align: "start",
            direction: "rtl",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ms-3 md:-ms-4">
            {items.map((item, index) => (
              <CarouselItem
                key={`${item.id}-${item.media_type}-${index}`}
                className="ps-3 md:ps-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
              >
                <MediaCard media={item} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
