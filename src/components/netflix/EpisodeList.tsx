import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSeason, tmdbImage } from "@/services/tmdb";
import { cn } from "@/lib/utils";

export function EpisodeList({
  showId,
  totalSeasons,
  onPlay,
  initialSeason,
  highlightEpisode,
}: {
  showId: number;
  totalSeasons: number;
  onPlay: (season: number, episode: number) => void;
  initialSeason?: number;
  highlightEpisode?: number;
}) {
  const [season, setSeason] = useState(initialSeason ?? 1);
  useEffect(() => {
    if (initialSeason) setSeason(initialSeason);
  }, [initialSeason]);
  const { data, isLoading } = useQuery({
    queryKey: ["season", showId, season],
    queryFn: () => fetchSeason(showId, season),
  });
  const highlightRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data, highlightEpisode]);

  const seasons = Array.from({ length: Math.max(1, totalSeasons) }, (_, i) => i + 1);


  return (
    <section className="px-4 md:px-12 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Episodes</h2>
        <select
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="bg-secondary text-foreground rounded-md px-3 py-2 text-sm border border-border"
        >
          {seasons.map((n) => (
            <option key={n} value={n}>
              Season {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-3">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        {data?.episodes.map((ep) => {
          const isResume = highlightEpisode === ep.episode_number && season === (initialSeason ?? season);
          return (
            <button
              key={ep.id}
              ref={isResume ? highlightRef : undefined}
              onClick={() => onPlay(season, ep.episode_number)}
              className={cn(
                "group flex gap-4 text-left p-2 rounded-md transition-colors",
                isResume
                  ? "bg-primary/15 ring-1 ring-primary/40 hover:bg-primary/20"
                  : "hover:bg-secondary/50",
              )}
            >
              <div className="relative shrink-0 w-40 md:w-56 aspect-video rounded overflow-hidden bg-card">
                {ep.still_path ? (
                  <img
                    src={tmdbImage(ep.still_path, "w300")}
                    alt={ep.name}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isResume ? <RotateCcw className="size-10" /> : <Play className="size-10 fill-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {ep.episode_number}. {ep.name}
                  </p>
                  {isResume && (
                    <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                      Continue
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ep.overview}</p>
                {ep.air_date && (
                  <p className="text-xs text-muted-foreground mt-1">{ep.air_date}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
