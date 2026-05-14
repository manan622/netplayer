import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { c as cn, s as searchMulti, H as Header, S as Skeleton, t as tmdbImage, g as getTitle } from "./tmdb-XuJQ6q3Y.js";
import { R as Route } from "./router-GQ8IeEp4.js";
import "clsx";
import "tailwind-merge";
import "@tanstack/zod-adapter";
import "zod";
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
function SearchPage() {
  const {
    q
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [value, setValue] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => {
      if (value !== q) navigate({
        search: {
          q: value
        },
        replace: true
      });
    }, 250);
    return () => clearTimeout(t);
  }, [value, q, navigate]);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchMulti(q),
    enabled: q.trim().length > 0
  });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("div", { className: "pt-24 px-4 md:px-12 max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { autoFocus: true, value, onChange: (e) => setValue(e.target.value), placeholder: "Search movies and TV shows...", className: "pl-10 pr-10 h-12 text-base bg-secondary border-border" }),
        value && /* @__PURE__ */ jsx("button", { onClick: () => setValue(""), "aria-label": "Clear", className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsx(X, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 pb-20", children: q.trim().length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center mt-12", children: "Start typing to search for movies and TV shows." }) : isLoading ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: Array.from({
        length: 10
      }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "aspect-[2/3] rounded-md" }, i)) }) : !data || data.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-center mt-12", children: [
        'No results for "',
        q,
        '".'
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: data.map((item) => {
        const img = tmdbImage(item.poster_path, "w500");
        return /* @__PURE__ */ jsxs(Link, { to: "/$mediaType/$id", params: {
          mediaType: item.mediaType ?? "movie",
          id: String(item.id)
        }, className: "group relative aspect-[2/3] rounded-md overflow-hidden bg-card hover:scale-[1.03] transition-transform", children: [
          img ? /* @__PURE__ */ jsx("img", { src: img, alt: getTitle(item), className: "size-full object-cover", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "size-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center", children: getTitle(item) }),
          /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold line-clamp-1", children: getTitle(item) }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-foreground/70", children: [
              item.mediaType === "tv" ? "TV" : "Movie",
              " · ★ ",
              item.vote_average?.toFixed(1)
            ] })
          ] })
        ] }, `${item.mediaType}-${item.id}`);
      }) }) })
    ] })
  ] });
}
export {
  SearchPage as component
};
