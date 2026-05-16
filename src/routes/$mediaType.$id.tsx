import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, ArrowLeft, Plus, Check, RotateCcw } from "lucide-react";
import {
  toLibraryItem,
  toggleWatchlist,
  useWatchlist,
  pushContinueWatching,
  useContinueWatching,
} from "@/lib/library";
import { Header } from "@/components/netflix/Header";
import { MovieRow } from "@/components/netflix/MovieRow";
import { EpisodeList } from "@/components/netflix/EpisodeList";
import { PlayerDialog } from "@/components/netflix/PlayerDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchDetails,
  fetchRecommendations,
  fetchSeason,
  getTitle,
  tmdbImage,
  type MediaType,
  type PlayTarget,
} from "@/services/tmdb";

export const Route = createFileRoute("/$mediaType/$id")({
  component: DetailPage,
  beforeLoad: ({ params }) => {
    if (params.mediaType !== "movie" && params.mediaType !== "tv") throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `Watch ${params.mediaType === "tv" ? "Show" : "Movie"} — Netflix Clone` }],
  }),
});

function DetailPage() {
  const { mediaType, id } = Route.useParams();
  const m = mediaType as MediaType;
  const showId = Number(id);

  const details = useQuery({
    queryKey: ["details", m, showId],
    queryFn: () => fetchDetails(m, showId),
  });
  const recs = useQuery({
    queryKey: ["recs", m, showId],
    queryFn: () => fetchRecommendations(m, showId),
  });

  const [playOpen, setPlayOpen] = useState(false);
  const [target, setTarget] = useState<PlayTarget | null>(null);

  const data = details.data;
  const watchlist = useWatchlist();
  const continueList = useContinueWatching();
  const inList = !!data && watchlist.some((x) => x.id === showId && x.mediaType === m);
  const resume = continueList.find((x) => x.id === showId && x.mediaType === m);
  const resumeSeason = resume?.season;
  const resumeEpisode = resume?.episode;

  const recordContinue = (extra: { season?: number; episode?: number } = {}) => {
    if (!data) return;
    pushContinueWatching(toLibraryItem({ ...data, mediaType: m }, extra));
  };

  const playMovie = () => {
    setTarget({ id: showId, mediaType: m });
    setPlayOpen(true);
    recordContinue();
  };
  const playEpisode = (season: number, episode: number) => {
    setTarget({ id: showId, mediaType: "tv", season, episode });
    setPlayOpen(true);
    recordContinue({ season, episode });
  };

  const onToggleList = () => {
    if (!data) return;
    toggleWatchlist(toLibraryItem({ ...data, mediaType: m }));
  };

  const bg = data?.backdrop_path ? tmdbImage(data.backdrop_path, "original") : "";
  const year = (data?.release_date || data?.first_air_date || "").slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <section className="relative w-full h-[70vh] min-h-[420px] overflow-hidden bg-card">
        {bg && (
          <img
            src={bg}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500"
            onLoad={(e) => e.currentTarget.classList.replace("opacity-0", "opacity-100")}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <Link
          to="/"
          className="absolute top-20 left-4 md:left-12 z-20 inline-flex items-center gap-2 text-foreground/90 hover:text-foreground"
        >
          <ArrowLeft className="size-5" /> Back
        </Link>
        <div className="relative z-10 h-full flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-4 md:px-12 max-w-3xl">
          {details.isLoading ? (
            <Skeleton className="h-12 w-80" />
          ) : data ? (
            <>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-lg">
                {getTitle(data)}
              </h1>
              <div className="mt-3 flex items-center gap-3 text-sm text-foreground/80">
                {year && <span>{year}</span>}
                <span>★ {data.vote_average?.toFixed(1)}</span>
                {data.number_of_seasons && <span>{data.number_of_seasons} Season{data.number_of_seasons > 1 ? "s" : ""}</span>}
                {data.runtime ? <span>{data.runtime} min</span> : null}
              </div>
              {data.genres && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.genres.map((g) => (
                    <span key={g.id} className="text-xs px-2 py-1 rounded-full bg-secondary text-foreground/90">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-4 text-sm md:text-base text-foreground/90 max-w-xl line-clamp-4">
                {data.overview}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {m === "movie" && (
                  <Button size="lg" onClick={playMovie} className="bg-white text-black hover:bg-white/90 font-semibold">
                    <Play className="size-5 fill-current" /> Play
                  </Button>
                )}
                {m === "tv" && (
                  <>
                    {resumeSeason && resumeEpisode ? (
                      <>
                        <Button
                          size="lg"
                          onClick={() => playEpisode(resumeSeason, resumeEpisode)}
                          className="bg-white text-black hover:bg-white/90 font-semibold"
                        >
                          <RotateCcw className="size-5" /> Resume S{resumeSeason} · E{resumeEpisode}
                        </Button>
                        <Button
                          size="lg"
                          variant="secondary"
                          onClick={() => playEpisode(1, 1)}
                          className="font-semibold"
                        >
                          <Play className="size-5 fill-current" /> Start Over
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => playEpisode(1, 1)}
                        className="bg-white text-black hover:bg-white/90 font-semibold"
                      >
                        <Play className="size-5 fill-current" /> Play S1 · E1
                      </Button>
                    )}
                  </>
                )}
                <Button size="lg" variant="secondary" onClick={onToggleList}>
                  {inList ? <Check className="size-5" /> : <Plus className="size-5" />}
                  {inList ? "In My List" : "My List"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {m === "tv" && data && (
        <EpisodeList
          showId={showId}
          totalSeasons={data.number_of_seasons ?? 1}
          onPlay={playEpisode}
          initialSeason={resumeSeason}
          highlightEpisode={resumeEpisode}
        />
      )}

      <div className="pb-20">
        {recs.data && recs.data.length > 0 && <MovieRow title="More Like This" items={recs.data} />}
      </div>

      <PlayerDialog open={playOpen} onOpenChange={setPlayOpen} target={target} />
    </div>
  );
}
