import type { PortableTextBlock } from "next-sanity";

export type SanityImage = {
  asset?: { _ref?: string; _type?: "reference" };
  assetUrl?: string;
  alt?: string;
  caption?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
};

export type NewsCategory = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  postCount?: number;
};

export type NewsPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  featured?: boolean;
  mainImage?: SanityImage;
  category: { title: string; slug: string };
  author?: { name: string; slug?: string; image?: SanityImage; bio?: string };
  body?: PortableTextBlock[];
  seoTitle?: string;
  seoDescription?: string;
  locationName?: string;
  region?: string;
  visitedFrom?: string;
  visitedTo?: string;
};

export type FieldNoteCategory = NewsCategory;
export type FieldNote = NewsPost;

export type Devotional = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  scriptureReference: string;
  scriptureText: string;
  mainImage?: SanityImage;
  author?: { name: string; slug?: string; image?: SanityImage; bio?: string };
  body?: PortableTextBlock[];
  prayer?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type SiteSettings = {
  _id: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroAccent: string;
  heroIntroduction: string;
  aboutHeadline: string;
  aboutRobinAndLaura: string;
  aboutJournal: string;
};
