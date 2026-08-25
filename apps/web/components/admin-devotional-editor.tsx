"use client";

import { useState, useTransition } from "react";
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
};
const fieldClass =
  "mt-2 w-full rounded-xl border border-[#1e2a24]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#a45d2d] focus:ring-2 focus:ring-[#a45d2d]/15";
function localDateTimeValue(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function AdminDevotionalEditor({
  devotional,
}: {
  devotional: EditableDevotional;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminActionResult | null>(null);
  function submit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const response = await saveDevotional(formData);
      setResult(response);
      if (response.ok) router.refresh();
    });
  }
  return (
    <AdminModal title="Edit devotional" triggerLabel="Edit devotional">
      <form action={submit} className="space-y-5">
        <input name="documentId" type="hidden" value={devotional._id} />
        <label className="block text-sm font-bold">
          Title
          <input
            className={fieldClass}
            defaultValue={devotional.title}
            maxLength={100}
            name="title"
            required
          />
        </label>
        <label className="block text-sm font-bold">
          Short introduction
          <textarea
            className={fieldClass}
            defaultValue={devotional.excerpt}
            maxLength={240}
            name="excerpt"
            required
            rows={3}
          />
        </label>
        <label className="block text-sm font-bold">
          Publish date
          <input
            className={fieldClass}
            defaultValue={localDateTimeValue(devotional.publishedAt)}
            name="publishedAt"
            required
            type="datetime-local"
          />
        </label>
        <label className="block text-sm font-bold">
          Scripture reference
          <input
            className={fieldClass}
            defaultValue={devotional.scriptureReference}
            maxLength={80}
            name="scriptureReference"
            required
          />
        </label>
        <label className="block text-sm font-bold">
          Scripture passage
          <textarea
            className={fieldClass}
            defaultValue={devotional.scriptureText}
            name="scriptureText"
            required
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
            defaultValue={devotional.bodyText}
            name="bodyText"
            rows={12}
          />
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-amber-700/20 bg-amber-50 px-4 py-3 text-sm">
          <input className="mt-1" name="replaceBody" type="checkbox" />
          <span>
            <strong>Replace the reflection with the text above.</strong>
            <br />
            Leave unchecked to preserve rich text and inline media.
          </span>
        </label>
        <label className="block text-sm font-bold">
          Closing prayer
          <textarea
            className={fieldClass}
            defaultValue={devotional.prayer}
            name="prayer"
            rows={5}
          />
        </label>
        <div className="flex justify-end border-t border-[#1e2a24]/10 pt-5">
          <button
            className="rounded-full bg-[#1e2a24] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save changes"}
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
