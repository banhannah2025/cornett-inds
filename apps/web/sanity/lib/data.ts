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
  aboutPageEyebrow: "Robin + Laura™ · Partners",
  aboutPageHeadline:
    "We learned to build because life kept asking us to begin again.",
  aboutPageIntroduction:
    "Blended Works brings together our family, faith, skills, creativity, and determination to make the next chapter more useful—not only for us, but for people and businesses building forward too.",
  robinHeadline: "Builder by necessity. Creator by nature.",
  robinBio:
    "Robin grew up taking on adult responsibilities early. Working, helping manage a household, and learning trades became the beginning of an unusually broad practical education.\n\nHe holds an associate degree in international business and a bachelor’s degree in legal studies. His experience spans construction, general contracting, security and private law enforcement, retail, manufacturing, landscaping, sales, accounting, management, legal research, programming, and design. He also holds Coast Guard watercraft licensing and universal EPA technician certification.\n\nRobin leads technology, design, and product creation. He is most at home painting, building, solving difficult problems, or exploring outdoors—but fatherhood, partnership, and family remain his first priorities.",
  lauraHeadline: "The order, warmth, and steady rhythm behind the work.",
  lauraBio:
    "Laura is passionate, loving, funny, and deeply committed to family. Her experience reaches across accounting, business, administration, customer service, hospitality, caregiving, and the daily systems that keep a household moving.\n\nShe has a gift for numbers, organization, time management, and making better use of limited space and resources. As the primary at-home parent, she balances family life with part-time work and the growing responsibilities of Blended Works.\n\nLaura leads finance, organization, and operational order. She also draws and paints, loves gardening, and brings both compassion and practical clarity to the plans the couple builds together.",
  storyHeadline: "Two difficult seasons became one shared direction.",
  storyBody:
    "Robin once stayed at the homeless mission where he now works in security. Laura later arrived there during a difficult chapter of her own. Their connection was immediate, but the mission did not permit relationships between staff and guests, so Laura stopped using its services before their relationship moved forward.\n\nThey chose to start over together: combining two families, working toward stable housing, preparing for marriage, and building a business capable of supporting a close-knit family. Their household includes four children from prior relationships; protecting the children’s privacy remains important.\n\nCamping, fishing, stargazing, dancing, laughing, painting, gardening, dreaming, and planning are part of how they stay connected. Blended Works grew from that same instinct: take different lives, talents, and opportunities and cultivate something stronger together.",
  valuesHeadline:
    "Trust should feel personal—and be supported by excellent practice.",
  trustPromise:
    "Our goals, intentions, and determination are grounded in faith, excellent business practices, learning and teaching. We rely on God, our morals, and our ethics to safeguard our family, our work, and the people who trust us.",
  servicesHeadline: "Bring us a real problem worth solving.",
  servicesIntroduction:
    "Blended Works combines technology, business experience, organization, creative thinking, research, and practical trade knowledge. We are building the portfolio openly and welcome early conversations, collaborations, and opportunities that align with our ethics.",
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
    const settings =
      (await sanityClient.fetch<SiteSettings | null>(
        siteSettingsQuery,
        {},
        options,
      )) ?? defaultSiteSettings;
    return { ...defaultSiteSettings, ...settings };
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
