"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveDirectoryEntry,
  type AdminActionResult,
} from "@/app/admin-actions";
import { AdminModal } from "./admin-modal";

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#1e2a24]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#a45d2d] focus:ring-2 focus:ring-[#a45d2d]/15";

type Entry = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  bio?: string;
  order?: number;
};

export function AdminDirectoryEditor({
  documentType,
  entry,
}: {
  documentType: "category" | "fieldNoteCategory" | "author";
  entry?: Entry;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const author = documentType === "author";
  const label = author
    ? "author"
    : documentType === "category"
      ? "news category"
      : "field-note category";

  function submit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const response = await saveDirectoryEntry(formData);
      setResult(response);
      if (response.ok) router.refresh();
    });
  }

  return (
    <AdminModal
      mode={entry ? "edit" : "create"}
      title={`${entry ? "Edit" : "Create"} ${label}`}
      triggerLabel={entry ? "Edit" : `New ${label}`}
    >
      <form action={submit} className="space-y-5">
        <input name="documentType" type="hidden" value={documentType} />
        {entry && <input name="documentId" type="hidden" value={entry._id} />}
        <label className="block text-sm font-bold">
          {author ? "Name" : "Title"}
          <input
            className={fieldClass}
            defaultValue={author ? entry?.name : entry?.title}
            name={author ? "name" : "title"}
            required
          />
        </label>
        {!entry && (
          <label className="block text-sm font-bold">
            URL slug{" "}
            <span className="font-normal text-[#6b786e]">(optional)</span>
            <input
              className={fieldClass}
              name="slug"
              placeholder="generated-automatically"
            />
          </label>
        )}
        {author ? (
          <label className="block text-sm font-bold">
            Biography
            <textarea
              className={fieldClass}
              defaultValue={entry?.bio}
              name="bio"
              rows={5}
            />
          </label>
        ) : (
          <>
            <label className="block text-sm font-bold">
              Description
              <textarea
                className={fieldClass}
                defaultValue={entry?.description}
                maxLength={500}
                name="description"
                required
                rows={4}
              />
            </label>
            <label className="block text-sm font-bold">
              Display order
              <input
                className={fieldClass}
                defaultValue={entry?.order ?? 0}
                min={0}
                name="order"
                type="number"
              />
            </label>
          </>
        )}
        <div className="flex items-center justify-end gap-4 border-t border-[#1e2a24]/10 pt-5">
          {result && (
            <p
              className={`mr-auto rounded-xl px-4 py-3 text-sm font-semibold ${result.ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}
            >
              {result.message}
            </p>
          )}
          <button
            className="rounded-full bg-[#1e2a24] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
