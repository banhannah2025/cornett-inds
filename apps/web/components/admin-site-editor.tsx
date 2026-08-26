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
    <AdminModal title="Edit core website pages" triggerLabel="Edit site pages">
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
        <div className="border-t border-[#1e2a24]/10 pt-5">
          <p className="font-serif text-2xl">Full About page</p>
          <p className="mt-1 text-sm text-[#6b786e]">
            This content appears at /about.
          </p>
        </div>
        <label className="block text-sm font-bold">
          About page eyebrow
          <input
            className={fieldClass}
            defaultValue={settings.aboutPageEyebrow}
            maxLength={100}
            name="aboutPageEyebrow"
            required
          />
        </label>
        <label className="block text-sm font-bold">
          About page headline
          <textarea
            className={fieldClass}
            defaultValue={settings.aboutPageHeadline}
            maxLength={240}
            name="aboutPageHeadline"
            required
            rows={3}
          />
        </label>
        <label className="block text-sm font-bold">
          About page introduction
          <textarea
            className={fieldClass}
            defaultValue={settings.aboutPageIntroduction}
            maxLength={500}
            name="aboutPageIntroduction"
            required
            rows={4}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Robin headline
            <input
              className={fieldClass}
              defaultValue={settings.robinHeadline}
              maxLength={120}
              name="robinHeadline"
              required
            />
          </label>
          <label className="block text-sm font-bold">
            Laura headline
            <input
              className={fieldClass}
              defaultValue={settings.lauraHeadline}
              maxLength={120}
              name="lauraHeadline"
              required
            />
          </label>
        </div>
        <label className="block text-sm font-bold">
          Robin biography
          <textarea
            className={fieldClass}
            defaultValue={settings.robinBio}
            maxLength={2400}
            name="robinBio"
            required
            rows={12}
          />
        </label>
        <label className="block text-sm font-bold">
          Laura biography
          <textarea
            className={fieldClass}
            defaultValue={settings.lauraBio}
            maxLength={2400}
            name="lauraBio"
            required
            rows={12}
          />
        </label>
        <label className="block text-sm font-bold">
          Shared story headline
          <input
            className={fieldClass}
            defaultValue={settings.storyHeadline}
            maxLength={160}
            name="storyHeadline"
            required
          />
        </label>
        <label className="block text-sm font-bold">
          Shared story
          <textarea
            className={fieldClass}
            defaultValue={settings.storyBody}
            maxLength={3000}
            name="storyBody"
            required
            rows={12}
          />
        </label>
        <label className="block text-sm font-bold">
          Values headline
          <input
            className={fieldClass}
            defaultValue={settings.valuesHeadline}
            maxLength={180}
            name="valuesHeadline"
            required
          />
        </label>
        <label className="block text-sm font-bold">
          Trust promise
          <textarea
            className={fieldClass}
            defaultValue={settings.trustPromise}
            maxLength={1000}
            name="trustPromise"
            required
            rows={6}
          />
        </label>
        <div className="border-t border-[#1e2a24]/10 pt-5">
          <p className="font-serif text-2xl">Services page</p>
          <p className="mt-1 text-sm text-[#6b786e]">
            This content appears at /services.
          </p>
        </div>
        <label className="block text-sm font-bold">
          Services headline
          <input
            className={fieldClass}
            defaultValue={settings.servicesHeadline}
            maxLength={160}
            name="servicesHeadline"
            required
          />
        </label>
        <label className="block text-sm font-bold">
          Services introduction
          <textarea
            className={fieldClass}
            defaultValue={settings.servicesIntroduction}
            maxLength={700}
            name="servicesIntroduction"
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
            {pending ? "Saving…" : "Save site pages"}
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
