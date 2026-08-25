import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowLeft, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFieldNoteEditor } from "@/components/admin-field-note-editor";
import { AdminImageEditor } from "@/components/admin-image-editor";
import { getAdminContext } from "@/lib/admin";
import { getFieldNote, getFieldNoteCategories } from "@/sanity/lib/data";
import { portableTextToEditorText } from "@/sanity/lib/editor";
import { getImageAssets } from "@/sanity/lib/assets";
import { urlForImage } from "@/sanity/lib/image";
import type { SanityImage } from "@/sanity/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/field-notes/[category]/[slug]">): Promise<Metadata> {
  const { category, slug } = await params;
  const note = await getFieldNote(category, slug);
  return note
    ? {
        title: note.seoTitle ?? `${note.title} | Field Notes`,
        description: note.seoDescription ?? note.excerpt,
      }
    : { title: "Field note not found | Blended Works" };
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-12 font-serif text-4xl leading-tight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-10 font-serif text-3xl leading-tight">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="mt-6 text-lg leading-8 text-[#46534c]">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-10 border-l-4 border-[#c8703d] pl-6 font-serif text-3xl italic leading-tight text-[#39473f]">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-6 list-disc space-y-2 pl-6 text-lg leading-8 text-[#46534c]">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="my-6 list-decimal space-y-2 pl-6 text-lg leading-8 text-[#46534c]">
        {children}
      </ol>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        className="font-semibold text-[#a45d2d] underline underline-offset-4"
        href={value?.href}
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value: SanityImage }) => (
      <figure className="my-12">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-[#dfe5dc]">
          <Image
            alt={value.alt ?? ""}
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            src={urlForImage(value).width(1400).height(875).url()}
          />
        </div>
        {value.caption && (
          <figcaption className="mt-3 text-sm text-[#6b786e]">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
  },
};
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default async function FieldNotePage({
  params,
}: PageProps<"/field-notes/[category]/[slug]">) {
  const { category, slug } = await params;
  const [note, categories, admin] = await Promise.all([
    getFieldNote(category, slug),
    getFieldNoteCategories(),
    getAdminContext(),
  ]);
  if (!note) notFound();
  const imageAssets = admin.isAdmin ? await getImageAssets() : [];
  const categoryId =
    categories.find((item) => item.slug === note.category.slug)?._id ?? "";
  return (
    <main>
      <article>
        <header className="px-5 pb-14 pt-16 sm:px-8 lg:px-10 lg:pb-20 lg:pt-24">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                className="inline-flex items-center gap-2 text-sm font-bold text-[#a45d2d]"
                href={`/field-notes/${note.category.slug}`}
              >
                <ArrowLeft className="size-4" /> {note.category.title}
              </Link>
              {admin.isAdmin && categoryId && (
                <AdminFieldNoteEditor
                  categories={categories}
                  note={{
                    _id: note._id,
                    title: note.title,
                    slug: note.slug,
                    excerpt: note.excerpt,
                    publishedAt: note.publishedAt,
                    featured: note.featured,
                    categoryId,
                    bodyText: portableTextToEditorText(note.body),
                    locationName: note.locationName,
                    region: note.region,
                    visitedFrom: note.visitedFrom,
                    visitedTo: note.visitedTo,
                  }}
                />
              )}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[#a45d2d]">
              <span>{note.category.title}</span>
              <span className="size-1 rounded-full bg-[#a45d2d]/40" />
              <time dateTime={note.publishedAt}>
                {dateFormatter.format(new Date(note.publishedAt))}
              </time>
            </div>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
              {note.title}
            </h1>
            <p className="mt-7 max-w-3xl text-xl leading-8 text-[#59665f]">
              {note.excerpt}
            </p>
            {(note.locationName || note.region) && (
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#526158]">
                <MapPin className="size-4 text-[#a45d2d]" />
                {[note.locationName, note.region].filter(Boolean).join(", ")}
              </p>
            )}
            {note.author?.name && (
              <p className="mt-7 text-sm font-bold">By {note.author.name}</p>
            )}
          </div>
        </header>
        {(note.mainImage?.asset?._ref || admin.isAdmin) && (
          <div className="relative mx-auto aspect-[16/8] max-w-7xl overflow-hidden bg-[#dfe5dc] sm:rounded-[2.5rem]">
            {note.mainImage?.asset?._ref ? (
              <Image
                alt={note.mainImage.alt ?? ""}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1280px) 1280px, 100vw"
                src={urlForImage(note.mainImage).width(1800).height(900).url()}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#dfe5dc,#bcc9bf)] text-sm font-bold text-[#526158]">
                No field note image yet
              </div>
            )}
            {admin.isAdmin && (
              <div className="absolute right-5 top-5 z-10">
                <AdminImageEditor
                  assets={imageAssets}
                  currentAlt={note.mainImage?.alt}
                  currentCaption={note.mainImage?.caption}
                  documentId={note._id}
                  documentType="fieldNote"
                  hasImage={Boolean(note.mainImage?.asset?._ref)}
                />
              </div>
            )}
          </div>
        )}
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
          {note.body?.length ? (
            <PortableText components={components} value={note.body} />
          ) : (
            <p className="text-lg leading-8 text-[#59665f]">
              This field note is being prepared for publication.
            </p>
          )}
        </div>
      </article>
    </main>
  );
}
