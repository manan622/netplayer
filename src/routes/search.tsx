import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search as SearchIcon, X } from "lucide-react";
import { Header } from "@/components/netflix/Header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { searchMulti, getTitle, tmdbImage } from "@/services/tmdb";

const schema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(schema),
  component: SearchPage,
  head: () => ({ meta: [{ title: "Search — Netflix Clone" }] }),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [value, setValue] = useState(q);

  // Debounce input → URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (value !== q) navigate({ search: { q: value }, replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [value, q, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchMulti(q),
    enabled: q.trim().length > 0,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="pt-24 px-4 md:px-12 max-w-6xl mx-auto">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search movies and TV shows..."
            className="pl-10 pr-10 h-12 text-base bg-secondary border-border"
          />
          {value && (
            <button
              onClick={() => setValue("")}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        <div className="mt-8 pb-20">
          {q.trim().length === 0 ? (
            <p className="text-muted-foreground text-center mt-12">
              Start typing to search for movies and TV shows.
            </p>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-md" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-muted-foreground text-center mt-12">
              No results for "{q}".
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.map((item) => {
                const img = tmdbImage(item.poster_path, "w500");
                return (
                  <Link
                    key={`${item.mediaType}-${item.id}`}
                    to="/$mediaType/$id"
                    params={{ mediaType: item.mediaType ?? "movie", id: String(item.id) }}
                    className="group relative aspect-[2/3] rounded-md overflow-hidden bg-card hover:scale-[1.03] transition-transform"
                  >
                    {img ? (
                      <img src={img} alt={getTitle(item)} className="size-full object-cover" loading="lazy" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                        {getTitle(item)}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-sm font-semibold line-clamp-1">{getTitle(item)}</p>
                      <p className="text-xs text-foreground/70">
                        {item.mediaType === "tv" ? "TV" : "Movie"} · ★ {item.vote_average?.toFixed(1)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
