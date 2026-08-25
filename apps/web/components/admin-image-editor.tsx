"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { savePostImage, type AdminActionResult } from "@/app/admin-actions";
import type { SanityImageAsset } from "@/sanity/lib/assets";
import { AdminModal } from "./admin-modal";

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#1e2a24]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#a45d2d] focus:ring-2 focus:ring-[#a45d2d]/15";

export function AdminImageEditor({
  documentId,
  documentType,
  assets,
  currentAlt,
  currentCaption,
  hasImage,
}: {
  documentId: string;
  documentType: "post" | "fieldNote" | "devotional";
  assets: SanityImageAsset[];
  currentAlt?: string;
  currentCaption?: string;
  hasImage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminActionResult | null>(null);
  function submit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const response = await savePostImage(formData);
      setResult(response);
      if (response.ok) router.refresh();
    });
  }
  return (
    <AdminModal
      title={hasImage ? "Edit post image" : "Add post image"}
      triggerLabel={hasImage ? "Edit image" : "Add image"}
    >
      <form action={submit} className="space-y-6">
        <input name="documentId" type="hidden" value={documentId} />
        <input name="documentType" type="hidden" value={documentType} />
        <section>
          <div className="flex items-center gap-2">
            <ImagePlus className="size-5 text-[#a45d2d]" />
            <h3 className="font-serif text-2xl">Upload a new image</h3>
          </div>
          <input
            accept="image/*"
            className={`${fieldClass} file:mr-4 file:rounded-full file:border-0 file:bg-[#1e2a24] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white`}
            name="imageFile"
            type="file"
          />
          <p className="mt-2 text-xs text-[#6b786e]">
            JPEG, PNG, WebP, or GIF up to 10 MB.
          </p>
        </section>
        {assets.length > 0 && (
          <section className="border-t border-[#1e2a24]/10 pt-6">
            <h3 className="font-serif text-2xl">Or choose an existing image</h3>
            <div className="mt-4 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-2 sm:grid-cols-3">
              {assets.map((asset) => (
                <label
                  className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-[#dfe5dc] has-[:checked]:ring-4 has-[:checked]:ring-[#f4b860]"
                  key={asset._id}
                >
                  <input
                    className="peer absolute left-2 top-2 z-10 size-4"
                    name="assetId"
                    type="radio"
                    value={asset._id}
                  />
                  <Image
                    alt={asset.originalFilename ?? "Existing Sanity image"}
                    className="object-cover transition group-hover:scale-105"
                    fill
                    sizes="200px"
                    src={asset.url}
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-2 py-1.5 text-[10px] text-white">
                    {asset.originalFilename ?? "Untitled image"}
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}
        <div className="grid gap-5 border-t border-[#1e2a24]/10 pt-6 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Alternative text
            <input
              className={fieldClass}
              defaultValue={currentAlt}
              maxLength={240}
              name="alt"
              placeholder="Describe the image"
              required
            />
          </label>
          <label className="block text-sm font-bold">
            Caption{" "}
            <span className="font-normal text-[#6b786e]">(optional)</span>
            <input
              className={fieldClass}
              defaultValue={currentCaption}
              name="caption"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#1e2a24]/10 pt-5">
          {result && (
            <p
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}
            >
              {result.message}
            </p>
          )}
          <button
            className="ml-auto rounded-full bg-[#1e2a24] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Saving image…" : "Save image"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
