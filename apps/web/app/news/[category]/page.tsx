import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptyNews } from "@/components/empty-news";
import { PostCard } from "@/components/post-card";
import { AdminPostEditor } from "@/components/admin-post-editor";
import { getAdminContext } from "@/lib/admin";
import {
  getCategories,
  getCategory,
  getPostsByCategory,
} from "@/sanity/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/news/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  return category
    ? {
        title: `${category.title} News | Blended Works`,
        description: category.description,
      }
    : { title: "News Category | Blended Works" };
}

export default async function CategoryPage({
  params,
}: PageProps<"/news/[category]">) {
  const { category: slug } = await params;
  const [category, posts, categories, admin] = await Promise.all([
    getCategory(slug),
    getPostsByCategory(slug),
    getCategories(),
    getAdminContext(),
  ]);
  if (!category) notFound();

  return (
    <main>
      <section className="border-b border-[#1e2a24]/10 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-[#a45d2d]"
              href="/news"
            >
              <ArrowLeft className="size-4" /> All news
            </Link>
            {admin.isAdmin && (
              <AdminPostEditor
                categories={categories}
                defaultCategoryId={category._id}
              />
            )}
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
              News category
            </p>
            <div>
              <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-7xl">
                {category.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#59665f]">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          {posts.length ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyNews category={category.title.toLowerCase()} />
          )}
        </div>
      </section>
    </main>
  );
}
