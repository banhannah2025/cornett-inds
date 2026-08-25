"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminModal } from "./admin-modal";
import { saveNewsPost, type AdminActionResult } from "@/app/admin-actions";
import type { NewsCategory } from "@/sanity/lib/types";

type EditablePost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  featured?: boolean;
  categoryId: string;
  bodyText: string;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#1e2a24]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#a45d2d] focus:ring-2 focus:ring-[#a45d2d]/15";

function localDateTimeValue(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function AdminPostEditor({
  categories,
  post,
  defaultCategoryId,
}: {
  categories: NewsCategory[];
  post?: EditablePost;
  defaultCategoryId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const editing = Boolean(post);

  function submit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const response = await saveNewsPost(formData);
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
      title={editing ? "Edit news post" : "Create news post"}
      triggerLabel={editing ? "Edit post" : "New post"}
    >
      <form action={submit} className="space-y-5">
        {post && <input name="documentId" type="hidden" value={post._id} />}
        <label className="block text-sm font-bold">
          Title
          <input
            className={fieldClass}
            defaultValue={post?.title}
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
              defaultValue={post?.slug}
              maxLength={96}
              name="slug"
              placeholder="generated-from-the-title"
            />
          </label>
        )}
        <label className="block text-sm font-bold">
          Excerpt
          <textarea
            className={fieldClass}
            defaultValue={post?.excerpt}
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
                post?.categoryId ?? defaultCategoryId ?? categories[0]?._id
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
              defaultValue={localDateTimeValue(post?.publishedAt)}
              name="publishedAt"
              type="datetime-local"
            />
          </label>
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-[#ebe7dc] px-4 py-3 text-sm font-bold">
          <input
            defaultChecked={post?.featured}
            name="featured"
            type="checkbox"
          />{" "}
          Feature this story
        </label>
        <label className="block text-sm font-bold">
          Article body{" "}
          <span className="font-normal text-[#6b786e]">
            Use ## for headings and &gt; for quotes.
          </span>
          <textarea
            className={`${fieldClass} font-mono leading-6`}
            defaultValue={post?.bodyText}
            name="bodyText"
            required={!editing}
            rows={12}
          />
        </label>
        {editing && (
          <label className="flex items-start gap-3 rounded-xl border border-amber-700/20 bg-amber-50 px-4 py-3 text-sm">
            <input className="mt-1" name="replaceBody" type="checkbox" />
            <span>
              <strong>Replace article body with the text above.</strong>
              <br />
              Leave unchecked to preserve the current rich text and inline
              media. Use Sanity Studio for advanced image and block editing.
            </span>
          </label>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#1e2a24]/10 pt-5">
          <a
            className="text-sm font-bold text-[#a45d2d]"
            href="https://robin-and-laura-news.sanity.studio/"
            rel="noreferrer"
            target="_blank"
          >
            Open advanced Studio ↗
          </a>
          <button
            className="rounded-full bg-[#1e2a24] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? "Saving…" : editing ? "Save changes" : "Publish post"}
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
