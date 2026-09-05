import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchClient } from "./search-client";
import { MediaRowSkeleton } from "@/components/media/media-card-skeleton";

export const metadata: Metadata = {
  title: "جستجوی پیشرفته فیلم و سریال",
  description: "جستجوی زنده در میان عناوین فیلم، سریال و انیمیشن در فیلمینو.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <MediaRowSkeleton count={12} />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
