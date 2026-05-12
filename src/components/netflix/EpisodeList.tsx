import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSeason, tmdbImage } from "@/services/tmdb";

export function EpisodeList({
  showId,
  totalSeasons,
  onPlay,
}: {
  showId: number;
  totalSeasons: number;
  onPlay: (season: number, episode: number) => void;
}) {
  const [season, setSeason] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["season", showId, season],
    queryFn: () => fetchSeason(showId, season),
  });

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
        {data?.episodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onPlay(season, ep.episode_number)}
            className="group flex gap-4 text-left p-2 rounded-md hover:bg-secondary/50 transition-colors"
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
                <Play className="size-10 fill-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {ep.episode_number}. {ep.name}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ep.overview}</p>
              {ep.air_date && (
                <p className="text-xs text-muted-foreground mt-1">{ep.air_date}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
