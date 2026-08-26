import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { fieldNoteCategories } from "@/sanity/lib/data";

export function FieldNotesMenu({ dark = false }: { dark?: boolean }) {
  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold uppercase tracking-[0.14em] transition [&::-webkit-details-marker]:hidden ${dark ? "text-[#1e2a24] hover:text-[#a45d2d]" : "text-white/80 hover:text-white"}`}
      >
        Field Notes
        <ChevronDown className="size-3.5 transition group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-full z-[60] mt-4 max-h-[min(70vh,32rem)] w-64 max-w-[calc(100vw-3rem)] overflow-x-hidden overflow-y-auto rounded-2xl border border-black/10 bg-[#f6f3eb] p-2 text-[#1e2a24] shadow-2xl shadow-black/20 sm:left-1/2 sm:-translate-x-1/2">
        <Link
          className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#ebe7dc]"
          href="/field-notes"
        >
          All field notes
        </Link>
        <Link
          className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#ebe7dc]"
          href="/devotionals"
        >
          Daily devotionals
        </Link>
        <div className="my-1 h-px bg-[#1e2a24]/10" />
        {fieldNoteCategories.map((category) => (
          <Link
            className="block rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#ebe7dc]"
            href={`/field-notes/${category.slug}`}
            key={category.slug}
          >
            {category.title}
          </Link>
        ))}
      </div>
    </details>
  );
}
