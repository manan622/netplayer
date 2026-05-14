import { jsxs, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { t as tmdbImage, g as getTitle, f as fetchTrending, H as Header, S as Skeleton, M as MOVIE_CATEGORIES, T as TV_CATEGORIES, a as fetchCategory } from "./tmdb-XuJQ6q3Y.js";
import { Play, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { B as Button, u as useWatchlist, a as useContinueWatching, M as MovieRow, l as libraryItemToTmdb } from "./library-q1Q-GbTj.js";
import "react";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
function Hero({ item }) {
  const bg = tmdbImage(item.backdrop_path, "original");
  return /* @__PURE__ */ jsxs("section", { className: "relative h-[85vh] min-h-[520px] w-full overflow-hidden", children: [
    bg && /* @__PURE__ */ jsx(
      "img",
      {
        src: bg,
        alt: getTitle(item),
        className: "absolute inset-0 size-full object-cover",
        loading: "eager"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex h-full flex-col justify-end pb-24 md:justify-center md:pb-0 px-4 md:px-12 max-w-3xl", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-6xl font-black tracking-tight drop-shadow-lg", children: getTitle(item) }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm md:text-lg text-foreground/90 line-clamp-3 max-w-xl drop-shadow", children: item.overview }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "bg-white text-black hover:bg-white/90 font-semibold", children: /* @__PURE__ */ jsxs(Link, { to: "/$mediaType/$id", params: { mediaType: item.mediaType ?? "movie", id: String(item.id) }, children: [
          /* @__PURE__ */ jsx(Play, { className: "size-5 fill-current" }),
          " Play"
        ] }) }),
        /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", variant: "secondary", className: "bg-foreground/20 hover:bg-foreground/30 backdrop-blur font-semibold", children: /* @__PURE__ */ jsxs(Link, { to: "/$mediaType/$id", params: { mediaType: item.mediaType ?? "movie", id: String(item.id) }, children: [
          /* @__PURE__ */ jsx(Info, { className: "size-5" }),
          " More Info"
        ] }) })
      ] })
    ] })
  ] });
}
function Home() {
  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: fetchTrending
  });
  const watchlist = useWatchlist();
  const continueList = useContinueWatching();
  const heroItem = trending.data?.find((i) => i.backdrop_path) ?? trending.data?.[0];
  const categories = [...MOVIE_CATEGORIES, ...TV_CATEGORIES];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsx(Header, {}),
    heroItem ? /* @__PURE__ */ jsx(Hero, { item: heroItem }) : /* @__PURE__ */ jsx(Skeleton, { className: "h-[85vh] min-h-[520px] w-full rounded-none" }),
    /* @__PURE__ */ jsxs("div", { className: "-mt-24 relative z-10 pb-20", children: [
      continueList.length > 0 && /* @__PURE__ */ jsx(MovieRow, { title: "Continue Watching", items: continueList.map(libraryItemToTmdb) }),
      watchlist.length > 0 && /* @__PURE__ */ jsx(MovieRow, { title: "My List", items: watchlist.map(libraryItemToTmdb) }),
      trending.data && /* @__PURE__ */ jsx(MovieRow, { title: "Trending Now", items: trending.data }),
      categories.map((cat) => /* @__PURE__ */ jsx(CategoryRow, { title: cat.title, cat }, cat.title))
    ] })
  ] });
}
function CategoryRow({
  title,
  cat
}) {
  const {
    data
  } = useQuery({
    queryKey: ["category", cat.endpoint],
    queryFn: () => fetchCategory(cat)
  });
  if (!data) {
    return /* @__PURE__ */ jsxs("section", { className: "py-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "px-4 md:px-12 mb-3 text-xl md:text-2xl font-bold", children: title }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2 px-4 md:px-12 overflow-hidden", children: Array.from({
        length: 6
      }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "w-[140px] md:w-[200px] aspect-[2/3] rounded-md" }, i)) })
    ] });
  }
  return /* @__PURE__ */ jsx(MovieRow, { title, items: data });
}
export {
  Home as component
};
