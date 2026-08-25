import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  Cpu,
  PackageOpen,
  TentTree,
  Truck,
  Warehouse,
} from "lucide-react";
import { EmptyNews } from "@/components/empty-news";
import { PostCard } from "@/components/post-card";
import { AdminPostEditor } from "@/components/admin-post-editor";
import { getAdminContext } from "@/lib/admin";
import { getAllPosts, getCategories } from "@/sanity/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "News & Field Notes | Blended Works",
  description:
    "Practical news and firsthand field notes about remote-work technology, shelter, power, camping gear, transportation, and life on the road.",
};

const icons = {
  tech: Cpu,
  necessities: PackageOpen,
  shelter: Warehouse,
  power: BatteryCharging,
  "camping-gear": TentTree,
  transportation: Truck,
};

export default async function NewsPage() {
  const [categories, posts, admin] = await Promise.all([
    getCategories(),
    getAllPosts(),
    getAdminContext(),
  ]);
  const [featured, ...remaining] = posts;

  return (
    <main>
      <section className="border-b border-[#1e2a24]/10 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
              News &amp; field notes
            </p>
            {admin.isAdmin && <AdminPostEditor categories={categories} />}
          </div>
          <div>
            <h1 className="max-w-4xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
              Useful stories for a life{" "}
              <span className="italic text-[#6b786e]">
                beyond the usual office.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#59665f]">
              What we learn about staying connected, comfortable, powered,
              equipped, and moving while working remotely.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">
                Browse by category
              </p>
              <h2 className="mt-2 font-serif text-4xl">Find what you need.</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon =
                icons[category.slug as keyof typeof icons] ?? PackageOpen;
              return (
                <Link
                  className="group rounded-2xl border border-[#1e2a24]/10 bg-[#ebe7dc] p-6 transition hover:-translate-y-1 hover:bg-[#e4dfd2]"
                  href={`/news/${category.slug}`}
                  key={category.slug}
                >
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-[#1e2a24] p-3 text-[#f4b860]">
                      <Icon className="size-5" />
                    </span>
                    <ArrowRight className="size-5 transition group-hover:translate-x-1" />
                  </div>
                  <h3 className="mt-10 font-serif text-3xl">
                    {category.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#59665f]">
                    {category.description}
                  </p>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#a45d2d]">
                    {category.postCount ?? 0}{" "}
                    {(category.postCount ?? 0) === 1 ? "story" : "stories"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#dfe5dc] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">
              Latest dispatches
            </p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">
              Fresh from the field.
            </h2>
          </div>
          {featured ? (
            <div className="space-y-6">
              <PostCard featured post={featured} />
              {remaining.length > 0 && (
                <div className="grid gap-6 lg:grid-cols-3">
                  {remaining.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyNews />
          )}
        </div>
      </section>
    </main>
  );
}
