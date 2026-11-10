import type { MetadataRoute } from "next";
import { devotionalPath, siteUrl } from "@/lib/site-url";
import { getDevotionals } from "@/sanity/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const devotionals = await getDevotionals();
  return [
    { url: siteUrl("/") },
    { url: siteUrl("/devotionals") },
    ...devotionals.map(({ slug, _updatedAt, publishedAt }) => ({
      url: siteUrl(devotionalPath(slug)),
      lastModified: _updatedAt ?? publishedAt,
    })),
  ];
}
