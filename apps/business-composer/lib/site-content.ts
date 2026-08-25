import "server-only";

import { createClient } from "@sanity/client";

export type ContentCategory = { _id: string; title: string };
export type SiteDocument = {
  _id: string;
  _type: "post" | "fieldNote" | "devotional";
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  featured?: boolean;
  categoryId?: string;
  categoryTitle?: string;
  categorySlug?: string;
  bodyText: string;
  scriptureReference?: string;
  scriptureText?: string;
  prayer?: string;
};

export type HomepageSettings = {
  _id: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroAccent: string;
  heroIntroduction: string;
  aboutHeadline: string;
  aboutRobinAndLaura: string;
  aboutJournal: string;
};

export type SiteContent = {
  homepage: HomepageSettings;
  posts: SiteDocument[];
  fieldNotes: SiteDocument[];
  devotionals: SiteDocument[];
  newsCategories: ContentCategory[];
  fieldNoteCategories: ContentCategory[];
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "a9iipjbg";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export function getSanityClient(write = false) {
  const token =
    process.env.SANITY_API_WRITE_TOKEN ??
    process.env.SANITY_READ_WRITE_DEVELOPER_API;
  if (write && !token)
    throw new Error("Sanity write access is not configured.");
  return createClient({
    projectId,
    dataset,
    apiVersion: "2026-08-11",
    useCdn: false,
    token: write ? token : undefined,
  });
}

type PortableBlock = {
  _type: string;
  style?: string;
  children?: { text?: string }[];
};

export function portableTextToEditorText(body?: PortableBlock[]) {
  return (body ?? [])
    .filter((block) => block._type === "block")
    .map((block) => {
      const text =
        block.children?.map((child) => child.text ?? "").join("") ?? "";
      if (block.style === "h2") return `## ${text}`;
      if (block.style === "h3") return `### ${text}`;
      if (block.style === "blockquote") return `> ${text}`;
      return text;
    })
    .join("\n\n");
}

export function editorTextToPortableText(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => {
      let style = "normal";
      let content = paragraph;
      if (paragraph.startsWith("### ")) {
        style = "h3";
        content = paragraph.slice(4);
      } else if (paragraph.startsWith("## ")) {
        style = "h2";
        content = paragraph.slice(3);
      } else if (paragraph.startsWith("> ")) {
        style = "blockquote";
        content = paragraph.slice(2);
      }
      return {
        _type: "block",
        _key: `block-${Date.now()}-${index}`,
        style,
        markDefs: [],
        children: [
          { _type: "span", _key: `span-${index}`, text: content, marks: [] },
        ],
      };
    });
}

const defaultHomepage: HomepageSettings = {
  _id: "siteSettings",
  heroEyebrow: "Robin & Laura, working beyond the map",
  heroHeadline: "The work goes on.",
  heroAccent: "So do we.",
  heroIntroduction:
    "We’re exploring new places without leaving our work behind.",
  aboutHeadline:
    "We’re building a life where meaningful work and a wider world can share the same calendar.",
  aboutRobinAndLaura:
    "We’re a couple learning how to work well while exploring new places.",
  aboutJournal: "This journal is where we’ll share what we learn.",
};

export async function getSiteContent(): Promise<SiteContent> {
  const client = getSanityClient();
  const data = await client.fetch<{
    homepage: HomepageSettings | null;
    documents: (Omit<SiteDocument, "bodyText"> & { body?: PortableBlock[] })[];
    newsCategories: ContentCategory[];
    fieldNoteCategories: ContentCategory[];
  }>(`{
    "homepage": *[_type == "siteSettings" && _id == "siteSettings"][0]{_id, heroEyebrow, heroHeadline, heroAccent, heroIntroduction, aboutHeadline, aboutRobinAndLaura, aboutJournal},
    "documents": *[_type in ["post", "fieldNote", "devotional"] && defined(slug.current)] | order(publishedAt desc) {
      _id, _type, title, "slug": slug.current, excerpt, publishedAt, featured, body,
      "categoryId": category->_id, "categoryTitle": category->title, "categorySlug": category->slug.current,
      scriptureReference, scriptureText, prayer
    },
    "newsCategories": *[_type == "category"] | order(order asc){_id,title},
    "fieldNoteCategories": *[_type == "fieldNoteCategory"] | order(order asc){_id,title}
  }`);
  const documents = data.documents.map(({ body, ...document }) => ({
    ...document,
    bodyText: portableTextToEditorText(body),
  }));
  return {
    homepage: data.homepage ?? defaultHomepage,
    posts: documents.filter((item) => item._type === "post"),
    fieldNotes: documents.filter((item) => item._type === "fieldNote"),
    devotionals: documents.filter((item) => item._type === "devotional"),
    newsCategories: data.newsCategories,
    fieldNoteCategories: data.fieldNoteCategories,
  };
}
