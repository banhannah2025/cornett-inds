import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookHeart,
  FileText,
  MapPinned,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import {
  AdminDevotionalEditor,
  type EditableDevotional,
} from "@/components/admin-devotional-editor";
import { AdminDirectoryEditor } from "@/components/admin-directory-editor";
import {
  AdminFieldNoteEditor,
  type EditableFieldNote,
} from "@/components/admin-field-note-editor";
import { AdminImageEditor } from "@/components/admin-image-editor";
import { AdminPostEditor } from "@/components/admin-post-editor";
import { AdminSessionControls } from "@/components/admin-session-controls";
import { AdminSiteEditor } from "@/components/admin-site-editor";
import { AdminPlatformConsole } from "@/components/admin-platform-console";
import { getAdminContext } from "@/lib/admin";
import { getImageAssets } from "@/sanity/lib/assets";
import { getSiteSettings } from "@/sanity/lib/data";
import { portableTextToEditorText } from "@/sanity/lib/editor";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";
import type { PortableTextBlock } from "@portabletext/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin Dashboard | Blended Works",
  robots: { index: false, follow: false },
};

type Category = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
};
type Author = { _id: string; name: string; slug: string; bio?: string };
type ContentItem = {
  _id: string;
  _type: "post" | "fieldNote" | "devotional";
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  featured?: boolean;
  categoryId?: string;
  authorId?: string;
  body?: PortableTextBlock[];
  scriptureReference?: string;
  scriptureText?: string;
  prayer?: string;
  locationName?: string;
  region?: string;
  visitedFrom?: string;
  visitedTo?: string;
  seoTitle?: string;
  seoDescription?: string;
  mainImage?: { asset?: { _ref?: string }; alt?: string; caption?: string };
};

const dashboardQuery = `{
  "newsCategories": *[_type == "category"] | order(order asc){_id,title,"slug":slug.current,description,order},
  "fieldNoteCategories": *[_type == "fieldNoteCategory"] | order(order asc){_id,title,"slug":slug.current,description,order},
  "authors": *[_type == "author"] | order(name asc){_id,name,"slug":slug.current,bio},
  "content": *[_type in ["post","fieldNote","devotional"]] | order(publishedAt desc){
    _id,_type,title,"slug":slug.current,excerpt,publishedAt,featured,
    "categoryId":category._ref,"authorId":author._ref,body,
    scriptureReference,scriptureText,prayer,locationName,region,visitedFrom,visitedTo,
    seoTitle,seoDescription,mainImage{asset,alt,caption}
  }
}`;

export default async function AdminPage() {
  const admin = await getAdminContext();
  if (!admin.userId) redirect("/sign-in?redirect_url=/admin");
  if (!admin.isAdmin) notFound();

  const [data, settings, assets] = await Promise.all([
    getSanityWriteClient().fetch<{
      newsCategories: Category[];
      fieldNoteCategories: Category[];
      authors: Author[];
      content: ContentItem[];
    }>(dashboardQuery),
    getSiteSettings(),
    getImageAssets(),
  ]);
  const authorOptions = data.authors.map(({ _id, name }) => ({ _id, name }));
  const news = data.content.filter((item) => item._type === "post");
  const notes = data.content.filter((item) => item._type === "fieldNote");
  const devotionals = data.content.filter(
    (item) => item._type === "devotional",
  );
  const plannerUrl =
    process.env.NEXT_PUBLIC_BLENDED_PLANNER_URL ??
    "https://blended-planner.specopsrecon82.chatgpt.site";

  return (
    <main className="min-h-screen bg-[#f6f3eb] px-5 py-8 text-[#1e2a24] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-[#1e2a24]/10 pb-8">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-[#a45d2d]"
              href="/"
            >
              <ArrowLeft className="size-4" /> Back to website
            </Link>
            <h1 className="mt-4 font-serif text-5xl sm:text-6xl">
              Admin dashboard
            </h1>
            <p className="mt-3 text-[#59665f]">
              Create, edit, publish, and manage Blended Works from one place.
            </p>
          </div>
          <AdminSessionControls name={admin.displayName ?? "Administrator"} />
        </header>

        <AdminPlatformConsole
          businessComposerUrl={process.env.NEXT_PUBLIC_BUSINESS_COMPOSER_URL}
          plannerUrl={plannerUrl}
        />

        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <Summary icon={FileText} label="News posts" value={news.length} />
          <Summary icon={MapPinned} label="Field notes" value={notes.length} />
          <Summary
            icon={BookHeart}
            label="Devotionals"
            value={devotionals.length}
          />
          <Summary icon={Users} label="Authors" value={data.authors.length} />
        </section>

        <section className="rounded-[2rem] bg-[#1e2a24] p-6 text-white sm:p-8" id="website-settings">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f4b860]">
                Quick create
              </p>
              <h2 className="mt-2 font-serif text-3xl">Add something new.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <AdminPostEditor
                authors={authorOptions}
                categories={data.newsCategories}
              />
              <AdminFieldNoteEditor
                authors={authorOptions}
                categories={data.fieldNoteCategories}
              />
              <AdminDevotionalEditor authors={authorOptions} />
              <AdminSiteEditor settings={settings} />
            </div>
          </div>
        </section>

        <div id="content-library">
          <ContentSection
            assets={assets}
            authors={authorOptions}
            categories={data.newsCategories}
            items={news}
            kind="news"
            title="News posts"
          />
        </div>
        <ContentSection
          assets={assets}
          authors={authorOptions}
          categories={data.fieldNoteCategories}
          items={notes}
          kind="fieldNote"
          title="Field notes"
        />
        <ContentSection
          assets={assets}
          authors={authorOptions}
          categories={[]}
          items={devotionals}
          kind="devotional"
          title="Daily devotionals"
        />

        <section className="grid gap-8 border-t border-[#1e2a24]/10 py-12 lg:grid-cols-3">
          <Directory
            title="News categories"
            icon={Tags}
            create={<AdminDirectoryEditor documentType="category" />}
            entries={data.newsCategories.map((entry) => ({
              label: entry.title,
              editor: (
                <AdminDirectoryEditor documentType="category" entry={entry} />
              ),
            }))}
          />
          <Directory
            title="Field-note categories"
            icon={Tags}
            create={<AdminDirectoryEditor documentType="fieldNoteCategory" />}
            entries={data.fieldNoteCategories.map((entry) => ({
              label: entry.title,
              editor: (
                <AdminDirectoryEditor
                  documentType="fieldNoteCategory"
                  entry={entry}
                />
              ),
            }))}
          />
          <Directory
            title="Authors"
            icon={Users}
            create={<AdminDirectoryEditor documentType="author" />}
            entries={data.authors.map((entry) => ({
              label: entry.name,
              editor: (
                <AdminDirectoryEditor documentType="author" entry={entry} />
              ),
            }))}
          />
        </section>
      </div>
    </main>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#1e2a24]/10 bg-white p-5">
      <Icon className="size-5 text-[#a45d2d]" />
      <p className="mt-5 font-serif text-4xl">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#59665f]">{label}</p>
    </div>
  );
}

function ContentSection({
  assets,
  authors,
  categories,
  items,
  kind,
  title,
}: {
  assets: Awaited<ReturnType<typeof getImageAssets>>;
  authors: { _id: string; name: string }[];
  categories: Category[];
  items: ContentItem[];
  kind: "news" | "fieldNote" | "devotional";
  title: string;
}) {
  return (
    <section className="py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">
            Content library
          </p>
          <h2 className="mt-2 font-serif text-4xl">{title}</h2>
        </div>
        <span className="text-sm font-bold text-[#59665f]">
          {items.length} total
        </span>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article
              className="flex flex-col gap-4 rounded-2xl border border-[#1e2a24]/10 bg-white p-5 lg:flex-row lg:items-center lg:justify-between"
              key={item._id}
            >
              <div>
                <p className="font-serif text-2xl">{item.title}</p>
                <p className="mt-1 text-sm text-[#6b786e]">
                  {new Date(item.publishedAt).toLocaleDateString()} · /
                  {item.slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="rounded-full border border-[#1e2a24]/15 px-4 py-2.5 text-sm font-bold"
                  href={
                    kind === "news"
                      ? `/news/${categories.find((category) => category._id === item.categoryId)?.slug}/${item.slug}`
                      : kind === "fieldNote"
                        ? `/field-notes/${categories.find((category) => category._id === item.categoryId)?.slug}/${item.slug}`
                        : `/devotionals/${item.slug}`
                  }
                >
                  View
                </Link>
                {kind === "news" ? (
                  <AdminPostEditor
                    authors={authors}
                    categories={categories}
                    post={{
                      _id: item._id,
                      title: item.title,
                      slug: item.slug,
                      excerpt: item.excerpt,
                      publishedAt: item.publishedAt,
                      featured: item.featured,
                      categoryId: item.categoryId ?? "",
                      authorId: item.authorId,
                      bodyText: portableTextToEditorText(item.body),
                      seoTitle: item.seoTitle,
                      seoDescription: item.seoDescription,
                    }}
                  />
                ) : kind === "fieldNote" ? (
                  <AdminFieldNoteEditor
                    authors={authors}
                    categories={categories}
                    note={
                      {
                        _id: item._id,
                        title: item.title,
                        slug: item.slug,
                        excerpt: item.excerpt,
                        publishedAt: item.publishedAt,
                        featured: item.featured,
                        categoryId: item.categoryId ?? "",
                        authorId: item.authorId,
                        bodyText: portableTextToEditorText(item.body),
                        locationName: item.locationName,
                        region: item.region,
                        visitedFrom: item.visitedFrom,
                        visitedTo: item.visitedTo,
                        seoTitle: item.seoTitle,
                        seoDescription: item.seoDescription,
                      } satisfies EditableFieldNote
                    }
                  />
                ) : (
                  <AdminDevotionalEditor
                    authors={authors}
                    devotional={
                      {
                        _id: item._id,
                        title: item.title,
                        slug: item.slug,
                        excerpt: item.excerpt,
                        publishedAt: item.publishedAt,
                        scriptureReference: item.scriptureReference ?? "",
                        scriptureText: item.scriptureText ?? "",
                        prayer: item.prayer,
                        authorId: item.authorId,
                        bodyText: portableTextToEditorText(item.body),
                        seoTitle: item.seoTitle,
                        seoDescription: item.seoDescription,
                      } satisfies EditableDevotional
                    }
                  />
                )}
                <AdminImageEditor
                  assets={assets}
                  currentAlt={item.mainImage?.alt}
                  currentCaption={item.mainImage?.caption}
                  documentId={item._id}
                  documentType={item._type}
                  hasImage={Boolean(item.mainImage?.asset?._ref)}
                />
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-2xl bg-[#ebe7dc] p-6 text-[#59665f]">
            Nothing here yet.
          </p>
        )}
      </div>
    </section>
  );
}

function Directory({
  create,
  entries,
  icon: Icon,
  title,
}: {
  create: React.ReactNode;
  entries: { label: string; editor: React.ReactNode }[];
  icon: typeof Settings;
  title: string;
}) {
  return (
    <div className="rounded-[2rem] bg-[#ebe7dc] p-6">
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-[#a45d2d]" />
        <h2 className="font-serif text-2xl">{title}</h2>
      </div>
      <div className="mt-5">{create}</div>
      <div className="mt-5 space-y-2">
        {entries.map((entry) => (
          <div
            className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3"
            key={entry.label}
          >
            <span className="text-sm font-bold">{entry.label}</span>
            {entry.editor}
          </div>
        ))}
      </div>
    </div>
  );
}
