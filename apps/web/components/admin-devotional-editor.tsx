"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveDevotional, type AdminActionResult } from "@/app/admin-actions";
import { AdminModal } from "./admin-modal";

export type EditableDevotional = {
  _id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  scriptureReference: string;
  scriptureText: string;
  prayer?: string;
  bodyText: string;
  slug?: string;
  authorId?: string;
  seoTitle?: string;
  seoDescription?: string;
};
const fieldClass =
  "mt-2 w-full rounded-xl border border-[#1e2a24]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#a45d2d] focus:ring-2 focus:ring-[#a45d2d]/15";
export function AdminDevotionalEditor({
  devotional,
  authors = [],
}: {
  devotional?: EditableDevotional;
  authors?: { _id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [replaceBody, setReplaceBody] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      try {
        const response = await saveDevotional(formData);
        setResult(response);
        if (response.ok && response.href) router.push(response.href);
      } catch {
        setResult({ ok: false, message: "The save request failed. Try again." });
      }
    });
  }
  return (
    <AdminModal
      mode={devotional ? "edit" : "create"}
      title={devotional ? "Edit devotional" : "Create devotional"}
      triggerLabel={devotional ? "Edit devotional" : "New devotional"}
    >
      <form onSubmit={submit} className="space-y-5">
        {devotional && (
          <input name="documentId" type="hidden" value={devotional._id} />
        )}
        <label className="block text-sm font-bold">
          Title
          <input
            className={fieldClass}
            defaultValue={devotional?.title}
            maxLength={100}
            name="title"
            required={!devotional}
          />
        </label>
        {!devotional && (
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
          Short introduction
          <textarea
            className={fieldClass}
            defaultValue={devotional?.excerpt}
            maxLength={240}
            name="excerpt"
            required={!devotional}
            rows={3}
          />
        </label>
        <label className="block text-sm font-bold">
          Publish date (UTC)
          <input
            className={fieldClass}
            defaultValue={new Date(
              devotional?.publishedAt ?? Date.now(),
            ).toISOString().slice(0, 16)}
            name="publishedAt"
            required
            type="datetime-local"
          />
        </label>
        <label className="block text-sm font-bold">
          Scripture reference
          <input
            className={fieldClass}
            defaultValue={devotional?.scriptureReference}
            maxLength={80}
            name="scriptureReference"
            required={!devotional}
          />
        </label>
        <label className="block text-sm font-bold">
          Scripture passage
          <textarea
            className={fieldClass}
            defaultValue={devotional?.scriptureText}
            name="scriptureText"
            required={!devotional}
            rows={5}
          />
        </label>
        <label className="block text-sm font-bold">
          Reflection{" "}
          <span className="font-normal text-[#6b786e]">
            Use ## for headings and &gt; for quotes.
          </span>
          <textarea
            className={`${fieldClass} font-mono leading-6`}
            defaultValue={devotional?.bodyText}
            name="bodyText"
            readOnly={Boolean(devotional) && !replaceBody}
            required={!devotional || replaceBody}
            rows={12}
          />
        </label>
        {devotional && (
          <label className="flex items-start gap-3 rounded-xl border border-amber-700/20 bg-amber-50 px-4 py-3 text-sm">
            <input
              checked={replaceBody}
              className="mt-1"
              name="replaceBody"
              onChange={(event) => setReplaceBody(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>Replace the reflection with the text above.</strong>
              <br />
              Leave unchecked to preserve rich text and inline media.
            </span>
          </label>
        )}
        <label className="block text-sm font-bold">
          Closing prayer
          <textarea
            className={fieldClass}
            defaultValue={devotional?.prayer}
            name="prayer"
            rows={5}
          />
        </label>
        {authors.length > 0 && (
          <label className="block text-sm font-bold">
            Author
            <select
              className={fieldClass}
              defaultValue={devotional?.authorId ?? ""}
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
        <div className="grid gap-5 border-t border-[#1e2a24]/10 pt-5 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            SEO title{" "}
            <span className="font-normal text-[#6b786e]">(optional)</span>
            <input
              className={fieldClass}
              defaultValue={devotional?.seoTitle}
              maxLength={65}
              name="seoTitle"
            />
          </label>
          <label className="block text-sm font-bold">
            SEO description{" "}
            <span className="font-normal text-[#6b786e]">(optional)</span>
            <textarea
              className={fieldClass}
              defaultValue={devotional?.seoDescription}
              maxLength={160}
              name="seoDescription"
              rows={3}
            />
          </label>
        </div>
        <div className="flex justify-end border-t border-[#1e2a24]/10 pt-5">
          <button
            className="rounded-full bg-[#1e2a24] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending
              ? "Saving…"
              : devotional
                ? "Save changes"
                : "Publish devotional"}
          </button>
        </div>
        {result && (
          <p
            role={result.ok ? "status" : "alert"}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}
          >
            {result.message}
          </p>
        )}
      </form>
    </AdminModal>
  );
}
