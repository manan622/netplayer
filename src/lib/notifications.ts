import { useEffect, useState, useCallback } from "react";
import type { TmdbItem } from "@/services/tmdb";

const SEEN_KEY = "netflix.notifications.seen.v1";

const readSeen = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeSeen = (ids: string[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(0, 200)));
  window.dispatchEvent(new CustomEvent("notifications:change"));
};

export const keyOf = (i: TmdbItem) => `${i.mediaType ?? "movie"}-${i.id}`;

export function markAllSeen(items: TmdbItem[]) {
  const seen = new Set(readSeen());
  items.forEach((i) => seen.add(keyOf(i)));
  writeSeen(Array.from(seen));
}

export function useUnreadCount(items: TmdbItem[]) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const refresh = useCallback(() => setSeen(new Set(readSeen())), []);
  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener("notifications:change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("notifications:change", h);
      window.removeEventListener("storage", h);
    };
  }, [refresh]);
  return items.filter((i) => !seen.has(keyOf(i))).length;
}
