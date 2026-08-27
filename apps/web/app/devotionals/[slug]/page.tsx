import type { PortableTextComponents } from "@portabletext/react";
import { PortableText } from "@portabletext/react";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDevotionalEditor } from "@/components/admin-devotional-editor";
import { AdminImageEditor } from "@/components/admin-image-editor";
import { ExpandableImage } from "@/components/expandable-image";
import { getAdminContext } from "@/lib/admin";
import { getDevotional } from "@/sanity/lib/data";
import { portableTextToEditorText } from "@/sanity/lib/editor";
import { getImageAssets } from "@/sanity/lib/assets";
import { urlForImage } from "@/sanity/lib/image";
import type { SanityImage } from "@/sanity/lib/types";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/devotionals/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const devotional = await getDevotional(slug);
  return devotional
    ? { title: devotional.seoTitle ?? `${devotional.title} | Daily Devotionals`, description: devotional.seoDescription ?? devotional.excerpt }
    : { title: "Devotional not found | Blended Works" };
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="mt-12 font-serif text-4xl leading-tight">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-10 font-serif text-3xl leading-tight">{children}</h3>,
    normal: ({ children }) => <p className="mt-6 text-lg leading-8 text-[#46534c]">{children}</p>,
    blockquote: ({ children }) => <blockquote className="my-10 border-l-4 border-[#c8703d] pl-6 font-serif text-3xl italic leading-tight text-[#39473f]">{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className="my-6 list-disc space-y-2 pl-6 text-lg leading-8 text-[#46534c]">{children}</ul>,
    number: ({ children }) => <ol className="my-6 list-decimal space-y-2 pl-6 text-lg leading-8 text-[#46534c]">{children}</ol>,
  },
  marks: {
    link: ({ children, value }) => <a className="font-semibold text-[#a45d2d] underline underline-offset-4" href={value?.href}>{children}</a>,
  },
  types: {
    image: ({ value }: { value: SanityImage }) => (
      <figure className="my-12">
        <ExpandableImage
          className="aspect-[16/10] rounded-[2rem] bg-[#dfe5dc]"
          alt={value.alt ?? ""}
          caption={value.caption}
          imageClassName="object-contain"
          sizes="(min-width: 1024px) 800px, 100vw"
          src={urlForImage(value).width(1400).url()}
        />
        {value.caption && <figcaption className="mt-3 text-sm text-[#6b786e]">{value.caption}</figcaption>}
      </figure>
    ),
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

export default async function DevotionalPage({ params }: PageProps<"/devotionals/[slug]">) {
  const { slug } = await params;
  const [devotional, admin] = await Promise.all([getDevotional(slug), getAdminContext()]);
  if (!devotional) notFound();
  const imageAssets = admin.isAdmin ? await getImageAssets() : [];
  return (
    <main>
      <article>
        <header className="px-5 pb-14 pt-16 sm:px-8 lg:px-10 lg:pb-20 lg:pt-24">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#a45d2d]" href="/devotionals"><ArrowLeft className="size-4" /> All devotionals</Link>
              {admin.isAdmin && (
                <AdminDevotionalEditor devotional={{ _id: devotional._id, title: devotional.title, excerpt: devotional.excerpt, publishedAt: devotional.publishedAt, scriptureReference: devotional.scriptureReference, scriptureText: devotional.scriptureText, prayer: devotional.prayer, bodyText: portableTextToEditorText(devotional.body) }} />
              )}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[#a45d2d]">
              <span>{devotional.scriptureReference}</span><span className="size-1 rounded-full bg-[#a45d2d]/40" /><time dateTime={devotional.publishedAt}>{dateFormatter.format(new Date(devotional.publishedAt))}</time>
            </div>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">{devotional.title}</h1>
            <p className="mt-7 max-w-3xl text-xl leading-8 text-[#59665f]">{devotional.excerpt}</p>
            {devotional.author?.name && <p className="mt-7 text-sm font-bold">By {devotional.author.name}</p>}
          </div>
        </header>
        {(devotional.mainImage?.asset?._ref || admin.isAdmin) && (
          <div className="relative mx-auto aspect-[16/10] w-full max-w-7xl overflow-hidden bg-[#dfe5dc] sm:rounded-[2.5rem] lg:aspect-[16/9]">
            {devotional.mainImage?.asset?._ref ? (
              <ExpandableImage
                alt={devotional.mainImage.alt ?? ""}
                caption={devotional.mainImage.caption}
                className="absolute inset-0 size-full"
                imageClassName="object-contain"
                priority
                sizes="(min-width: 1280px) 1280px, 100vw"
                src={urlForImage(devotional.mainImage).width(1800).url()}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#dfe5dc,#bcc9bf)] text-sm font-bold text-[#526158]">No devotional image yet</div>
            )}
            {admin.isAdmin && (
              <div className="absolute right-5 top-5 z-10">
                <AdminImageEditor assets={imageAssets} currentAlt={devotional.mainImage?.alt} currentCaption={devotional.mainImage?.caption} documentId={devotional._id} documentType="devotional" hasImage={Boolean(devotional.mainImage?.asset?._ref)} />
              </div>
            )}
          </div>
        )}
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
          <section className="rounded-[2rem] bg-[#e5e9df] p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">{devotional.scriptureReference}</p>
            <blockquote className="mt-5 whitespace-pre-line font-serif text-2xl italic leading-relaxed text-[#35443c] sm:text-3xl">&ldquo;{devotional.scriptureText}&rdquo;</blockquote>
          </section>
          {devotional.body?.length ? <PortableText components={components} value={devotional.body} /> : <p className="mt-8 text-lg leading-8 text-[#59665f]">This reflection is being prepared for publication.</p>}
          {devotional.prayer && (
            <section className="mt-14 border-t border-[#1e2a24]/15 pt-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">A prayer for today</p>
              <p className="mt-5 whitespace-pre-line font-serif text-2xl italic leading-relaxed text-[#39473f]">{devotional.prayer}</p>
            </section>
          )}
        </div>
      </article>
    </main>
  );
}
