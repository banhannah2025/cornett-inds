import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { newsCategories } from "@/sanity/lib/data";

export function NewsMenu({ dark = false }: { dark?: boolean }) {
  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold uppercase tracking-[0.14em] transition [&::-webkit-details-marker]:hidden ${dark ? "text-[#1e2a24] hover:text-[#a45d2d]" : "text-white/80 hover:text-white"}`}
      >
        News{" "}
        <ChevronDown className="size-3.5 transition group-open:rotate-180" />
      </summary>
      <div className="absolute left-1/2 top-full z-[60] mt-4 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-black/10 bg-[#f6f3eb] p-2 text-[#1e2a24] shadow-2xl shadow-black/20">
        <Link
          className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#ebe7dc]"
          href="/news"
        >
          All news
        </Link>
        <div className="my-1 h-px bg-[#1e2a24]/10" />
        {newsCategories.map((category) => (
          <Link
            className="block rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#ebe7dc]"
            href={`/news/${category.slug}`}
            key={category.slug}
          >
            {category.title}
          </Link>
        ))}
      </div>
    </details>
  );
}
