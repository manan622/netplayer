import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/netflix/Header";
import { Hero } from "@/components/netflix/Hero";
import { MovieRow } from "@/components/netflix/MovieRow";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchTrending,
  fetchCategory,
  MOVIE_CATEGORIES,
  TV_CATEGORIES,
  type TmdbItem,
} from "@/services/tmdb";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Netflix Clone — Stream Movies & TV Shows" },
      {
        name: "description",
        content: "Browse trending movies and TV shows powered by TMDB.",
      },
    ],
  }),
});

function Home() {
  const trending = useQuery({ queryKey: ["trending"], queryFn: fetchTrending });

  const heroItem: TmdbItem | undefined = trending.data?.find((i) => i.backdrop_path) ?? trending.data?.[0];
  const categories = [...MOVIE_CATEGORIES, ...TV_CATEGORIES];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      {heroItem ? (
        <Hero item={heroItem} />
      ) : (
        <Skeleton className="h-[85vh] min-h-[520px] w-full rounded-none" />
      )}
      <div className="-mt-24 relative z-10 pb-20">
        {trending.data && <MovieRow title="Trending Now" items={trending.data} />}
        {categories.map((cat) => (
          <CategoryRow key={cat.title} title={cat.title} cat={cat} />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ title, cat }: { title: string; cat: Parameters<typeof fetchCategory>[0] }) {
  const { data } = useQuery({
    queryKey: ["category", cat.endpoint],
    queryFn: () => fetchCategory(cat),
  });
  if (!data) {
    return (
      <section className="py-6">
        <h2 className="px-4 md:px-12 mb-3 text-xl md:text-2xl font-bold">{title}</h2>
        <div className="flex gap-2 px-4 md:px-12 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-[140px] md:w-[200px] aspect-[2/3] rounded-md" />
          ))}
        </div>
      </section>
    );
  }
  return <MovieRow title={title} items={data} />;
}
