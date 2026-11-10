const siteOrigin =
  process.env.NEXT_PUBLIC_SITE_URL || "https://cornettinds.vercel.app";

export function siteUrl(path: string) {
  return new URL(path, siteOrigin).href;
}

export function devotionalPath(slug: string) {
  return `/devotionals/${encodeURIComponent(slug)}`;
}
