import type { Metadata } from "next";
import { BookHeart } from "lucide-react";
import { DevotionalCard } from "@/components/devotional-card";
import { getDevotionals } from "@/sanity/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daily Devotionals | Blended Works", description: "Daily Scripture, reflection, and encouragement from Robin's work at the mission." };

export default async function DevotionalsPage() {
  const devotionals = await getDevotionals();
  const [latest, ...earlier] = devotionals;
  return (
    <main>
      <section className="border-b border-[#1e2a24]/10 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div><span className="inline-flex rounded-full bg-[#1e2a24] p-3 text-[#f4b860]"><BookHeart className="size-6" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">From the mission</p></div>
          <div><h1 className="max-w-4xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">A quiet word for <span className="italic text-[#6b786e]">the day ahead.</span></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#59665f]">Daily Scripture, honest reflection, and encouragement shaped by the people and moments I encounter through my work at the mission.</p></div>
        </div>
      </section>
      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          {latest ? <div className="space-y-10"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">Today&rsquo;s reflection</p><h2 className="mt-2 font-serif text-4xl">Begin here.</h2></div><DevotionalCard devotional={latest} featured />{earlier.length > 0 && <><div className="border-t border-[#1e2a24]/10 pt-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">Earlier devotionals</p><h2 className="mt-2 font-serif text-4xl">Return whenever you need.</h2></div><div className="grid gap-6 lg:grid-cols-3">{earlier.map((devotional) => <DevotionalCard devotional={devotional} key={devotional._id} />)}</div></>}</div> : <div className="rounded-[2rem] border border-[#1e2a24]/10 bg-[#ebe7dc] px-6 py-20 text-center"><BookHeart className="mx-auto size-10 text-[#a45d2d]" strokeWidth={1.4} /><h2 className="mt-6 font-serif text-4xl">The first devotional is coming soon.</h2><p className="mx-auto mt-4 max-w-lg leading-7 text-[#59665f]">A place for Scripture, reflection, prayer, and the lessons that meet us in the work.</p></div>}
        </div>
      </section>
    </main>
  );
}
