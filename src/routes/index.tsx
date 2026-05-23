import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
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
  type TmdbPage,
} from "@/services/tmdb";
import {
  useWatchlist,
  useContinueWatching,
  libraryItemToTmdb,
} from "@/lib/library";

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
  const trending = useInfiniteQuery<TmdbPage, Error>({
    queryKey: ["trending"],
    queryFn: ({ pageParam }: any) => fetchTrending((pageParam as number) ?? 1),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
  const watchlist = useWatchlist();
  const continueList = useContinueWatching();

  const trendingItems = trending.data?.pages.flatMap((page) => page.results) ?? [];
  const heroItem: TmdbItem | undefined = trendingItems.find((i) => i.backdrop_path) ?? trendingItems[0];
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
        {continueList.length > 0 && (
          <MovieRow title="Continue Watching" items={continueList.map(libraryItemToTmdb)} />
        )}
        {trendingItems.length > 0 && (
          <MovieRow
            title="Trending Now"
            items={trendingItems}
            onNearEnd={trending.fetchNextPage}
            hasMore={Boolean(trending.hasNextPage)}
            isLoadingMore={trending.isFetchingNextPage}
          />
        )}
        {categories.map((cat) => (
          <CategoryRow key={cat.title} title={cat.title} cat={cat} />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ title, cat }: { title: string; cat: Parameters<typeof fetchCategory>[0] }) {
  const categoryQuery = useInfiniteQuery<TmdbPage, Error>({
    queryKey: ["category", cat.endpoint],
    queryFn: ({ pageParam }: any) => fetchCategory(cat, (pageParam as number) ?? 1),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
  const isLoading = categoryQuery.isLoading;
  const data = categoryQuery.data?.pages.flatMap((page) => page.results) ?? [];
  if (isLoading) {
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
  return (
    <MovieRow
      title={title}
      items={data}
      onNearEnd={categoryQuery.fetchNextPage}
      hasMore={Boolean(categoryQuery.hasNextPage)}
      isLoadingMore={categoryQuery.isFetchingNextPage}
    />
  );
}
