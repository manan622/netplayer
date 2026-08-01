/**
 * Deep links for handing the current stream URL off to a native video player.
 * Android uses `intent://` URLs with an explicit package; iOS/desktop players
 * register their own custom schemes.
 */

export type ExternalPlayerPlatform = "android" | "ios" | "desktop";

export interface ExternalPlayer {
  id: string;
  name: string;
  hint: string;
  platforms: ExternalPlayerPlatform[];
  build: (url: string, title?: string) => string;
}

const androidIntent = (pkg: string) => (url: string, title?: string) => {
  const stripped = url.replace(/^https?:\/\//, "");
  const scheme = url.startsWith("https") ? "https" : "http";
  const t = title ? `S.title=${encodeURIComponent(title)};` : "";
  return `intent://${stripped}#Intent;scheme=${scheme};package=${pkg};type=video/*;${t}end`;
};

export const EXTERNAL_PLAYERS: ExternalPlayer[] = [
  {
    id: "mx",
    name: "MX Player",
    hint: "Android",
    platforms: ["android"],
    build: androidIntent("com.mxtech.videoplayer.ad"),
  },
  {
    id: "mxpro",
    name: "MX Player Pro",
    hint: "Android",
    platforms: ["android"],
    build: androidIntent("com.mxtech.videoplayer.pro"),
  },
  {
    id: "vlc-android",
    name: "VLC",
    hint: "Android",
    platforms: ["android"],
    build: androidIntent("org.videolan.vlc"),
  },
  {
    id: "just",
    name: "Just Player",
    hint: "Android",
    platforms: ["android"],
    build: androidIntent("com.brouken.player"),
  },
  {
    id: "vlc-ios",
    name: "VLC",
    hint: "iOS / Desktop",
    platforms: ["ios", "desktop"],
    build: (url) => `vlc://${url}`,
  },
  {
    id: "nplayer",
    name: "nPlayer",
    hint: "iOS",
    platforms: ["ios"],
    build: (url) => `nplayer-${url}`,
  },
  {
    id: "infuse",
    name: "Infuse",
    hint: "iOS / Apple TV",
    platforms: ["ios"],
    build: (url) => `infuse://x-callback-url/play?url=${encodeURIComponent(url)}`,
  },
  {
    id: "outplayer",
    name: "Outplayer",
    hint: "iOS",
    platforms: ["ios"],
    build: (url) => `outplayer://${url}`,
  },
  {
    id: "potplayer",
    name: "PotPlayer",
    hint: "Windows",
    platforms: ["desktop"],
    build: (url) => `potplayer://${url}`,
  },
];

export function detectPlatform(): ExternalPlayerPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document)) return "ios";
  return "desktop";
}

export function playersForPlatform(p: ExternalPlayerPlatform): ExternalPlayer[] {
  const mine = EXTERNAL_PLAYERS.filter((x) => x.platforms.includes(p));
  const rest = EXTERNAL_PLAYERS.filter((x) => !x.platforms.includes(p));
  return [...mine, ...rest];
}

export function openInExternalPlayer(player: ExternalPlayer, url: string, title?: string) {
  const deep = player.build(url, title);
  // Assigning location keeps the app page intact if the handler is missing.
  window.location.href = deep;
}

/**
 * External apps (MX Player, VLC, Infuse…) can only play a *media* URL —
 * .m3u8 / .mpd / .mp4 / .mkv or a magnet link. Every embed source we use
 * returns an HTML web player that resolves the real stream in JavaScript,
 * so handing that URL to MX Player yields "unsupported format" or a blank
 * screen. Use this to gate the UI instead of failing silently.
 */
export function isDirectStream(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("magnet:")) return true;
  const path = url.split("?")[0].split("#")[0].toLowerCase();
  return /\.(m3u8|mpd|mp4|mkv|webm|avi|mov|ts)$/.test(path);
}

/**
 * Android-only: hand the link to the system chooser without forcing a
 * package, so the user can pick a browser or any app that claims the URL.
 */
export function openWithChooser(url: string, title?: string) {
  const stripped = url.replace(/^https?:\/\//, "");
  const scheme = url.startsWith("https") ? "https" : "http";
  const t = title ? `S.title=${encodeURIComponent(title)};` : "";
  window.location.href = `intent://${stripped}#Intent;scheme=${scheme};${t}end`;
}
