import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTitle, tmdbImage, type TmdbItem } from "@/services/tmdb";

export function MovieRow({ title, items }: { title: string; items: TmdbItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className="py-6">
      <h2 className="px-4 md:px-12 mb-3 text-xl md:text-2xl font-bold">{title}</h2>
      <div className="group relative">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronLeft className="size-8" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth px-4 md:px-12 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <MovieCard key={`${item.mediaType}-${item.id}`} item={item} />
          ))}
        </div>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
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
    <Link
      to="/$mediaType/$id"
      params={{ mediaType, id: String(item.id) }}
      className="relative shrink-0 w-[140px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden bg-card transition-transform duration-300 hover:scale-105 hover:z-10 cursor-pointer"
    >
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
