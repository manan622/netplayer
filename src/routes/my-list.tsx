import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/netflix/Header";
import { MovieRow } from "@/components/netflix/MovieRow";
import { useWatchlist, libraryItemToTmdb } from "@/lib/library";

export const Route = createFileRoute("/my-list")({
  component: MyListPage,
  head: () => ({ meta: [{ title: "My List — Netflix Clone" }] }),
});

function MyListPage() {
  const watchlist = useWatchlist();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 px-4 md:px-12 max-w mx-auto pb-20">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 align-items-center text-center">My List</h1>

        {watchlist.length === 0 ? (
          <div className="rounded-2xl border border-border bg-secondary p-10 text-center text-muted-foreground">
            Your list is empty. Add titles from the details page to save them here.
          </div>
        ) : (
          <MovieRow title="" items={watchlist.map(libraryItemToTmdb)} />
        )}
      </main>
    </div>
  );
}
