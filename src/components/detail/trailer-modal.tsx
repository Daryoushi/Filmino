"use client";

import * as React from "react";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TrailerModalProps {
  videoKey?: string;
  title: string;
}

export function TrailerModal({ videoKey, title }: TrailerModalProps) {
  const [open, setOpen] = React.useState(false);

  if (!videoKey) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="cinema"
          size="lg"
          className="rounded-xl gap-2 font-bold shadow-lg shadow-amber-500/20"
        >
          <Play className="h-5 w-5 fill-black stroke-black" />
          <span>تماشای تریلر رسمی</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-zinc-800">
        <DialogHeader className="p-4 bg-zinc-950 border-b border-zinc-800">
          <DialogTitle className="text-sm font-semibold text-zinc-300">
            تریلر رسمی: {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-video w-full bg-black">
          {open && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
              title={`تریلر رسمی ${title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
