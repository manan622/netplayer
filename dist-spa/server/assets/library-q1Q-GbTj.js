import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { c as cn, t as tmdbImage, g as getTitle } from "./tmdb-XuJQ6q3Y.js";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
function MovieRow({ title, items }) {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  return /* @__PURE__ */ jsxs("section", { className: "py-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "px-4 md:px-12 mb-3 text-xl md:text-2xl font-bold", children: title }),
    /* @__PURE__ */ jsxs("div", { className: "group relative", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => scroll(-1),
          "aria-label": "Scroll left",
          className: "absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
          children: /* @__PURE__ */ jsx(ChevronLeft, { className: "size-8" })
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          ref: scrollRef,
          className: "flex gap-2 overflow-x-auto scroll-smooth px-4 md:px-12 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          children: items.map((item) => /* @__PURE__ */ jsx(MovieCard, { item }, `${item.mediaType}-${item.id}`))
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => scroll(1),
          "aria-label": "Scroll right",
          className: "absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
          children: /* @__PURE__ */ jsx(ChevronRight, { className: "size-8" })
        }
      )
    ] })
  ] });
}
function MovieCard({ item }) {
  const img = tmdbImage(item.poster_path, "w500");
  const mediaType = item.mediaType ?? "movie";
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to: "/$mediaType/$id",
      params: { mediaType, id: String(item.id) },
      className: "relative shrink-0 w-[140px] md:w-[200px] aspect-[2/3] rounded-md overflow-hidden bg-card transition-transform duration-300 hover:scale-105 hover:z-10 cursor-pointer",
      children: [
        img ? /* @__PURE__ */ jsx("img", { src: img, alt: getTitle(item), className: "size-full object-cover", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "size-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center", children: getTitle(item) }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-3", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold line-clamp-2", children: getTitle(item) }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-foreground/70 mt-1", children: [
            "★ ",
            item.vote_average?.toFixed(1)
          ] })
        ] }) })
      ]
    }
  );
}
const WATCHLIST_KEY = "netflix.watchlist.v1";
const CONTINUE_KEY = "netflix.continue.v1";
const read = (key) => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const write = (key, value) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("library:change", { detail: key }));
};
const toLibraryItem = (item, extra = {}) => ({
  id: item.id,
  mediaType: item.mediaType ?? "movie",
  title: item.title || item.name || "Untitled",
  poster_path: item.poster_path ?? null,
  backdrop_path: item.backdrop_path ?? null,
  vote_average: item.vote_average ?? 0,
  overview: item.overview ?? "",
  addedAt: Date.now(),
  ...extra
});
const keyOf = (i) => `${i.mediaType}-${i.id}`;
const getWatchlist = () => read(WATCHLIST_KEY);
const getContinueWatching = () => read(CONTINUE_KEY);
function toggleWatchlist(item) {
  const list = getWatchlist();
  const k = keyOf(item);
  const exists = list.some((x) => keyOf(x) === k);
  const next = exists ? list.filter((x) => keyOf(x) !== k) : [item, ...list];
  write(WATCHLIST_KEY, next);
  return !exists;
}
function pushContinueWatching(item) {
  const list = getContinueWatching().filter((x) => keyOf(x) !== keyOf(item));
  const next = [item, ...list].slice(0, 20);
  write(CONTINUE_KEY, next);
}
function useLibraryList(key, getter) {
  const [list, setList] = useState([]);
  const refresh = useCallback(() => setList(getter()), [getter]);
  useEffect(() => {
    refresh();
    const onChange = (e) => {
      const ce = e;
      if (!ce.detail || ce.detail === key) refresh();
    };
    const onStorage = (e) => {
      if (e.key === key) refresh();
    };
    window.addEventListener("library:change", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("library:change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, refresh]);
  return list;
}
const useWatchlist = () => useLibraryList(WATCHLIST_KEY, getWatchlist);
const useContinueWatching = () => useLibraryList(CONTINUE_KEY, getContinueWatching);
const libraryItemToTmdb = (i) => ({
  id: i.id,
  title: i.title,
  overview: i.overview,
  poster_path: i.poster_path,
  backdrop_path: i.backdrop_path,
  vote_average: i.vote_average,
  mediaType: i.mediaType
});
export {
  Button as B,
  MovieRow as M,
  useContinueWatching as a,
  toLibraryItem as b,
  libraryItemToTmdb as l,
  pushContinueWatching as p,
  toggleWatchlist as t,
  useWatchlist as u
};
