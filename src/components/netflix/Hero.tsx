import { Play, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getTitle, tmdbImage, type TmdbItem } from "@/services/tmdb";

export function Hero({ item }: { item: TmdbItem }) {
  const bg = tmdbImage(item.backdrop_path, "original");
  return (
    <section className="relative h-[85vh] min-h-[520px] w-full overflow-hidden">
      {bg && (
        <img
          src={bg}
          alt={getTitle(item)}
          className="absolute inset-0 size-full object-cover"
          loading="eager"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end pb-24 md:justify-center md:pb-0 px-4 md:px-12 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-lg">
          {getTitle(item)}
        </h1>
        <p className="mt-4 text-sm md:text-lg text-foreground/90 line-clamp-3 max-w-xl drop-shadow">
          {item.overview}
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-semibold">
            <Link to="/$mediaType/$id" params={{ mediaType: item.mediaType ?? "movie", id: String(item.id) }}>
              <Play className="size-5 fill-current" /> Play
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="bg-foreground/20 hover:bg-foreground/30 backdrop-blur font-semibold">
            <Link to="/$mediaType/$id" params={{ mediaType: item.mediaType ?? "movie", id: String(item.id) }}>
              <Info className="size-5" /> More Info
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
