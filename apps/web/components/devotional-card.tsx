import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { ExpandableImage } from "@/components/expandable-image";
import type { Devotional } from "@/sanity/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function DevotionalCard({
  devotional,
  featured = false,
}: {
  devotional: Devotional;
  featured?: boolean;
}) {
  const href = `/devotionals/${devotional.slug}`;
  return (
    <article
      className={`group overflow-hidden rounded-[2rem] border border-[#1e2a24]/10 bg-white ${featured ? "lg:grid lg:grid-cols-[1.08fr_0.92fr]" : ""}`}
    >
      <div
        className={`relative overflow-hidden bg-[#dfe5dc] ${featured ? "aspect-[16/10] lg:aspect-auto lg:min-h-[31rem]" : "aspect-[4/3]"}`}
      >
        {devotional.mainImage?.assetUrl ? (
          <ExpandableImage
            alt={devotional.mainImage.alt ?? ""}
            className="absolute inset-0 size-full"
            imageClassName="object-contain transition duration-700 group-hover:scale-[1.01]"
            sizes={
              featured
                ? "(min-width: 1024px) 55vw, 100vw"
                : "(min-width: 1024px) 33vw, 100vw"
            }
            src={devotional.mainImage.assetUrl}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,#f5d5a4_0,transparent_24%),linear-gradient(145deg,#22372d,#718073)]">
            <BookOpen
              className="absolute bottom-8 left-8 size-12 text-white/60"
              strokeWidth={1.2}
            />
          </div>
        )}
      </div>
      <div
        className={`flex flex-col justify-center ${featured ? "p-8 sm:p-12" : "p-7"}`}
      >
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[#a45d2d]">
          <span>{devotional.scriptureReference}</span>
          <span className="size-1 rounded-full bg-[#a45d2d]/40" />
          <time dateTime={devotional.publishedAt}>
            {dateFormatter.format(new Date(devotional.publishedAt))}
          </time>
        </div>
        <h2
          className={`mt-4 font-serif leading-tight tracking-tight ${featured ? "text-4xl sm:text-5xl" : "text-3xl"}`}
        >
          <Link href={href}>{devotional.title}</Link>
        </h2>
        <p className="mt-4 leading-7 text-[#59665f]">{devotional.excerpt}</p>
        <Link
          className="mt-7 inline-flex items-center gap-2 text-sm font-bold"
          href={href}
        >
          Read devotional{" "}
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
