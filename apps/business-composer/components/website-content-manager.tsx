"use client";

import { useRef, useState, useTransition } from "react";
import {
  ArrowUpRight,
  BookHeart,
  FileText,
  Globe2,
  MapPinned,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createDevotional,
  deleteDevotional,
  saveContentDocument,
  saveHomepage,
  type ContentActionResult,
} from "@/app/content-actions";
import type {
  ContentCategory,
  HomepageSettings,
  SiteContent,
  SiteDocument,
} from "@/lib/site-content";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]";

function localDateTimeValue(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function EditorModal({
  title,
  triggerLabel = "Edit",
  mode = "edit",
  children,
}: {
  title: string;
  triggerLabel?: string;
  mode?: "edit" | "create";
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {mode === "create" ? (
          <Plus className="size-3.5" />
        ) : (
          <Pencil className="size-3.5" />
        )}
        {triggerLabel}
      </button>
      <dialog
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-0 text-[var(--ink)] shadow-2xl backdrop:bg-[#102018]/70"
        ref={dialogRef}
      >
        <header className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
              Website editor
            </p>
            <h2 className="mt-1 text-xl font-semibold">{title}</h2>
          </div>
          <button
            aria-label="Close editor"
            className="rounded-lg border border-[var(--line)] p-2 hover:bg-[var(--canvas)]"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="max-h-[calc(90vh-5.25rem)] overflow-y-auto p-6">
          {children}
        </div>
      </dialog>
    </>
  );
}

function AddDevotionalEditor() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ContentActionResult | null>(null);
  function submit(formData: FormData) {
    startTransition(async () => {
      const response = await createDevotional(formData);
      setResult(response);
      if (response.ok) router.refresh();
    });
  }
  return (
    <EditorModal mode="create" title="Add devotional" triggerLabel="Add">
      <form action={submit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Title
          <input className={fieldClass} maxLength={100} name="title" required />
        </label>
        <label className="block text-sm font-semibold">
          URL slug{" "}
          <span className="font-normal text-[var(--muted)]">(optional)</span>
          <input
            className={fieldClass}
            maxLength={96}
            name="slug"
            placeholder="generated-from-the-title"
          />
        </label>
        <label className="block text-sm font-semibold">
          Short introduction
          <textarea
            className={fieldClass}
            maxLength={240}
            name="excerpt"
            required
            rows={3}
          />
        </label>
        <label className="block text-sm font-semibold">
          Publish date
          <input
            className={fieldClass}
            defaultValue={localDateTimeValue()}
            name="publishedAt"
            required
            type="datetime-local"
          />
        </label>
        <label className="block text-sm font-semibold">
          Scripture reference
          <input
            className={fieldClass}
            maxLength={80}
            name="scriptureReference"
            placeholder="Psalm 46:10"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Scripture passage
          <textarea
            className={fieldClass}
            name="scriptureText"
            required
            rows={5}
          />
        </label>
        <label className="block text-sm font-semibold">
          Reflection{" "}
          <span className="font-normal text-[var(--muted)]">
            Use ## for headings and &gt; for quotes.
          </span>
          <textarea
            className={`${fieldClass} font-mono leading-6`}
            name="bodyText"
            required
            rows={12}
          />
        </label>
        <label className="block text-sm font-semibold">
          Closing prayer
          <textarea className={fieldClass} name="prayer" rows={5} />
        </label>
        <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
          <SaveStatus result={result} />
          <button
            className="ml-auto rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish devotional"}
          </button>
        </div>
      </form>
    </EditorModal>
  );
}

function DeleteDevotionalButton({ document }: { document: SiteDocument }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function remove() {
    if (!window.confirm(`Delete “${document.title}”? This cannot be undone.`))
      return;
    startTransition(async () => {
      const response = await deleteDevotional(document._id);
      if (!response.ok) window.alert(response.message);
      else router.refresh();
    });
  }
  return (
    <button
      aria-label={`Delete ${document.title}`}
      className="rounded-lg border border-red-200 p-2 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      disabled={pending}
      onClick={remove}
      title="Delete devotional"
      type="button"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

function SaveStatus({ result }: { result: ContentActionResult | null }) {
  if (!result) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm font-medium ${result.ok ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"}`}
    >
      {result.message}
    </p>
  );
}

function HomepageEditor({ settings }: { settings: HomepageSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ContentActionResult | null>(null);
  function submit(formData: FormData) {
    startTransition(async () => {
      const response = await saveHomepage(formData);
      setResult(response);
      if (response.ok) router.refresh();
    });
  }
  return (
    <EditorModal title="Edit homepage" triggerLabel="Edit page">
      <form action={submit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Hero eyebrow
          <input
            className={fieldClass}
            defaultValue={settings.heroEyebrow}
            maxLength={80}
            name="heroEyebrow"
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Hero headline
            <input
              className={fieldClass}
              defaultValue={settings.heroHeadline}
              maxLength={80}
              name="heroHeadline"
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Hero accent
            <input
              className={fieldClass}
              defaultValue={settings.heroAccent}
              maxLength={80}
              name="heroAccent"
              required
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">
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
        <label className="block text-sm font-semibold">
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
        <label className="block text-sm font-semibold">
          About Robin and Laura
          <textarea
            className={fieldClass}
            defaultValue={settings.aboutRobinAndLaura}
            maxLength={600}
            name="aboutRobinAndLaura"
            required
            rows={4}
          />
        </label>
        <label className="block text-sm font-semibold">
          About the journal
          <textarea
            className={fieldClass}
            defaultValue={settings.aboutJournal}
            maxLength={600}
            name="aboutJournal"
            required
            rows={4}
          />
        </label>
        <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
          <SaveStatus result={result} />
          <button
            className="ml-auto rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save homepage"}
          </button>
        </div>
      </form>
    </EditorModal>
  );
}

function DocumentEditor({
  document,
  categories,
}: {
  document: SiteDocument;
  categories: ContentCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ContentActionResult | null>(null);
  function submit(formData: FormData) {
    startTransition(async () => {
      const response = await saveContentDocument(formData);
      setResult(response);
      if (response.ok) router.refresh();
    });
  }
  return (
    <EditorModal title={`Edit ${document.title}`}>
      <form action={submit} className="space-y-4">
        <input name="documentId" type="hidden" value={document._id} />
        <input name="documentType" type="hidden" value={document._type} />
        <label className="block text-sm font-semibold">
          Title
          <input
            className={fieldClass}
            defaultValue={document.title}
            maxLength={100}
            name="title"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Excerpt
          <textarea
            className={fieldClass}
            defaultValue={document.excerpt}
            maxLength={240}
            name="excerpt"
            required
            rows={3}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Publish date
            <input
              className={fieldClass}
              defaultValue={localDateTimeValue(document.publishedAt)}
              name="publishedAt"
              required
              type="datetime-local"
            />
          </label>
          {document._type !== "devotional" && (
            <label className="block text-sm font-semibold">
              Category
              <select
                className={fieldClass}
                defaultValue={document.categoryId}
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
          )}
        </div>
        {document._type !== "devotional" && (
          <label className="flex items-center gap-2 rounded-lg bg-[var(--brand-soft)] px-3 py-2.5 text-sm font-semibold">
            <input
              defaultChecked={document.featured}
              name="featured"
              type="checkbox"
            />{" "}
            Featured post
          </label>
        )}
        {document._type === "devotional" && (
          <>
            <label className="block text-sm font-semibold">
              Scripture reference
              <input
                className={fieldClass}
                defaultValue={document.scriptureReference}
                maxLength={80}
                name="scriptureReference"
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              Scripture passage
              <textarea
                className={fieldClass}
                defaultValue={document.scriptureText}
                name="scriptureText"
                required
                rows={5}
              />
            </label>
          </>
        )}
        <label className="block text-sm font-semibold">
          {document._type === "devotional" ? "Reflection" : "Post body"}
          <span className="ml-2 font-normal text-[var(--muted)]">
            Use ## for headings and &gt; for quotes.
          </span>
          <textarea
            className={`${fieldClass} font-mono leading-6`}
            defaultValue={document.bodyText}
            name="bodyText"
            required
            rows={12}
          />
        </label>
        {document._type === "devotional" && (
          <label className="block text-sm font-semibold">
            Closing prayer
            <textarea
              className={fieldClass}
              defaultValue={document.prayer}
              name="prayer"
              rows={5}
            />
          </label>
        )}
        <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
          <SaveStatus result={result} />
          <button
            className="ml-auto rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </EditorModal>
  );
}

function ContentGroup({
  title,
  icon: Icon,
  documents,
  categories,
  siteUrl,
  routeBase,
}: {
  title: string;
  icon: typeof FileText;
  documents: SiteDocument[];
  categories: ContentCategory[];
  siteUrl: string;
  routeBase: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[var(--brand-soft)] p-2 text-[var(--brand)]">
            <Icon className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-[var(--muted)]">
              {documents.length} published{" "}
              {documents.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {title === "Devotionals" && <AddDevotionalEditor />}
          <a
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]"
            href={`${siteUrl}${routeBase}`}
            rel="noreferrer"
            target="_blank"
          >
            View page <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {documents.length ? (
          documents.map((document) => {
            const href =
              document._type === "devotional"
                ? `${siteUrl}${routeBase}/${document.slug}`
                : `${siteUrl}${routeBase}/${document.categorySlug}/${document.slug}`;
            return (
              <div className="flex items-center gap-3 p-4" key={document._id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {document.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-[var(--muted)]">
                    {document.categoryTitle ?? document.scriptureReference} ·{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(document.publishedAt))}
                  </p>
                </div>
                <a
                  aria-label={`View ${document.title}`}
                  className="rounded-lg border border-[var(--line)] p-2 text-[var(--muted)] hover:text-[var(--brand)]"
                  href={href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ArrowUpRight className="size-3.5" />
                </a>
                <DocumentEditor categories={categories} document={document} />
                {document._type === "devotional" && (
                  <DeleteDevotionalButton document={document} />
                )}
              </div>
            );
          })
        ) : (
          <p className="p-5 text-sm text-[var(--muted)]">
            No entries have been published yet.
          </p>
        )}
      </div>
    </section>
  );
}

export function WebsiteContentManager({
  content,
  siteUrl,
}: {
  content: SiteContent;
  siteUrl: string;
}) {
  return (
    <section className="mb-8 scroll-mt-6" id="website-content">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[var(--brand)]">
            Website content
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Pages and posts
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Open the live site or edit its published copy without leaving the
            control panel.
          </p>
        </div>
        <a
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white"
          href={siteUrl}
          rel="noreferrer"
          target="_blank"
        >
          <Globe2 className="size-4" /> Open website
        </a>
      </div>
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[var(--brand-soft)] p-2 text-[var(--brand)]">
            <Globe2 className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Homepage</p>
            <p className="text-xs text-[var(--muted)]">
              Hero and About page copy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold"
            href={siteUrl}
            rel="noreferrer"
            target="_blank"
          >
            View <ArrowUpRight className="size-3.5" />
          </a>
          <HomepageEditor settings={content.homepage} />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ContentGroup
          categories={content.newsCategories}
          documents={content.posts}
          icon={FileText}
          routeBase="/news"
          siteUrl={siteUrl}
          title="News"
        />
        <ContentGroup
          categories={content.fieldNoteCategories}
          documents={content.fieldNotes}
          icon={MapPinned}
          routeBase="/field-notes"
          siteUrl={siteUrl}
          title="Field Notes"
        />
        <ContentGroup
          categories={[]}
          documents={content.devotionals}
          icon={BookHeart}
          routeBase="/devotionals"
          siteUrl={siteUrl}
          title="Devotionals"
        />
      </div>
    </section>
  );
}
