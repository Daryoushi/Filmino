"use client";

import * as React from "react";
import Image from "next/image";
import { ImageItem } from "@/lib/tmdb-types";
import { getBackdropUrl, getImageUrl } from "@/lib/tmdb";
import { ImageIcon, Sparkles } from "lucide-react";
import { InteractiveBook, BookPage } from "@/components/ui/interactive-book";

interface MediaGalleryProps {
  images?: {
    backdrops?: ImageItem[];
    posters?: ImageItem[];
  };
  title: string;
}

export function MediaGallery({ images, title }: MediaGalleryProps) {
  // Deduplicate posters and backdrops individually by file_path
  const seenPaths = new Set<string>();
  const uniquePosters: ImageItem[] = [];
  (images?.posters || []).forEach((p) => {
    if (p.file_path && !seenPaths.has(p.file_path)) {
      seenPaths.add(p.file_path);
      uniquePosters.push(p);
    }
  });

  const uniqueBackdrops: ImageItem[] = [];
  (images?.backdrops || []).forEach((b) => {
    if (b.file_path && !seenPaths.has(b.file_path)) {
      seenPaths.add(b.file_path);
      uniqueBackdrops.push(b);
    }
  });

  if (uniqueBackdrops.length === 0 && uniquePosters.length === 0) {
    return null;
  }

  const backdrops = uniqueBackdrops.slice(0, 12);
  const posters = uniquePosters.slice(0, 10);

  // Track images used in the 3D book to avoid any duplicate within the book
  const usedInBook = new Set<string>();

  // Pick cover: first unique poster, or first unique backdrop
  let coverImg: string | null = null;
  if (posters.length > 0) {
    coverImg = getImageUrl(posters[0].file_path, "w780");
    usedInBook.add(posters[0].file_path);
  } else if (backdrops.length > 0) {
    coverImg = getBackdropUrl(backdrops[0].file_path, "w780");
    usedInBook.add(backdrops[0].file_path);
  }

  // Pool of strictly unique, unused images for the book pages
  const remainingPosters = posters.filter((p) => !usedInBook.has(p.file_path));
  const remainingBackdrops = backdrops.filter((b) => !usedInBook.has(b.file_path));

  const bookImagesPool: { url: string; isPoster: boolean; title: string }[] = [];

  // Add all posters first so the portrait album pages showcase official posters beautifully
  remainingPosters.forEach((p, idx) => {
    bookImagesPool.push({
      url: getImageUrl(p.file_path, "w780"),
      isPoster: true,
      title: `پوستر ${idx + 1}`,
    });
    usedInBook.add(p.file_path);
  });

  // Then add backdrops
  remainingBackdrops.forEach((b, idx) => {
    bookImagesPool.push({
      url: getBackdropUrl(b.file_path, "w780"),
      isPoster: false,
      title: `صحنه ${idx + 1}`,
    });
    usedInBook.add(b.file_path);
  });

  // Create pages in pairs of 2 unique images
  const bookPages: BookPage[] = [];
  const maxSpreads = Math.min(6, Math.floor(bookImagesPool.length / 2));

  for (let i = 0; i < maxSpreads; i++) {
    const frontItem = bookImagesPool[i * 2];
    const backItem = bookImagesPool[i * 2 + 1];

    if (!frontItem || !backItem) break;

    bookPages.push({
      title: "",
      backTitle: "",
      pageNumber: i + 1,
      content: (
        <div className="relative w-full h-full min-h-0 rounded-xl overflow-hidden shadow-inner bg-black/30">
          <Image
            src={frontItem.url}
            alt={`${title} - ${frontItem.title}`}
            fill
            className={frontItem.isPoster ? "object-cover" : "object-cover"}
            sizes="(max-width: 768px) 100vw, 350px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
      ),
      backContent: (
        <div className="relative w-full h-full min-h-0 rounded-xl overflow-hidden shadow-inner bg-black/30">
          <Image
            src={backItem.url}
            alt={`${title} - ${backItem.title}`}
            fill
            className={backItem.isPoster ? "object-cover" : "object-cover"}
            sizes="(max-width: 768px) 100vw, 350px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
      ),
    });
  }

  return (
    <div className="space-y-8">
      {/* Header without Tablist */}
      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
        <ImageIcon className="h-5 w-5 text-amber-400" />
        <h3 className="text-xl font-bold text-foreground">گالری تصاویر و آلبوم اثر</h3>
      </div>

      {/* 3D Interactive Book (borderless, seamless with background) */}
      {coverImg && bookPages.length > 0 && (
        <div className="w-full flex flex-col items-center justify-center py-2 px-2 overflow-hidden">
          <InteractiveBook
            coverImage={coverImg}
            bookTitle={title}
            bookAuthor="FILMINO GALLERY"
            pages={bookPages}
            width={280}
            height={400}
            className="my-2"
          />
        </div>
      )}
    </div>
  );
}
