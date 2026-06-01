import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchCategory, tmdbImage, getTitle, type TmdbItem } from "@/services/tmdb";
import { markAllSeen, useUnreadCount } from "@/lib/notifications";
import { cn } from "@/lib/utils";

async function fetchNotifications(): Promise<TmdbItem[]> {
  const [upcoming, nowPlaying, onAir] = await Promise.all([
    fetchCategory({ title: "", endpoint: "/movie/upcoming", mediaType: "movie" }),
    fetchCategory({ title: "", endpoint: "/movie/now_playing", mediaType: "movie" }),
    fetchCategory({ title: "", endpoint: "/tv/on_the_air", mediaType: "tv" }),
  ]);
  // Tag each so users know why they appear
  const tagged = [
    ...upcoming.results.slice(0, 6).map((i) => ({ ...i, _tag: "New Release" as const })),
    ...onAir.results.slice(0, 6).map((i) => ({ ...i, _tag: "New Series" as const })),
    ...nowPlaying.results.slice(0, 4).map((i) => ({ ...i, _tag: "Now Playing" as const })),
  ];
  return tagged;
}

export function NotificationsButton() {
  const { data = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 1000 * 60 * 30,
  });
  const unread = useUnreadCount(data);

  return (
    <Popover onOpenChange={(open) => open && data.length > 0 && markAllSeen(data)}>
      <PopoverTrigger asChild>
        <button
          className="relative text-foreground/90 hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[360px] max-h-[70vh] overflow-y-auto p-0 border-border bg-popover/95 backdrop-blur"
      >
        <div className="px-4 py-3 border-b border-border sticky top-0 bg-popover/95 backdrop-blur">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-xs text-muted-foreground">New movies & series for you</p>
        </div>
        <ul className="divide-y divide-border">
          {data.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground text-center">
              No notifications yet.
            </li>
          )}
          {data.map((item) => {
            const tag = (item as TmdbItem & { _tag?: string })._tag;
            const img = tmdbImage(item.backdrop_path || item.poster_path, "w300");
            return (
              <li key={`${item.mediaType}-${item.id}`}>
                <Link
                  to="/$mediaType/$id"
                  params={{
                    mediaType: item.mediaType ?? "movie",
                    id: String(item.id),
                  }}
                  className="flex gap-3 p-3 hover:bg-accent/40 transition-colors"
                >
                  <div className="shrink-0 w-20 aspect-video rounded overflow-hidden bg-card">
                    {img && (
                      <img
                        src={img}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{getTitle(item)}</p>
                    <p
                      className={cn(
                        "text-[10px] uppercase tracking-wide font-semibold mt-0.5",
                        tag === "New Series" ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {tag}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {item.overview}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
