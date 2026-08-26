import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Heart,
  Palette,
  Sprout,
} from "lucide-react";
import { NewsHeader } from "@/components/news-header";
import { getSiteSettings } from "@/sanity/lib/data";

export const metadata: Metadata = {
  title: "About Robin + Laura™ | Blended Works",
  description:
    "Meet Robin + Laura™, the engaged partners and blended family behind Blended Works, and learn how faith, resilience, creativity, and practical experience shape their work.",
};

const sharedValues = [
  {
    icon: Heart,
    title: "Faith expressed through practice",
    copy: "Our beliefs show up in integrity, compassion, fairness, and service. We welcome people without pressure and let the quality of our choices speak clearly.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Work that supports life",
    copy: "We believe living a happy life and doing meaningful work should be equally fulfilling. Family needs shape our roles, and major decisions remain shared.",
  },
  {
    icon: Sprout,
    title: "Learning that becomes teaching",
    copy: "We build from lived experience, keep learning, and turn what works into affordable knowledge, tools, and services that can help someone else move forward.",
  },
];

function paragraphs(value: string) {
  return value.split(/\n\s*\n/).filter(Boolean);
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  return (
    <div className="min-h-screen bg-[#f6f3eb] text-[#1e2a24]">
      <NewsHeader />
      <main>
        <section className="border-b border-[#1e2a24]/10 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
                {settings.aboutPageEyebrow}
              </p>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#657169]">
                An engaged couple, blended family, and growing business based in
                Washington State.
              </p>
            </div>
            <div>
              <h1 className="max-w-5xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
                {settings.aboutPageHeadline}
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#59665f]">
                {settings.aboutPageIntroduction}
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
            <article className="rounded-[2rem] bg-[#1e2a24] p-8 text-white sm:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f4b860]">
                Robin
              </p>
              <h2 className="mt-5 font-serif text-4xl sm:text-5xl">
                {settings.robinHeadline}
              </h2>
              <div className="mt-7 space-y-5 text-[1.0625rem] leading-8 text-white/70">
                {paragraphs(settings.robinBio).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] bg-[#dfe5dc] p-8 sm:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">
                Laura
              </p>
              <h2 className="mt-5 font-serif text-4xl sm:text-5xl">
                {settings.lauraHeadline}
              </h2>
              <div className="mt-7 space-y-5 text-[1.0625rem] leading-8 text-[#526158]">
                {paragraphs(settings.lauraBio).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="bg-[#ebe7dc] px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
                  Our beginning
                </p>
                <Palette
                  className="mt-8 size-14 text-[#a45d2d]"
                  strokeWidth={1.4}
                />
              </div>
              <div className="space-y-6 text-[1.0625rem] leading-8 text-[#59665f]">
                <h2 className="font-serif text-4xl leading-tight text-[#1e2a24] sm:text-6xl">
                  {settings.storyHeadline}
                </h2>
                {paragraphs(settings.storyBody).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
              What safeguards the work
            </p>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl leading-tight sm:text-6xl">
              {settings.valuesHeadline}
            </h2>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {sharedValues.map(({ icon: Icon, title, copy }) => (
                <article
                  className="rounded-3xl border border-[#1e2a24]/10 p-7"
                  key={title}
                >
                  <Icon className="size-7 text-[#a45d2d]" />
                  <h3 className="mt-8 font-serif text-3xl">{title}</h3>
                  <p className="mt-4 leading-7 text-[#59665f]">{copy}</p>
                </article>
              ))}
            </div>
            <blockquote className="mt-10 border-l-4 border-[#c8703d] pl-6 text-lg leading-8 text-[#59665f]">
              {settings.trustPromise}
            </blockquote>
          </div>
        </section>

        <section className="px-4 pb-4 sm:px-8 sm:pb-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#c8703d] px-7 py-16 text-center text-white sm:rounded-[2.5rem] sm:px-12 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">
              Welcome to the family
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">
              Start with the story. Stay for what we build next.
            </h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#873f21]"
                href="/field-notes"
              >
                Read our field notes <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-sm font-bold text-white"
                href="/services"
              >
                Explore what we do <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
