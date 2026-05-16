import { useEffect, useState, useCallback } from "react";
import type { TmdbItem, MediaType } from "@/services/tmdb";

const WATCHLIST_KEY = "netflix.watchlist.v1";
const CONTINUE_KEY = "netflix.continue.v1";

export interface LibraryItem {
  id: number;
  mediaType: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  overview: string;
  addedAt: number;
  // continue-watching only:
  season?: number;
  episode?: number;
  progress?: number; // seconds watched
  duration?: number; // total seconds
}

const read = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};

const write = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("library:change", { detail: key }));
};

export const toLibraryItem = (
  item: TmdbItem | (Partial<TmdbItem> & { id: number; mediaType: MediaType }),
  extra: Partial<LibraryItem> = {},
): LibraryItem => ({
  id: item.id,
  mediaType: (item.mediaType ?? "movie") as MediaType,
  title: item.title || item.name || "Untitled",
  poster_path: item.poster_path ?? null,
  backdrop_path: item.backdrop_path ?? null,
  vote_average: item.vote_average ?? 0,
  overview: item.overview ?? "",
  addedAt: Date.now(),
  ...extra,
});

const keyOf = (i: { id: number; mediaType: MediaType }) => `${i.mediaType}-${i.id}`;

export const getWatchlist = () => read<LibraryItem>(WATCHLIST_KEY);
export const getContinueWatching = () => read<LibraryItem>(CONTINUE_KEY);

export function toggleWatchlist(item: LibraryItem) {
  const list = getWatchlist();
  const k = keyOf(item);
  const exists = list.some((x) => keyOf(x) === k);
  const next = exists ? list.filter((x) => keyOf(x) !== k) : [item, ...list];
  write(WATCHLIST_KEY, next);
  return !exists;
}

export function isInWatchlist(id: number, mediaType: MediaType) {
  return getWatchlist().some((x) => x.id === id && x.mediaType === mediaType);
}

export function pushContinueWatching(item: LibraryItem) {
  const list = getContinueWatching().filter((x) => keyOf(x) !== keyOf(item));
  const next = [item, ...list].slice(0, 20);
  write(CONTINUE_KEY, next);
}

export function removeContinueWatching(id: number, mediaType: MediaType) {
  const next = getContinueWatching().filter((x) => !(x.id === id && x.mediaType === mediaType));
  write(CONTINUE_KEY, next);
}

export function updateContinueProgress(
  match: { id: number; mediaType: MediaType; season?: number; episode?: number },
  progress: number,
  duration?: number,
) {
  const list = getContinueWatching();
  const idx = list.findIndex(
    (x) =>
      x.id === match.id &&
      x.mediaType === match.mediaType &&
      x.season === match.season &&
      x.episode === match.episode,
  );
  if (idx === -1) return;
  const cur = list[idx];
  // Reset when finished (>95%)
  const finished = duration && progress / duration > 0.95;
  const updated: LibraryItem = {
    ...cur,
    progress: finished ? 0 : Math.floor(progress),
    duration: duration ? Math.floor(duration) : cur.duration,
  };
  const next = [updated, ...list.filter((_, i) => i !== idx)];
  write(CONTINUE_KEY, next);
}

export function getContinueEntry(match: {
  id: number;
  mediaType: MediaType;
  season?: number;
  episode?: number;
}) {
  return getContinueWatching().find(
    (x) =>
      x.id === match.id &&
      x.mediaType === match.mediaType &&
      x.season === match.season &&
      x.episode === match.episode,
  );
}

function useLibraryList(key: string, getter: () => LibraryItem[]) {
  const [list, setList] = useState<LibraryItem[]>([]);
  const refresh = useCallback(() => setList(getter()), [getter]);
  useEffect(() => {
    refresh();
    const onChange = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (!ce.detail || ce.detail === key) refresh();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) refresh();
    };
    window.addEventListener("library:change", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("library:change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, refresh]);
  return list;
}

export const useWatchlist = () => useLibraryList(WATCHLIST_KEY, getWatchlist);
export const useContinueWatching = () => useLibraryList(CONTINUE_KEY, getContinueWatching);

// Convert LibraryItem back to TmdbItem shape for MovieRow
export const libraryItemToTmdb = (i: LibraryItem): TmdbItem => ({
  id: i.id,
  title: i.title,
  overview: i.overview,
  poster_path: i.poster_path,
  backdrop_path: i.backdrop_path,
  vote_average: i.vote_average,
  mediaType: i.mediaType,
});
