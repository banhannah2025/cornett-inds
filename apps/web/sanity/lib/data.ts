import { sanityClient } from "./client";
import {
  categoriesQuery,
  categoryBySlugQuery,
  postBySlugQuery,
  postsByCategoryQuery,
  postsQuery,
  siteSettingsQuery,
  fieldNoteCategoriesQuery,
  fieldNoteCategoryBySlugQuery,
  fieldNoteBySlugQuery,
  fieldNotesByCategoryQuery,
  fieldNotesQuery,
  devotionalsQuery,
  devotionalBySlugQuery,
} from "./queries";
import type {
  Devotional,
  FieldNote,
  FieldNoteCategory,
  NewsCategory,
  NewsPost,
  SiteSettings,
} from "./types";

const options = { cache: "no-store" } as const;

export const newsCategories: NewsCategory[] = [
  {
    _id: "category-tech",
    title: "Tech",
    slug: "tech",
    description:
      "Connectivity, remote-work technology, and tools that keep us productive.",
    order: 1,
  },
  {
    _id: "category-necessities",
    title: "Necessities",
    slug: "necessities",
    description:
      "The everyday essentials that make extended travel practical and comfortable.",
    order: 2,
  },
  {
    _id: "category-shelter",
    title: "Shelter",
    slug: "shelter",
    description:
      "Trailers, camps, weather protection, and creating a dependable home base.",
    order: 3,
  },
  {
    _id: "category-power",
    title: "Power",
    slug: "power",
    description:
      "Solar, batteries, generators, and the energy systems behind life off-grid.",
    order: 4,
  },
  {
    _id: "category-camping-gear",
    title: "Camping Gear",
    slug: "camping-gear",
    description:
      "Field-tested equipment for working, cooking, resting, and exploring outdoors.",
    order: 5,
  },
  {
    _id: "category-transportation",
    title: "Transportation",
    slug: "transportation",
    description:
      "Tow vehicles, trail vehicles, maintenance, routes, and life on the move.",
    order: 6,
  },
];

export const fieldNoteCategories: FieldNoteCategory[] = [
  {
    _id: "field-note-category-about-us",
    title: "About Us",
    slug: "about-us",
    description:
      "The people, values, decisions, and everyday moments behind Blended Works.",
    order: 1,
  },
  {
    _id: "field-note-category-our-journey",
    title: "Our Journey",
    slug: "our-journey",
    description:
      "The honest story of faith, family, rebuilding, and creating a life and business together.",
    order: 2,
  },
  {
    _id: "field-note-category-homeless-to-hero",
    title: "From Homeless to Hero",
    slug: "from-homeless-to-hero",
    description:
      "Real stories and practical steps for moving from instability toward housing, purpose, freedom, and a life built with intention.",
    order: 3,
  },
  {
    _id: "field-note-category-locations",
    title: "Locations",
    slug: "locations",
    description:
      "Firsthand stories from the places we stay, explore, work, and remember.",
    order: 4,
  },
];

export const defaultSiteSettings: SiteSettings = {
  _id: "siteSettings",
  heroEyebrow: "Robin + Laura™ · Partners in life and work",
  heroHeadline: "Build a better life.",
  heroAccent: "Make the work meaningful.",
  heroIntroduction:
    "Blended Works brings faith, family, practical experience, technology, creativity, and entrepreneurship together to help people and businesses move forward.",
  aboutHeadline:
    "A blended family. A blended set of skills. One shared determination to build what comes next.",
  aboutRobinAndLaura:
    "We’re Robin and Laura—engaged partners, parents, artists, outdoorspeople, and the team behind Blended Works. Our story has included homelessness, housing instability, sacrifice, and starting over. It has also taught us how much becomes possible when faith, love, useful skills, and steady work meet.",
  aboutJournal:
    "We’re building an expanding home for honest stories, practical teaching, affordable tools, professional services, daily devotionals, and the ventures that grow from our family’s real needs and lived experience.",
};

export async function getCategories() {
  try {
    const categories = await sanityClient.fetch<NewsCategory[]>(
      categoriesQuery,
      {},
      options,
    );
    return categories.length ? categories : newsCategories;
  } catch {
    return newsCategories;
  }
}

export async function getAllPosts() {
  try {
    return await sanityClient.fetch<NewsPost[]>(postsQuery, {}, options);
  } catch {
    return [];
  }
}

export async function getCategory(slug: string) {
  try {
    const category = await sanityClient.fetch<NewsCategory | null>(
      categoryBySlugQuery,
      { category: slug },
      options,
    );
    return (
      category ?? newsCategories.find((item) => item.slug === slug) ?? null
    );
  } catch {
    return newsCategories.find((item) => item.slug === slug) ?? null;
  }
}

export async function getPostsByCategory(category: string) {
  try {
    return await sanityClient.fetch<NewsPost[]>(
      postsByCategoryQuery,
      { category },
      options,
    );
  } catch {
    return [];
  }
}

export async function getPost(category: string, slug: string) {
  try {
    return await sanityClient.fetch<NewsPost | null>(
      postBySlugQuery,
      { category, slug },
      options,
    );
  } catch {
    return null;
  }
}

export async function getSiteSettings() {
  try {
    return (
      (await sanityClient.fetch<SiteSettings | null>(
        siteSettingsQuery,
        {},
        options,
      )) ?? defaultSiteSettings
    );
  } catch {
    return defaultSiteSettings;
  }
}

export async function getFieldNoteCategories() {
  try {
    const categories = await sanityClient.fetch<FieldNoteCategory[]>(
      fieldNoteCategoriesQuery,
      {},
      options,
    );
    return categories.length ? categories : fieldNoteCategories;
  } catch {
    return fieldNoteCategories;
  }
}

export async function getAllFieldNotes() {
  try {
    return await sanityClient.fetch<FieldNote[]>(fieldNotesQuery, {}, options);
  } catch {
    return [];
  }
}

export async function getFieldNoteCategory(slug: string) {
  try {
    return (
      (await sanityClient.fetch<FieldNoteCategory | null>(
        fieldNoteCategoryBySlugQuery,
        { category: slug },
        options,
      )) ??
      fieldNoteCategories.find((item) => item.slug === slug) ??
      null
    );
  } catch {
    return fieldNoteCategories.find((item) => item.slug === slug) ?? null;
  }
}

export async function getFieldNotesByCategory(category: string) {
  try {
    return await sanityClient.fetch<FieldNote[]>(
      fieldNotesByCategoryQuery,
      { category },
      options,
    );
  } catch {
    return [];
  }
}

export async function getFieldNote(category: string, slug: string) {
  try {
    return await sanityClient.fetch<FieldNote | null>(
      fieldNoteBySlugQuery,
      { category, slug },
      options,
    );
  } catch {
    return null;
  }
}

export async function getDevotionals() {
  try {
    return await sanityClient.fetch<Devotional[]>(
      devotionalsQuery,
      {},
      options,
    );
  } catch {
    return [];
  }
}

export async function getDevotional(slug: string) {
  try {
    return await sanityClient.fetch<Devotional | null>(
      devotionalBySlugQuery,
      { slug },
      options,
    );
  } catch {
    return null;
  }
}
