import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ExpandableImage } from "@/components/expandable-image";
import { urlForImage } from "@/sanity/lib/image";
import type { NewsPost } from "@/sanity/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function PostCard({
  post,
  featured = false,
  routeBase = "/news",
}: {
  post: NewsPost;
  featured?: boolean;
  routeBase?: "/news" | "/field-notes";
}) {
  const href = `${routeBase}/${post.category.slug}/${post.slug}`;
  return (
    <article
      className={`group overflow-hidden rounded-[2rem] border border-[#1e2a24]/10 bg-white ${featured ? "lg:grid lg:grid-cols-[1.15fr_0.85fr]" : ""}`}
    >
      <div
        className={`relative overflow-hidden bg-[#dfe5dc] ${featured ? "min-h-72 lg:min-h-[30rem]" : "aspect-[4/3]"}`}
      >
        {post.mainImage?.asset?._ref ? (
          <ExpandableImage
            alt={post.mainImage.alt ?? ""}
            className="absolute inset-0 size-full"
            imageClassName="object-cover transition duration-700 group-hover:scale-[1.025]"
            sizes={
              featured
                ? "(min-width: 1024px) 60vw, 100vw"
                : "(min-width: 1024px) 33vw, 100vw"
            }
            src={urlForImage(post.mainImage)
              .width(featured ? 1400 : 900)
              .height(featured ? 900 : 675)
              .url()}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,#f4b860_0,transparent_28%),linear-gradient(135deg,#263b31,#52695b)]" />
        )}
      </div>
      <div
        className={`flex flex-col justify-center ${featured ? "p-8 sm:p-12" : "p-7"}`}
      >
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[#a45d2d]">
          <Link href={`${routeBase}/${post.category.slug}`}>
            {post.category.title}
          </Link>
          <span className="size-1 rounded-full bg-[#a45d2d]/40" />
          <time dateTime={post.publishedAt}>
            {dateFormatter.format(new Date(post.publishedAt))}
          </time>
        </div>
        <h2
          className={`mt-4 font-serif leading-tight tracking-tight ${featured ? "text-4xl sm:text-5xl" : "text-3xl"}`}
        >
          <Link href={href}>{post.title}</Link>
        </h2>
        <p className="mt-4 leading-7 text-[#59665f]">{post.excerpt}</p>
        <Link
          className="mt-7 inline-flex items-center gap-2 text-sm font-bold"
          href={href}
        >
          Read story{" "}
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
