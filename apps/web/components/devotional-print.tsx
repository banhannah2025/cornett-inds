"use client";

import { useState } from "react";

type Devotional = {
  title: string;
  publishedAt?: string;
  scriptureText?: string;
  body?: Array<{ _type?: string; children?: Array<{ text?: string }> }>;
  prayer?: string;
};

const splitScriptures = (text: string) =>
  text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);

export function DevotionalPrint({ devotional }: { devotional: Devotional }) {
  const [preview, setPreview] = useState(false);
  const scriptures = splitScriptures(devotional.scriptureText ?? "");
  const paragraphs = (devotional.body ?? [])
    .filter((block) => block._type === "block")
    .map((block) => (block.children ?? []).map((span) => span.text ?? "").join(""))
    .filter(Boolean);
  const isScripture = (text: string) =>
    /^(James 1:19|Proverbs 29:22|Galatians 5:22)/i.test(text) ||
    /^["“](An Angry man|But the fruit)/.test(text);

  return (
    <>
      <div className="devotional-print-controls">
        <button type="button" onClick={() => setPreview((value) => !value)}>
          {preview ? "Close print preview" : "Print preview"}
        </button>
        <button type="button" onClick={() => window.print()}>Print devotional</button>
      </div>
      <article className={`devotional-print-sheet ${preview ? "preview" : ""}`}>
        <header>
          <p className="eyebrow">BLENDED WORKS · DAILY DEVOTIONAL</p>
          <h1>{devotional.title}</h1>
          {devotional.publishedAt && <p className="date">{new Date(devotional.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>}
        </header>
        {scriptures[0] && <aside className="scripture primary"><strong>PRIMARY SCRIPTURE</strong><p>{scriptures[0]}</p></aside>}
        <section className="devotional-copy">
          {paragraphs.map((paragraph, index) => (
            isScripture(paragraph)
              ? <aside className="scripture" key={index}><p>{paragraph}</p></aside>
              : <p key={index}>{paragraph}</p>
          ))}
        </section>
        <section className="prayer"><h2>Closing Prayer</h2>{(devotional.prayer ?? "").split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</section>
      </article>
      <style jsx>{`
        .devotional-print-controls { display:flex; gap:12px; flex-wrap:wrap; margin:16px 0; }
        .devotional-print-controls button { border:1px solid #444; border-radius:6px; padding:10px 16px; cursor:pointer; background:white; color:#111; }
        .devotional-print-sheet { display:none; max-width:8.5in; padding:.7in; margin:12px auto; background:white; color:#151515; font:13pt/1.48 Georgia,"Times New Roman",serif; }
        .devotional-print-sheet.preview { display:block; box-shadow:0 2px 20px #0002; }
        .devotional-print-sheet h1 { font-size:23pt; line-height:1.15; margin:8px 0; }
        .devotional-print-sheet .eyebrow { font: bold 9pt Arial,sans-serif; letter-spacing:.12em; margin:0; }
        .devotional-print-sheet .date { font:10pt Arial,sans-serif; color:#555; margin:0 0 16px; }
        .devotional-print-sheet p { margin:0 0 12px; orphans:3; widows:3; }
        .devotional-print-sheet .scripture { border:1.5px solid #444; border-left:4px solid #444; padding:12px 16px; margin:16px 0; break-inside:avoid; font-size:12pt; background:#fafafa; }
        .devotional-print-sheet .scripture strong { display:block; font: bold 9pt Arial,sans-serif; margin-bottom:6px; }
        .devotional-print-sheet .scripture p { margin:0; }
        .devotional-print-sheet .prayer { border-top:2px solid #333; padding-top:12px; margin-top:22px; break-before:auto; }
        .devotional-print-sheet h2 { font-size:16pt; margin:0 0 12px; break-after:avoid; }
        @page { size:letter; margin:.65in; }
        @media print {
          body { background:white !important; }
          body * { visibility:hidden !important; }
          .devotional-print-sheet, .devotional-print-sheet * { visibility:visible !important; }
          .devotional-print-sheet { display:block !important; position:absolute; inset:0 auto auto 0; width:100%; max-width:none; padding:0; margin:0; box-shadow:none; font-size:12pt; }
          .devotional-print-controls { display:none !important; }
          .devotional-print-sheet .scripture { background:white; }
        }
      `}</style>
    </>
  );
}
