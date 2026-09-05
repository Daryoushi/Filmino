"use client";

import { useState, useEffect, useCallback } from "react";
import { WatchlistItem, UnifiedMedia } from "@/lib/tmdb-types";

const WATCHLIST_STORAGE_KEY = "filmino_watchlist_v1";
const LEGACY_STORAGE_KEY = "cinematix_watchlist_v1";
const WATCHLIST_EVENT = "filmino_watchlist_updated";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const stored =
        localStorage.getItem(WATCHLIST_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed: WatchlistItem[] = JSON.parse(stored);
        setWatchlist(Array.isArray(parsed) ? parsed : []);
      } else {
        setWatchlist([]);
      }
    } catch (e) {
      console.error("Failed to parse watchlist from localStorage:", e);
      setWatchlist([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFromStorage();

    const handleStorageChange = () => {
      loadFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(WATCHLIST_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(WATCHLIST_EVENT, handleStorageChange);
    };
  }, [loadFromStorage]);

  const saveToStorage = useCallback((items: WatchlistItem[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
      setWatchlist(items);
      window.dispatchEvent(new Event(WATCHLIST_EVENT));
    } catch (e) {
      console.error("Failed to save watchlist to localStorage:", e);
    }
  }, []);

  const addToWatchlist = useCallback(
    (media: UnifiedMedia | WatchlistItem) => {
      const item: WatchlistItem = {
        id: media.id,
        media_type: media.media_type,
        title: media.title,
        poster_path: media.poster_path,
        vote_average: media.vote_average,
        release_date: media.release_date,
        added_at: Date.now(),
      };

      const existingIndex = watchlist.findIndex(
        (w) => w.id === item.id && w.media_type === item.media_type
      );

      if (existingIndex === -1) {
        const updated = [item, ...watchlist];
        saveToStorage(updated);
        return true;
      }
      return false;
    },
    [watchlist, saveToStorage]
  );

  const removeFromWatchlist = useCallback(
    (id: number, media_type: "movie" | "tv") => {
      const updated = watchlist.filter(
        (w) => !(w.id === id && w.media_type === media_type)
      );
      saveToStorage(updated);
    },
    [watchlist, saveToStorage]
  );

  const toggleWatchlist = useCallback(
    (media: UnifiedMedia | WatchlistItem) => {
      const exists = watchlist.some(
        (w) => w.id === media.id && w.media_type === media.media_type
      );
      if (exists) {
        removeFromWatchlist(media.id, media.media_type);
        return false;
      } else {
        addToWatchlist(media);
        return true;
      }
    },
    [watchlist, addToWatchlist, removeFromWatchlist]
  );

  const isInWatchlist = useCallback(
    (id: number, media_type: "movie" | "tv") => {
      if (!isLoaded) return false;
      return watchlist.some(
        (w) => w.id === id && w.media_type === media_type
      );
    },
    [watchlist, isLoaded]
  );

  const clearWatchlist = useCallback(() => {
    saveToStorage([]);
  }, [saveToStorage]);

  return {
    watchlist,
    isLoaded,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    clearWatchlist,
    count: isLoaded ? watchlist.length : 0,
  };
}
