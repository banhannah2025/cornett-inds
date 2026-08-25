import { defineArrayMember, defineField, defineType } from "sanity";

export const fieldNoteType = defineType({
  name: "fieldNote",
  title: "Field Note",
  type: "document",
  groups: [{ name: "content", title: "Content", default: true }, { name: "location", title: "Location details" }, { name: "seo", title: "SEO" }],
  fields: [
    defineField({ name: "title", title: "Title", type: "string", group: "content", validation: (rule) => rule.required().max(100) }),
    defineField({ name: "slug", title: "Slug", type: "slug", group: "content", options: { source: "title", maxLength: 96 }, validation: (rule) => rule.required() }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3, group: "content", validation: (rule) => rule.required().max(240) }),
    defineField({ name: "category", title: "Field note category", type: "reference", to: [{ type: "fieldNoteCategory" }], group: "content", validation: (rule) => rule.required() }),
    defineField({ name: "author", title: "Author", type: "reference", to: [{ type: "author" }], group: "content" }),
    defineField({ name: "publishedAt", title: "Published at", type: "datetime", group: "content", initialValue: () => new Date().toISOString(), validation: (rule) => rule.required() }),
    defineField({ name: "featured", title: "Featured field note", type: "boolean", group: "content", initialValue: false }),
    defineField({ name: "mainImage", title: "Main image", type: "image", group: "content", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Alternative text", type: "string", validation: (rule) => rule.required() }), defineField({ name: "caption", title: "Caption", type: "string" })] }),
    defineField({ name: "body", title: "Field note body", type: "array", group: "content", of: [defineArrayMember({ type: "block", styles: [{ title: "Normal", value: "normal" }, { title: "Heading 2", value: "h2" }, { title: "Heading 3", value: "h3" }, { title: "Quote", value: "blockquote" }] }), defineArrayMember({ type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Alternative text", type: "string", validation: (rule) => rule.required() }), defineField({ name: "caption", title: "Caption", type: "string" })] })], validation: (rule) => rule.required() }),
    defineField({ name: "locationName", title: "Location name", type: "string", group: "location" }),
    defineField({ name: "region", title: "Region / state", type: "string", group: "location" }),
    defineField({ name: "visitedFrom", title: "Visit began", type: "date", group: "location" }),
    defineField({ name: "visitedTo", title: "Visit ended", type: "date", group: "location" }),
    defineField({ name: "seoTitle", title: "SEO title", type: "string", group: "seo", validation: (rule) => rule.max(65) }),
    defineField({ name: "seoDescription", title: "SEO description", type: "text", rows: 3, group: "seo", validation: (rule) => rule.max(160) }),
  ],
  orderings: [{ title: "Publish date, newest", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "category.title", media: "mainImage" }, prepare: ({ title, subtitle, media }) => ({ title, subtitle: subtitle ? `Field Notes: ${subtitle}` : "Field Note", media }) },
});
