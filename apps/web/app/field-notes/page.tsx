import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, MapPinned, Route } from "lucide-react";
import { AdminFieldNoteEditor } from "@/components/admin-field-note-editor";
import { EmptyNews } from "@/components/empty-news";
import { PostCard } from "@/components/post-card";
import { getAdminContext } from "@/lib/admin";
import { getAllFieldNotes, getFieldNoteCategories } from "@/sanity/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Field Notes | Blended Works", description: "Personal field notes from Robin and Laura about who we are, our journey, and the places we explore." };
const icons = { "about-us": Heart, "our-journey": Route, locations: MapPinned };

export default async function FieldNotesPage() {
  const [categories, notes, admin] = await Promise.all([getFieldNoteCategories(), getAllFieldNotes(), getAdminContext()]);
  const [featured, ...remaining] = notes;
  return <main><section className="border-b border-[#1e2a24]/10 px-5 py-20 sm:px-8 lg:px-10 lg:py-28"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><div className="flex flex-wrap items-center gap-4"><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">Our field notes</p>{admin.isAdmin && <AdminFieldNoteEditor categories={categories} />}</div><div><h1 className="max-w-4xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">The places we go. <span className="italic text-[#6b786e]">The life we build.</span></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#59665f]">Personal stories about us, the road we are taking together, and the locations that become part of our journey.</p></div></div></section><section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">Explore our journal</p><h2 className="mt-2 font-serif text-4xl">Follow the story.</h2><div className="mt-8 grid gap-4 lg:grid-cols-3">{categories.map((category) => { const Icon = icons[category.slug as keyof typeof icons] ?? Route; return <Link className="group rounded-2xl border border-[#1e2a24]/10 bg-[#ebe7dc] p-6 transition hover:-translate-y-1 hover:bg-[#e4dfd2]" href={`/field-notes/${category.slug}`} key={category.slug}><div className="flex items-start justify-between"><span className="rounded-full bg-[#1e2a24] p-3 text-[#f4b860]"><Icon className="size-5" /></span><ArrowRight className="size-5 transition group-hover:translate-x-1" /></div><h3 className="mt-10 font-serif text-3xl">{category.title}</h3><p className="mt-3 leading-7 text-[#59665f]">{category.description}</p><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#a45d2d]">{category.postCount ?? 0} {(category.postCount ?? 0) === 1 ? "note" : "notes"}</p></Link>; })}</div></div></section><section className="bg-[#dfe5dc] px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">Latest entries</p><h2 className="mb-10 mt-2 font-serif text-4xl sm:text-5xl">From our journal.</h2>{featured ? <div className="space-y-6"><PostCard featured post={featured} routeBase="/field-notes" />{remaining.length > 0 && <div className="grid gap-6 lg:grid-cols-3">{remaining.map((note) => <PostCard key={note._id} post={note} routeBase="/field-notes" />)}</div>}</div> : <EmptyNews category="field note" />}</div></section></main>;
}
