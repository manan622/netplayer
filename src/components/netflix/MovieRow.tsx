import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTitle, tmdbImage, type TmdbItem } from "@/services/tmdb";

const rowScrollState = new Map<string, number>();
const OVERSCAN = 3;
const GAP = 8; // matches gap-2

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
  const slotWidthRef = useRef(0); // cardWidth + GAP — the repeating unit
  const [slotWidth, setSlotWidth] = useState(0);
  const [range, setRange] = useState({ start: 0, end: 10 });
  const rowKey = `movie-row:${title || "default"}`;

  const scroll = (dir: 1 | -1) =>
    scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth * 0.9, behavior: "smooth" });

  // Measure one card + gap = the repeating slot unit
  

  const computeRange = useCallback(
    (scrollLeft: number) => {
      const el = scrollRef.current;
      const sw = slotWidthRef.current;
      if (!el || !sw) return;
      const start = Math.max(0, Math.floor(scrollLeft / sw) - OVERSCAN);
      const end = Math.min(items.length, Math.ceil((scrollLeft + el.clientWidth) / sw) + OVERSCAN);
      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    },
    [items.length],
  );

  // Restore scroll + compute initial range once measured
  // Replace your two separate useEffects with this single one:
useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;

  const measure = () => {
    const card = el.querySelector<HTMLElement>("a");
    if (!card) return;
    const sw = card.getBoundingClientRect().width + GAP;
    slotWidthRef.current = sw;
    setSlotWidth(sw);

    // Compute range immediately after measuring — no separate effect needed
    const saved = rowScrollState.get(rowKey) ?? 0;
    el.scrollLeft = saved;
    const start = Math.max(0, Math.floor(saved / sw) - OVERSCAN);
    const end = Math.min(items.length, Math.ceil((saved + el.clientWidth) / sw) + OVERSCAN);
    setRange({ start, end });
  };

  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  return () => ro.disconnect();
}, [items.length, rowKey]); // items.length here ensures re-measure when data loads

  const onScroll = useCallback(() => {
  const el = scrollRef.current;
  const sw = slotWidthRef.current;
  if (!el || !sw) return;

  const sl = el.scrollLeft;
  rowScrollState.set(rowKey, sl);

  const start = Math.max(0, Math.floor(sl / sw) - OVERSCAN);
  const end = Math.min(items.length, Math.ceil((sl + el.clientWidth) / sw) + OVERSCAN);
  setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));

  if (onNearEnd && !isLoadingMore && hasMore) {
    if (sl + el.clientWidth >= el.scrollWidth - sw * 2) onNearEnd();
  }
}, [rowKey, items.length, onNearEnd, isLoadingMore, hasMore]);

  // Spacers fill the exact pixel space of unrendered cards
  // Before: start slots × slotWidth, minus the trailing gap on the last spacer slot
  const beforeWidth = range.start > 0 ? range.start * slotWidth - GAP : 0;
  // After: remaining slots × slotWidth, minus the trailing gap on the last item
  const afterWidth = range.end < items.length ? (items.length - range.end) * slotWidth - GAP : 0;
  // Temporarily add this inside MovieRow, just above the return:
console.log(`[${title}] slotWidth=${slotWidth} range=${range.start}-${range.end} total=${items.length} beforeWidth=${beforeWidth} afterWidth=${afterWidth}`);
  return (
    <section className="py-6">
  
<div className="px-4 md:px-12 mb-3 flex items-center gap-3">
  <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
  <span className="text-sm text-muted-foreground">
    {Math.min(range.end, items.length) - range.start} / {items.length} loaded
  </span>
</div>
      <div className="group relative">
        <button onClick={() => scroll(-1)} aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ChevronLeft className="size-8" />
        </button>

        <div ref={scrollRef} onScroll={onScroll}
          className="flex gap-2 overflow-x-auto scroll-smooth px-4 md:px-12 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {/* Left spacer — holds exact space of unrendered leading cards */}
          {range.start > 0 && (
            <div style={{ width: beforeWidth, minWidth: beforeWidth, flexShrink: 0 }} aria-hidden />
          )}

          {items.slice(range.start, range.end).map((item) => (
            <MovieCard key={`${item.mediaType}-${item.id}`} item={item} />
          ))}

          {/* Right spacer — holds exact space of unrendered trailing cards */}
          {range.end < items.length && (
            <div style={{ width: afterWidth, minWidth: afterWidth, flexShrink: 0 }} aria-hidden />
          )}
        </div>

        {isLoadingMore && hasMore && (
          <div className="mt-3 px-4 md:px-12 text-sm text-muted-foreground">Loading more titles…</div>
        )}

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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-3">
        <div>
          <p className="text-sm font-semibold line-clamp-2">{getTitle(item)}</p>
          <p className="text-xs text-foreground/70 mt-1">★ {item.vote_average?.toFixed(1)}</p>
        </div>
      </div>
    </Link>
  );
}