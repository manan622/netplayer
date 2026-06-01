import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTitle, tmdbImage, type TmdbItem } from "@/services/tmdb";

const rowScrollState = new Map<string, number>();
const OVERSCAN = 3;
const GAP = 8;

export function MovieRow({
  title,
  items,
  onNearEnd,
  hasMore,
  isLoadingMore,
}: {
  title: string;
  items: TmdbItem[];
  onNearEnd?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const slotWidthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const rangeRef = useRef({ start: 0, end: 10 });
  const [range, setRange] = useState({ start: 0, end: 10 });
  const rowKey = `movie-row:${title || "default"}`;

  const scroll = (dir: 1 | -1) =>
    scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth * 0.9, behavior: "smooth" });

  const applyRange = useCallback(
    (scrollLeft: number, sw: number) => {
      const el = scrollRef.current;
      if (!el || !sw) return;
      const start = Math.max(0, Math.floor(scrollLeft / sw) - OVERSCAN);
      const end = Math.min(items.length, Math.ceil((scrollLeft + el.clientWidth) / sw) + OVERSCAN);
      // Skip if unchanged
      if (rangeRef.current.start === start && rangeRef.current.end === end) return;
      rangeRef.current = { start, end };
      setRange({ start, end });
    },
    [items.length],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      const card = el.querySelector<HTMLElement>("a");
      if (!card) return;
      const sw = card.getBoundingClientRect().width + GAP;
      slotWidthRef.current = sw;
      const saved = rowScrollState.get(rowKey) ?? 0;
      el.scrollLeft = saved;
      applyRange(saved, sw);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, rowKey, applyRange]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    const sw = slotWidthRef.current;
    if (!el || !sw) return;

    const sl = el.scrollLeft;
    rowScrollState.set(rowKey, sl);

    // Cancel any pending frame — only commit the last scroll position per frame
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyRange(sl, sw);

      if (onNearEnd && !isLoadingMore && hasMore) {
        if (sl + el.clientWidth >= el.scrollWidth - sw * 2) onNearEnd();
      }
    });
  }, [rowKey, applyRange, onNearEnd, isLoadingMore, hasMore]);

  // Cleanup pending raf on unmount
  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); }, []);

  const beforeWidth = rangeRef.current.start * slotWidthRef.current;
  const afterWidth = (items.length - rangeRef.current.end) * slotWidthRef.current;

  return (
    <section className="py-6">
      <h2 className="px-4 md:px-12 mb-3 text-xl md:text-2xl font-bold">{title}</h2>
      <div className="group relative">
        <button onClick={() => scroll(-1)} aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ChevronLeft className="size-8" />
        </button>

        <div ref={scrollRef} onScroll={onScroll}
          className="flex gap-2 overflow-x-auto scroll-smooth px-4 md:px-12 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {range.start > 0 && (
            <div style={{ width: beforeWidth, minWidth: beforeWidth, flexShrink: 0 }} aria-hidden />
          )}

          {items.slice(range.start, range.end).map((item) => (
            <MovieCard key={`${item.mediaType}-${item.id}`} item={item} />
          ))}

          {range.end < items.length && (
            <div style={{ width: afterWidth, minWidth: afterWidth, flexShrink: 0 }} aria-hidden />
          )}
        </div>

        {/* {isLoadingMore && hasMore && (
          <div className="mt-3 px-4 md:px-12 text-sm text-muted-foreground">Loading more titles…</div>
        )} */}

        <button onClick={() => scroll(1)} aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ChevronRight className="size-8" />
        </button>
      </div>
    </section>
  );
}

function MovieCard({ item }: { item: TmdbItem }) {
  const img = tmdbImage(item.poster_path, "w500");
  const mediaType = item.mediaType ?? "movie";
  const label = mediaType === "movie" ? "Movie" : "Series";
  return (
    <Link to="/$mediaType/$id" params={{ mediaType, id: String(item.id) }}
      className="relative shrink-0 w-[140px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden bg-card transition-transform duration-300 hover:scale-105 hover:z-10 cursor-pointer">
      {img ? (
        <img src={img} alt={getTitle(item)} className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="size-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
          {getTitle(item)}
        </div>
      )}
      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm">
        {label}
      </span>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-3">
        <div>
          <p className="text-sm font-semibold line-clamp-2">{getTitle(item)}</p>
          <p className="text-xs text-foreground/70 mt-1">★ {item.vote_average?.toFixed(1)}</p>
        </div>
      </div>
    </Link>
  );
}