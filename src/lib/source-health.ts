import { useCallback, useEffect, useRef, useState } from "react";
import { API_SOURCES, getVideoUrl, type PlayTarget } from "@/services/tmdb";

export type SourceStatus = "unknown" | "checking" | "up" | "down";

export interface SourceHealth {
  status: SourceStatus;
  ms?: number;
  checkedAt?: number;
}

const TTL = 10 * 60 * 1000; // 10 minutes
const TIMEOUT = 7000;
const CONCURRENCY = 4;
const STORE_KEY = "netflix.sourcehealth.v1";

type Cache = Record<string, SourceHealth>;

const targetKey = (t: PlayTarget) =>
  `${t.mediaType}-${t.id}-${t.season ?? 0}-${t.episode ?? 0}`;

const cacheKey = (sourceId: string, t: PlayTarget) => `${sourceId}::${targetKey(t)}`;

const readCache = (): Cache => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Cache) : {};
    const now = Date.now();
    // drop stale entries
    for (const k of Object.keys(parsed)) {
      if (!parsed[k]?.checkedAt || now - parsed[k].checkedAt! > TTL) delete parsed[k];
    }
    return parsed;
  } catch {
    return {};
  }
};

const writeCache = (c: Cache) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
};

/**
 * Best-effort reachability probe. Cross-origin embeds can't be read, but a
 * `no-cors` request still rejects when the host is unreachable, refused, or
 * returns nothing — which is exactly the "refused to connect" case.
 */
async function probe(url: string): Promise<SourceHealth> {
  const started = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    await fetch(url, {
      mode: "no-cors",
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: ctrl.signal,
    });
    return { status: "up", ms: Math.round(performance.now() - started), checkedAt: Date.now() };
  } catch {
    return { status: "down", ms: Math.round(performance.now() - started), checkedAt: Date.now() };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>) {
  let i = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

/** Probes every source for the given target and keeps results in state + localStorage. */
export function useSourceHealth(target: PlayTarget | null, enabled: boolean) {
  const [health, setHealth] = useState<Record<string, SourceHealth>>({});
  const [checking, setChecking] = useState(false);
  const ranFor = useRef<string | null>(null);

  const run = useCallback(
    async (force = false) => {
      if (!target) return;
      const tk = targetKey(target);
      if (!force && ranFor.current === tk) return;
      ranFor.current = tk;

      const cache = readCache();
      const initial: Record<string, SourceHealth> = {};
      const todo: string[] = [];
      for (const s of API_SOURCES) {
        const cached = !force ? cache[cacheKey(s.id, target)] : undefined;
        if (cached) initial[s.id] = cached;
        else {
          initial[s.id] = { status: "checking" };
          todo.push(s.id);
        }
      }
      setHealth(initial);
      if (!todo.length) return;

      setChecking(true);
      await runPool(todo, async (id) => {
        const url = getVideoUrl(target, id);
        const result = await probe(url);
        cache[cacheKey(id, target)] = result;
        setHealth((prev) => ({ ...prev, [id]: result }));
      });
      writeCache(cache);
      setChecking(false);
    },
    [target],
  );

  useEffect(() => {
    if (enabled && target) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, target ? targetKey(target) : null]);

  const markDown = useCallback(
    (sourceId: string) => {
      if (!target) return;
      const entry: SourceHealth = { status: "down", checkedAt: Date.now() };
      const cache = readCache();
      cache[cacheKey(sourceId, target)] = entry;
      writeCache(cache);
      setHealth((prev) => ({ ...prev, [sourceId]: entry }));
    },
    [target],
  );

  return { health, checking, recheck: () => run(true), markDown };
}

const rank = (s: SourceStatus) => (s === "up" ? 0 : s === "checking" || s === "unknown" ? 1 : 2);

export function sortSourcesByHealth(
  ids: { id: string }[],
  health: Record<string, SourceHealth>,
  favSource: string | null,
) {
  return [...ids].sort((a, b) => {
    if (a.id === favSource) return -1;
    if (b.id === favSource) return 1;
    const ra = rank(health[a.id]?.status ?? "unknown");
    const rb = rank(health[b.id]?.status ?? "unknown");
    if (ra !== rb) return ra - rb;
    return (health[a.id]?.ms ?? 9999) - (health[b.id]?.ms ?? 9999);
  });
}
