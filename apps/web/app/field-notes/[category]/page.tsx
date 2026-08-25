import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminFieldNoteEditor } from "@/components/admin-field-note-editor";
import { EmptyNews } from "@/components/empty-news";
import { PostCard } from "@/components/post-card";
import { getAdminContext } from "@/lib/admin";
import { getFieldNoteCategories, getFieldNoteCategory, getFieldNotesByCategory } from "@/sanity/lib/data";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/field-notes/[category]">): Promise<Metadata> { const { category: slug } = await params; const category = await getFieldNoteCategory(slug); return category ? { title: `${category.title} Field Notes | Blended Works`, description: category.description } : { title: "Field Notes | Blended Works" }; }
export default async function FieldNoteCategoryPage({ params }: PageProps<"/field-notes/[category]">) { const { category: slug } = await params; const [category, notes, categories, admin] = await Promise.all([getFieldNoteCategory(slug), getFieldNotesByCategory(slug), getFieldNoteCategories(), getAdminContext()]); if (!category) notFound(); return <main><section className="border-b border-[#1e2a24]/10 px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-center justify-between gap-4"><Link className="inline-flex items-center gap-2 text-sm font-bold text-[#a45d2d]" href="/field-notes"><ArrowLeft className="size-4" /> All field notes</Link>{admin.isAdmin && <AdminFieldNoteEditor categories={categories} defaultCategoryId={category._id} />}</div><div className="mt-12 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">Our journal</p><div><h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-7xl">{category.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#59665f]">{category.description}</p></div></div></div></section><section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="mx-auto max-w-7xl">{notes.length ? <div className="grid gap-6 lg:grid-cols-3">{notes.map((note) => <PostCard key={note._id} post={note} routeBase="/field-notes" />)}</div> : <EmptyNews category={category.title.toLowerCase()} />}</div></section></main>; }
