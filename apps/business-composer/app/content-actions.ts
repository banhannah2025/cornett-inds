"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  isPlatformAdministrator,
  parsePlatformAdministratorEmails,
} from "@repo/platform";
import { editorTextToPortableText, getSanityClient } from "@/lib/site-content";

export type ContentActionResult = { ok: boolean; message: string };

async function requireAdmin() {
  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  const authorized = isPlatformAdministrator(
    {
      emailAddress: primaryEmail?.emailAddress,
      emailVerified: primaryEmail?.verification?.status === "verified",
    },
    parsePlatformAdministratorEmails(process.env.BLENDED_WORKS_ADMIN_EMAILS),
  );
  if (!authorized) throw new Error("Administrator access required.");
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
function required(formData: FormData, key: string, label: string, max = 5000) {
  const result = value(formData, key);
  if (!result) throw new Error(`${label} is required.`);
  if (result.length > max)
    throw new Error(`${label} must be ${max} characters or fewer.`);
  return result;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function publishDate(formData: FormData) {
  const input = required(formData, "publishedAt", "Publish date", 40);
  const date = new Date(input);
  if (Number.isNaN(date.getTime()))
    throw new Error("Enter a valid publish date.");
  return date.toISOString();
}

async function validCategoryReference(
  documentType: "post" | "fieldNote",
  categoryId: string,
) {
  const categoryType =
    documentType === "post" ? "category" : "fieldNoteCategory";
  const category = await getSanityClient().fetch<string | null>(
    `*[_type == $categoryType && _id == $id][0]._id`,
    { categoryType, id: categoryId },
  );
  if (!category) throw new Error("Choose a valid category.");
  return category;
}

export async function saveHomepage(
  formData: FormData,
): Promise<ContentActionResult> {
  try {
    await requireAdmin();
    await getSanityClient(true).createOrReplace({
      _id: "siteSettings",
      _type: "siteSettings",
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
    });
    revalidatePath("/");
    return { ok: true, message: "Homepage saved." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to save homepage.",
    };
  }
}

export async function saveContentDocument(
  formData: FormData,
): Promise<ContentActionResult> {
  try {
    await requireAdmin();
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
    const existing = await getSanityClient().fetch<{ _type: string } | null>(
      `*[_id == $id][0]{_type}`,
      { id: documentId },
    );
    if (!existing || existing._type !== documentType)
      throw new Error("Content record not found.");
    const fields: Record<string, unknown> = {
      title: required(formData, "title", "Title", 100),
      excerpt: required(formData, "excerpt", "Excerpt", 240),
      publishedAt: publishDate(formData),
      body: editorTextToPortableText(required(formData, "bodyText", "Body")),
    };
    if (documentType === "post" || documentType === "fieldNote") {
      const categoryId = required(formData, "categoryId", "Category", 200);
      await validCategoryReference(documentType, categoryId);
      fields.featured = formData.get("featured") === "on";
      fields.category = {
        _type: "reference",
        _ref: categoryId,
      };
    }
    if (documentType === "devotional") {
      fields.scriptureReference = required(
        formData,
        "scriptureReference",
        "Scripture reference",
        80,
      );
      fields.scriptureText = required(
        formData,
        "scriptureText",
        "Scripture passage",
      );
      fields.prayer = value(formData, "prayer");
    }
    await getSanityClient(true).patch(documentId).set(fields).commit();
    revalidatePath("/");
    return { ok: true, message: "Content saved." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to save content.",
    };
  }
}

export async function createDevotional(
  formData: FormData,
): Promise<ContentActionResult> {
  try {
    await requireAdmin();
    const client = getSanityClient(true);
    const title = required(formData, "title", "Title", 100);
    const slug = slugify(value(formData, "slug") || title);
    if (!slug) throw new Error("Enter a valid title or URL slug.");
    const duplicate = await client.fetch<string | null>(
      `*[_type == "devotional" && slug.current == $slug][0]._id`,
      { slug },
    );
    if (duplicate)
      throw new Error("That devotional URL slug is already in use.");
    const created = await client.create({
      _type: "devotional",
      title,
      slug: { _type: "slug", current: slug },
      excerpt: required(formData, "excerpt", "Excerpt", 240),
      publishedAt: publishDate(formData),
      scriptureReference: required(
        formData,
        "scriptureReference",
        "Scripture reference",
        80,
      ),
      scriptureText: required(formData, "scriptureText", "Scripture passage"),
      body: editorTextToPortableText(
        required(formData, "bodyText", "Reflection"),
      ),
      prayer: value(formData, "prayer"),
    });
    const persisted = await client.fetch<string | null>(
      `*[_type == "devotional" && _id == $id && defined(slug.current) && defined(publishedAt)][0]._id`,
      { id: created._id },
    );
    if (persisted !== created._id)
      throw new Error("Sanity did not confirm the saved devotional.");
    revalidatePath("/");
    return { ok: true, message: "Devotional published." };
  } catch (error) {
    console.error("[content:create-devotional] failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to publish devotional.",
    };
  }
}

export async function deleteDevotional(
  documentId: string,
): Promise<ContentActionResult> {
  try {
    await requireAdmin();
    const existing = await getSanityClient().fetch<{ _type: string } | null>(
      `*[_id == $id][0]{_type}`,
      { id: documentId },
    );
    if (!existing || existing._type !== "devotional")
      throw new Error("Devotional not found.");
    await getSanityClient(true).delete(documentId);
    revalidatePath("/");
    return { ok: true, message: "Devotional deleted." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to delete devotional.",
    };
  }
}
