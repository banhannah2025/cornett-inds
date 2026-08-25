"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminModal } from "./admin-modal";
import { saveSiteSettings, type AdminActionResult } from "@/app/admin-actions";
import type { SiteSettings } from "@/sanity/lib/types";

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#1e2a24]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#a45d2d] focus:ring-2 focus:ring-[#a45d2d]/15";

export function AdminSiteEditor({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminActionResult | null>(null);
  function submit(formData: FormData) {
    startTransition(async () => {
      const response = await saveSiteSettings(formData);
      setResult(response);
      if (response.ok) router.refresh();
    });
  }
  return (
    <AdminModal title="Edit homepage copy" triggerLabel="Edit page">
      <form action={submit} className="space-y-5">
        <label className="block text-sm font-bold">
          Hero eyebrow
          <input
            className={fieldClass}
            defaultValue={settings.heroEyebrow}
            maxLength={80}
            name="heroEyebrow"
            required
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Hero headline
            <input
              className={fieldClass}
              defaultValue={settings.heroHeadline}
              maxLength={80}
              name="heroHeadline"
              required
            />
          </label>
          <label className="block text-sm font-bold">
            Hero accent line
            <input
              className={fieldClass}
              defaultValue={settings.heroAccent}
              maxLength={80}
              name="heroAccent"
              required
            />
          </label>
        </div>
        <label className="block text-sm font-bold">
          Hero introduction
          <textarea
            className={fieldClass}
            defaultValue={settings.heroIntroduction}
            maxLength={320}
            name="heroIntroduction"
            required
            rows={4}
          />
        </label>
        <label className="block text-sm font-bold">
          About headline
          <textarea
            className={fieldClass}
            defaultValue={settings.aboutHeadline}
            maxLength={240}
            name="aboutHeadline"
            required
            rows={3}
          />
        </label>
        <label className="block text-sm font-bold">
          About Robin and Laura
          <textarea
            className={fieldClass}
            defaultValue={settings.aboutRobinAndLaura}
            maxLength={600}
            name="aboutRobinAndLaura"
            required
            rows={5}
          />
        </label>
        <label className="block text-sm font-bold">
          About the journal
          <textarea
            className={fieldClass}
            defaultValue={settings.aboutJournal}
            maxLength={600}
            name="aboutJournal"
            required
            rows={5}
          />
        </label>
        <div className="flex justify-end border-t border-[#1e2a24]/10 pt-5">
          <button
            className="rounded-full bg-[#1e2a24] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? "Saving…" : "Save page"}
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
