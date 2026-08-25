import Link from "next/link";

export function EmptyNews({ category }: { category?: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#1e2a24]/25 bg-[#ebe7dc]/60 px-6 py-16 text-center">
      <p className="font-serif text-3xl">
        The first {category ? `${category} ` : ""}field note is on its way.
      </p>
      <p className="mx-auto mt-3 max-w-lg leading-7 text-[#59665f]">
        Robin and Laura are preparing practical, firsthand stories. Check back
        soon, or browse another category.
      </p>
      {category && (
        <Link
          className="mt-6 inline-block text-sm font-bold text-[#a45d2d]"
          href="/news"
        >
          View all news
        </Link>
      )}
    </div>
  );
}
