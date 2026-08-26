"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/admin";
import { editorTextToPortableText } from "@/sanity/lib/editor";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

export type AdminActionResult = { ok: boolean; message: string; href?: string };

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function required(formData: FormData, key: string, label: string, max: number) {
  const result = value(formData, key);
  if (!result) throw new Error(`${label} is required.`);
  if (result.length > max)
    throw new Error(`${label} must be ${max} characters or fewer.`);
  return result;
}

function optional(formData: FormData, key: string, label: string, max: number) {
  const result = value(formData, key);
  if (result.length > max)
    throw new Error(`${label} must be ${max} characters or fewer.`);
  return result;
}

async function authorReference(formData: FormData) {
  if (!formData.has("authorId")) return undefined;
  const authorId = value(formData, "authorId");
  if (!authorId) return null;
  const exists = await getSanityWriteClient().fetch<string | null>(
    `*[_type == "author" && _id == $id][0]._id`,
    { id: authorId },
  );
  if (!exists) throw new Error("Choose a valid author.");
  return { _type: "reference", _ref: authorId };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export async function saveNewsPost(
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    await requireAdministrator();
    const client = getSanityWriteClient();
    const documentId = value(formData, "documentId");
    const title = required(formData, "title", "Title", 100);
    const excerpt = required(formData, "excerpt", "Excerpt", 240);
    const categoryId = required(formData, "categoryId", "Category", 100);
    const category = await client.fetch<{ _id: string; slug: string } | null>(
      `*[_type == "category" && _id == $id][0]{_id,"slug":slug.current}`,
      { id: categoryId },
    );
    if (!category) throw new Error("Choose a valid news category.");

    const publishedInput = value(formData, "publishedAt");
    const publishedAt = publishedInput
      ? new Date(publishedInput).toISOString()
      : new Date().toISOString();
    const featured = formData.get("featured") === "on";
    const bodyText = value(formData, "bodyText");
    const replaceBody = !documentId || formData.get("replaceBody") === "on";
    const author = await authorReference(formData);

    if (documentId) {
      const existing = await client.fetch<{ _id: string; slug: string } | null>(
        `*[_type == "post" && _id == $id][0]{_id,"slug":slug.current}`,
        { id: documentId },
      );
      if (!existing) throw new Error("The post could not be found.");
      const fields: Record<string, unknown> = {
        title,
        excerpt,
        category: { _type: "reference", _ref: categoryId },
        publishedAt,
        featured,
        ...(author !== undefined ? { author } : {}),
        seoTitle: optional(formData, "seoTitle", "SEO title", 65),
        seoDescription: optional(
          formData,
          "seoDescription",
          "SEO description",
          160,
        ),
      };
      if (replaceBody) {
        if (!bodyText)
          throw new Error(
            "Article body is required when replacing body content.",
          );
        fields.body = editorTextToPortableText(bodyText);
      }
      await client.patch(documentId).set(fields).commit();
      revalidatePath("/news");
      revalidatePath(`/news/${category.slug}`);
      revalidatePath(`/news/${category.slug}/${existing.slug}`);
      return {
        ok: true,
        message: "Post updated.",
        href: `/news/${category.slug}/${existing.slug}`,
      };
    }

    if (!bodyText) throw new Error("Article body is required.");
    const requestedSlug = slugify(value(formData, "slug") || title);
    if (!requestedSlug) throw new Error("Enter a valid slug.");
    const duplicate = await client.fetch<string | null>(
      `*[_type == "post" && slug.current == $slug][0]._id`,
      { slug: requestedSlug },
    );
    if (duplicate) throw new Error("That post slug is already in use.");

    await client.create({
      _type: "post",
      title,
      slug: { _type: "slug", current: requestedSlug },
      excerpt,
      category: { _type: "reference", _ref: categoryId },
      publishedAt,
      featured,
      ...(author !== undefined ? { author } : {}),
      seoTitle: optional(formData, "seoTitle", "SEO title", 65),
      seoDescription: optional(
        formData,
        "seoDescription",
        "SEO description",
        160,
      ),
      body: editorTextToPortableText(bodyText),
    });
    revalidatePath("/news");
    revalidatePath(`/news/${category.slug}`);
    return {
      ok: true,
      message: "Post published.",
      href: `/news/${category.slug}/${requestedSlug}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to save the post.",
    };
  }
}

export async function saveSiteSettings(
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    await requireAdministrator();
    const settings = {
      heroEyebrow: required(formData, "heroEyebrow", "Hero eyebrow", 80),
      heroHeadline: required(formData, "heroHeadline", "Hero headline", 80),
      heroAccent: required(formData, "heroAccent", "Hero accent", 80),
      heroIntroduction: required(
        formData,
        "heroIntroduction",
        "Hero introduction",
        320,
      ),
      aboutHeadline: required(formData, "aboutHeadline", "About headline", 240),
      aboutRobinAndLaura: required(
        formData,
        "aboutRobinAndLaura",
        "About paragraph",
        600,
      ),
      aboutJournal: required(
        formData,
        "aboutJournal",
        "Journal paragraph",
        600,
      ),
      aboutPageEyebrow: required(
        formData,
        "aboutPageEyebrow",
        "About page eyebrow",
        100,
      ),
      aboutPageHeadline: required(
        formData,
        "aboutPageHeadline",
        "About page headline",
        240,
      ),
      aboutPageIntroduction: required(
        formData,
        "aboutPageIntroduction",
        "About page introduction",
        500,
      ),
      robinHeadline: required(formData, "robinHeadline", "Robin headline", 120),
      robinBio: required(formData, "robinBio", "Robin biography", 2400),
      lauraHeadline: required(formData, "lauraHeadline", "Laura headline", 120),
      lauraBio: required(formData, "lauraBio", "Laura biography", 2400),
      storyHeadline: required(
        formData,
        "storyHeadline",
        "Shared story headline",
        160,
      ),
      storyBody: required(formData, "storyBody", "Shared story", 3000),
      valuesHeadline: required(
        formData,
        "valuesHeadline",
        "Values headline",
        180,
      ),
      trustPromise: required(formData, "trustPromise", "Trust promise", 1000),
      servicesHeadline: required(
        formData,
        "servicesHeadline",
        "Services headline",
        160,
      ),
      servicesIntroduction: required(
        formData,
        "servicesIntroduction",
        "Services introduction",
        700,
      ),
    };
    await getSanityWriteClient().createOrReplace({
      _id: "siteSettings",
      _type: "siteSettings",
      ...settings,
    });
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/services");
    return {
      ok: true,
      message: "Homepage, About page, and services page updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update the homepage.",
    };
  }
}

export async function saveFieldNote(
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    await requireAdministrator();
    const client = getSanityWriteClient();
    const documentId = value(formData, "documentId");
    const title = required(formData, "title", "Title", 100);
    const excerpt = required(formData, "excerpt", "Excerpt", 240);
    const categoryId = required(formData, "categoryId", "Category", 100);
    const category = await client.fetch<{ _id: string; slug: string } | null>(
      `*[_type == "fieldNoteCategory" && _id == $id][0]{_id,"slug":slug.current}`,
      { id: categoryId },
    );
    if (!category) throw new Error("Choose a valid field note category.");
    const publishedInput = value(formData, "publishedAt");
    const publishedAt = publishedInput
      ? new Date(publishedInput).toISOString()
      : new Date().toISOString();
    const bodyText = value(formData, "bodyText");
    const replaceBody = !documentId || formData.get("replaceBody") === "on";
    const fieldNoteAuthor = await authorReference(formData);
    const sharedFields: Record<string, unknown> = {
      title,
      excerpt,
      category: { _type: "reference", _ref: categoryId },
      publishedAt,
      featured: formData.get("featured") === "on",
      locationName: value(formData, "locationName"),
      region: value(formData, "region"),
      visitedFrom: value(formData, "visitedFrom"),
      visitedTo: value(formData, "visitedTo"),
      ...(fieldNoteAuthor !== undefined ? { author: fieldNoteAuthor } : {}),
      seoTitle: optional(formData, "seoTitle", "SEO title", 65),
      seoDescription: optional(
        formData,
        "seoDescription",
        "SEO description",
        160,
      ),
    };
    if (documentId) {
      const existing = await client.fetch<{ _id: string; slug: string } | null>(
        `*[_type == "fieldNote" && _id == $id][0]{_id,"slug":slug.current}`,
        { id: documentId },
      );
      if (!existing) throw new Error("The field note could not be found.");
      if (replaceBody) {
        if (!bodyText)
          throw new Error(
            "Field note body is required when replacing body content.",
          );
        sharedFields.body = editorTextToPortableText(bodyText);
      }
      await client.patch(documentId).set(sharedFields).commit();
      revalidatePath("/field-notes");
      revalidatePath(`/field-notes/${category.slug}`);
      revalidatePath(`/field-notes/${category.slug}/${existing.slug}`);
      return {
        ok: true,
        message: "Field note updated.",
        href: `/field-notes/${category.slug}/${existing.slug}`,
      };
    }
    if (!bodyText) throw new Error("Field note body is required.");
    const requestedSlug = slugify(value(formData, "slug") || title);
    if (!requestedSlug) throw new Error("Enter a valid slug.");
    const duplicate = await client.fetch<string | null>(
      `*[_type == "fieldNote" && slug.current == $slug][0]._id`,
      { slug: requestedSlug },
    );
    if (duplicate) throw new Error("That field note slug is already in use.");
    await client.create({
      _type: "fieldNote",
      slug: { _type: "slug", current: requestedSlug },
      body: editorTextToPortableText(bodyText),
      ...sharedFields,
    });
    revalidatePath("/field-notes");
    revalidatePath(`/field-notes/${category.slug}`);
    return {
      ok: true,
      message: "Field note published.",
      href: `/field-notes/${category.slug}/${requestedSlug}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to save the field note.",
    };
  }
}

export async function saveDevotional(
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    await requireAdministrator();
    const client = getSanityWriteClient();
    const documentId = value(formData, "documentId");
    const existing = documentId
      ? await client.fetch<{ _id: string; slug: string } | null>(
          `*[_type == "devotional" && _id == $id][0]{_id,"slug":slug.current}`,
          { id: documentId },
        )
      : null;
    if (documentId && !existing)
      throw new Error("The devotional could not be found.");
    const publishedInput = required(
      formData,
      "publishedAt",
      "Publish date",
      40,
    );
    const publishedDate = new Date(publishedInput);
    if (Number.isNaN(publishedDate.getTime()))
      throw new Error("Enter a valid publish date.");
    const bodyText = value(formData, "bodyText");
    const replaceBody = !documentId || formData.get("replaceBody") === "on";
    const devotionalAuthor = await authorReference(formData);
    const fields: Record<string, unknown> = {
      title: required(formData, "title", "Title", 100),
      excerpt: required(formData, "excerpt", "Short introduction", 240),
      publishedAt: publishedDate.toISOString(),
      scriptureReference: required(
        formData,
        "scriptureReference",
        "Scripture reference",
        80,
      ),
      scriptureText: required(
        formData,
        "scriptureText",
        "Scripture passage",
        5000,
      ),
      prayer: value(formData, "prayer"),
      ...(devotionalAuthor !== undefined ? { author: devotionalAuthor } : {}),
      seoTitle: optional(formData, "seoTitle", "SEO title", 65),
      seoDescription: optional(
        formData,
        "seoDescription",
        "SEO description",
        160,
      ),
    };
    if (replaceBody) {
      if (!bodyText)
        throw new Error("Reflection is required when replacing its content.");
      fields.body = editorTextToPortableText(bodyText);
    }
    if (!documentId) {
      const requestedSlug = slugify(
        value(formData, "slug") || String(fields.title),
      );
      if (!requestedSlug) throw new Error("Enter a valid slug.");
      const duplicate = await client.fetch<string | null>(
        `*[_type == "devotional" && slug.current == $slug][0]._id`,
        { slug: requestedSlug },
      );
      if (duplicate) throw new Error("That devotional slug is already in use.");
      await client.create({
        _type: "devotional",
        slug: { _type: "slug", current: requestedSlug },
        ...fields,
      });
      revalidatePath("/devotionals");
      return {
        ok: true,
        message: "Devotional published.",
        href: `/devotionals/${requestedSlug}`,
      };
    }
    await client.patch(documentId).set(fields).commit();
    revalidatePath("/devotionals");
    revalidatePath(`/devotionals/${existing!.slug}`);
    return {
      ok: true,
      message: "Devotional updated.",
      href: `/devotionals/${existing!.slug}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to save the devotional.",
    };
  }
}

export async function savePostImage(
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    await requireAdministrator();
    const client = getSanityWriteClient();
    const documentId = required(formData, "documentId", "Document ID", 200);
    const documentType = required(
      formData,
      "documentType",
      "Document type",
      30,
    );
    if (
      !(["post", "fieldNote", "devotional"] as string[]).includes(documentType)
    )
      throw new Error("Unsupported content type.");
    const document = await client.fetch<{ _id: string; _type: string } | null>(
      `*[_id == $id][0]{_id,_type}`,
      { id: documentId },
    );
    if (!document || document._type !== documentType)
      throw new Error("The post could not be found.");

    const upload = formData.get("imageFile");
    let assetId = value(formData, "assetId");
    if (upload instanceof File && upload.size > 0) {
      if (!upload.type.startsWith("image/"))
        throw new Error("Choose a valid image file.");
      if (upload.size > 10 * 1024 * 1024)
        throw new Error("Images must be 10 MB or smaller.");
      const asset = await client.assets.upload("image", upload, {
        filename: upload.name,
      });
      assetId = asset._id;
    }
    if (!assetId) throw new Error("Upload an image or select an existing one.");
    const validAsset = await client.fetch<string | null>(
      `*[_type == "sanity.imageAsset" && _id == $id][0]._id`,
      { id: assetId },
    );
    if (!validAsset) throw new Error("The selected image no longer exists.");

    await client
      .patch(documentId)
      .set({
        mainImage: {
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
          alt: required(formData, "alt", "Alternative text", 240),
          caption: value(formData, "caption"),
        },
      })
      .commit();
    revalidatePath("/", "layout");
    return { ok: true, message: "Post image updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update the image.",
    };
  }
}

export async function saveDirectoryEntry(
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    await requireAdministrator();
    const client = getSanityWriteClient();
    const documentId = value(formData, "documentId");
    const documentType = required(formData, "documentType", "Content type", 40);
    if (
      !(["category", "fieldNoteCategory", "author"] as string[]).includes(
        documentType,
      )
    )
      throw new Error("Unsupported directory type.");

    const titleKey = documentType === "author" ? "name" : "title";
    const title = required(
      formData,
      titleKey,
      documentType === "author" ? "Name" : "Title",
      100,
    );
    const fields: Record<string, unknown> = {
      [titleKey]: title,
      ...(documentType === "author"
        ? { bio: optional(formData, "bio", "Bio", 1000) }
        : {
            description: required(formData, "description", "Description", 500),
            order: Number(value(formData, "order") || 0),
          }),
    };

    if (documentId) {
      const existing = await client.fetch<string | null>(
        `*[_type == $type && _id == $id][0]._id`,
        { type: documentType, id: documentId },
      );
      if (!existing) throw new Error("The item could not be found.");
      await client.patch(documentId).set(fields).commit();
    } else {
      const requestedSlug = slugify(value(formData, "slug") || title);
      if (!requestedSlug) throw new Error("Enter a valid slug.");
      const duplicate = await client.fetch<string | null>(
        `*[_type == $type && slug.current == $slug][0]._id`,
        { type: documentType, slug: requestedSlug },
      );
      if (duplicate) throw new Error("That slug is already in use.");
      await client.create({
        _type: documentType,
        slug: { _type: "slug", current: requestedSlug },
        ...fields,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: documentId ? "Item updated." : "Item created.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to save the item.",
    };
  }
}
