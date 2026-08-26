"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFieldNote, type AdminActionResult } from "@/app/admin-actions";
import type { FieldNoteCategory } from "@/sanity/lib/types";
import { AdminModal } from "./admin-modal";

export type EditableFieldNote = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  featured?: boolean;
  categoryId: string;
  bodyText: string;
  locationName?: string;
  region?: string;
  visitedFrom?: string;
  visitedTo?: string;
  authorId?: string;
  seoTitle?: string;
  seoDescription?: string;
};
const fieldClass =
  "mt-2 w-full rounded-xl border border-[#1e2a24]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#a45d2d] focus:ring-2 focus:ring-[#a45d2d]/15";

function localDateTimeValue(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function AdminFieldNoteEditor({
  categories,
  note,
  defaultCategoryId,
  authors = [],
}: {
  categories: FieldNoteCategory[];
  note?: EditableFieldNote;
  defaultCategoryId?: string;
  authors?: { _id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const editing = Boolean(note);
  function submit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const response = await saveFieldNote(formData);
      setResult(response);
      if (response.ok) {
        router.refresh();
        if (response.href) router.push(response.href);
      }
    });
  }
  return (
    <AdminModal
      mode={editing ? "edit" : "create"}
      title={editing ? "Edit field note" : "Create field note"}
      triggerLabel={editing ? "Edit field note" : "New field note"}
    >
      <form action={submit} className="space-y-5">
        {note && <input name="documentId" type="hidden" value={note._id} />}
        <label className="block text-sm font-bold">
          Title
          <input
            className={fieldClass}
            defaultValue={note?.title}
            maxLength={100}
            name="title"
            required
          />
        </label>
        {!editing && (
          <label className="block text-sm font-bold">
            URL slug{" "}
            <span className="font-normal text-[#6b786e]">(optional)</span>
            <input
              className={fieldClass}
              name="slug"
              placeholder="generated-from-the-title"
            />
          </label>
        )}
        <label className="block text-sm font-bold">
          Excerpt
          <textarea
            className={fieldClass}
            defaultValue={note?.excerpt}
            maxLength={240}
            name="excerpt"
            required
            rows={3}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Category
            <select
              className={fieldClass}
              defaultValue={
                note?.categoryId ?? defaultCategoryId ?? categories[0]?._id
              }
              name="categoryId"
              required
            >
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Publish date
            <input
              className={fieldClass}
              defaultValue={localDateTimeValue(note?.publishedAt)}
              name="publishedAt"
              type="datetime-local"
            />
          </label>
        </div>
        {authors.length > 0 && (
          <label className="block text-sm font-bold">
            Author
            <select
              className={fieldClass}
              defaultValue={note?.authorId ?? ""}
              name="authorId"
            >
              <option value="">No author selected</option>
              {authors.map((author) => (
                <option key={author._id} value={author._id}>
                  {author.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Location name
            <input
              className={fieldClass}
              defaultValue={note?.locationName}
              name="locationName"
            />
          </label>
          <label className="block text-sm font-bold">
            Region / state
            <input
              className={fieldClass}
              defaultValue={note?.region}
              name="region"
            />
          </label>
          <label className="block text-sm font-bold">
            Visit began
            <input
              className={fieldClass}
              defaultValue={note?.visitedFrom}
              name="visitedFrom"
              type="date"
            />
          </label>
          <label className="block text-sm font-bold">
            Visit ended
            <input
              className={fieldClass}
              defaultValue={note?.visitedTo}
              name="visitedTo"
              type="date"
            />
          </label>
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-[#ebe7dc] px-4 py-3 text-sm font-bold">
          <input
            defaultChecked={note?.featured}
            name="featured"
            type="checkbox"
          />{" "}
          Feature this field note
        </label>
        <label className="block text-sm font-bold">
          Field note body{" "}
          <span className="font-normal text-[#6b786e]">
            Use ## for headings and &gt; for quotes.
          </span>
          <textarea
            className={`${fieldClass} font-mono leading-6`}
            defaultValue={note?.bodyText}
            name="bodyText"
            required={!editing}
            rows={12}
          />
        </label>
        {editing && (
          <label className="flex items-start gap-3 rounded-xl border border-amber-700/20 bg-amber-50 px-4 py-3 text-sm">
            <input className="mt-1" name="replaceBody" type="checkbox" />
            <span>
              <strong>Replace the body with the text above.</strong>
              <br />
              Leave unchecked to preserve rich text and inline media.
            </span>
          </label>
        )}
        <div className="grid gap-5 border-t border-[#1e2a24]/10 pt-5 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            SEO title{" "}
            <span className="font-normal text-[#6b786e]">(optional)</span>
            <input
              className={fieldClass}
              defaultValue={note?.seoTitle}
              maxLength={65}
              name="seoTitle"
            />
          </label>
          <label className="block text-sm font-bold">
            SEO description{" "}
            <span className="font-normal text-[#6b786e]">(optional)</span>
            <textarea
              className={fieldClass}
              defaultValue={note?.seoDescription}
              maxLength={160}
              name="seoDescription"
              rows={3}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#1e2a24]/10 pt-5">
          <button
            className="rounded-full bg-[#1e2a24] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Publish field note"}
          </button>
        </div>
        {result && (
          <p
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}
          >
            {result.message}
          </p>
        )}
      </form>
    </AdminModal>
  );
}
