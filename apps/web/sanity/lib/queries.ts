import { defineQuery } from "next-sanity";

export const currentLocationQuery = defineQuery(/* groq */ `
  *[_type == "currentLocation" && _id == "currentLocation"][0] {
    _id, displayName, updatedAt, daypart
  }
`);

export const categoriesQuery = `*[_type == "category"] | order(order asc) {
  _id, title, "slug": slug.current, description, order,
  "postCount": count(*[_type == "post" && references(^._id) && defined(publishedAt) && publishedAt <= now()])
}`;

export const postsQuery = `*[_type == "post" && defined(slug.current) && defined(publishedAt) && publishedAt <= now()] | order(featured desc, publishedAt desc) {
  _id, title, "slug": slug.current, excerpt, publishedAt, featured,
  mainImage { asset, "assetUrl": asset->url, alt, caption, crop, hotspot },
  "category": category->{ title, "slug": slug.current },
  "author": author->{ name, "slug": slug.current, image { asset, alt, crop, hotspot } }
}`;

export const postsByCategoryQuery = `*[_type == "post" && category->slug.current == $category && defined(slug.current) && defined(publishedAt) && publishedAt <= now()] | order(featured desc, publishedAt desc) {
  _id, title, "slug": slug.current, excerpt, publishedAt, featured,
  mainImage { asset, alt, caption, crop, hotspot },
  "category": category->{ title, "slug": slug.current },
  "author": author->{ name, "slug": slug.current, image { asset, alt, crop, hotspot } }
}`;

export const categoryBySlugQuery = `*[_type == "category" && slug.current == $category][0] {
  _id, title, "slug": slug.current, description, order
}`;

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug && category->slug.current == $category && defined(publishedAt) && publishedAt <= now()][0] {
  _id, title, "slug": slug.current, excerpt, publishedAt, featured,
  mainImage { asset, alt, caption, crop, hotspot }, body, seoTitle, seoDescription,
  "category": category->{ title, "slug": slug.current },
  "author": author->{ name, "slug": slug.current, image { asset, alt, crop, hotspot }, bio }
}`;

export const siteSettingsQuery = `*[_type == "siteSettings" && _id == "siteSettings"][0] {
  _id, heroEyebrow, heroHeadline, heroAccent, heroIntroduction,
  aboutHeadline, aboutRobinAndLaura, aboutJournal
}`;

export const fieldNoteCategoriesQuery = `*[_type == "fieldNoteCategory"] | order(order asc) {
  _id, title, "slug": slug.current, description, order,
  "postCount": count(*[_type == "fieldNote" && references(^._id) && defined(publishedAt) && publishedAt <= now()])
}`;

export const fieldNotesQuery = `*[_type == "fieldNote" && defined(slug.current) && defined(publishedAt) && publishedAt <= now()] | order(featured desc, publishedAt desc) {
  _id, title, "slug": slug.current, excerpt, publishedAt, featured, locationName, region, visitedFrom, visitedTo,
  mainImage { asset, alt, caption, crop, hotspot },
  "category": category->{ title, "slug": slug.current },
  "author": author->{ name, "slug": slug.current, image { asset, alt, crop, hotspot } }
}`;

export const fieldNotesByCategoryQuery = `*[_type == "fieldNote" && category->slug.current == $category && defined(slug.current) && defined(publishedAt) && publishedAt <= now()] | order(featured desc, publishedAt desc) {
  _id, title, "slug": slug.current, excerpt, publishedAt, featured, locationName, region, visitedFrom, visitedTo,
  mainImage { asset, alt, caption, crop, hotspot },
  "category": category->{ title, "slug": slug.current },
  "author": author->{ name, "slug": slug.current, image { asset, alt, crop, hotspot } }
}`;

export const fieldNoteCategoryBySlugQuery = `*[_type == "fieldNoteCategory" && slug.current == $category][0] {
  _id, title, "slug": slug.current, description, order
}`;

export const fieldNoteBySlugQuery = `*[_type == "fieldNote" && slug.current == $slug && category->slug.current == $category && defined(publishedAt) && publishedAt <= now()][0] {
  _id, title, "slug": slug.current, excerpt, publishedAt, featured, locationName, region, visitedFrom, visitedTo,
  mainImage { asset, alt, caption, crop, hotspot }, body, seoTitle, seoDescription,
  "category": category->{ title, "slug": slug.current },
  "author": author->{ name, "slug": slug.current, image { asset, alt, crop, hotspot }, bio }
}`;

export const devotionalsQuery = `*[_type == "devotional" && defined(slug.current) && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc) {
  _id, title, "slug": slug.current, excerpt, publishedAt, scriptureReference, scriptureText,
  mainImage { asset, "assetUrl": asset->url, alt, caption, crop, hotspot },
  "author": author->{ name, "slug": slug.current, image { asset, alt, crop, hotspot } }
}`;

export const devotionalBySlugQuery = `*[_type == "devotional" && slug.current == $slug && defined(publishedAt) && publishedAt <= now()][0] {
  _id, title, "slug": slug.current, excerpt, publishedAt, scriptureReference, scriptureText, prayer,
  mainImage { asset, "assetUrl": asset->url, alt, caption, crop, hotspot }, body, seoTitle, seoDescription,
  "author": author->{ name, "slug": slug.current, image { asset, alt, crop, hotspot }, bio }
}`;
