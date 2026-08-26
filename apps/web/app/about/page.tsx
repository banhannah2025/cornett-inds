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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f6f3eb] text-[#1e2a24]">
      <NewsHeader />
      <main>
        <section className="border-b border-[#1e2a24]/10 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
                Robin + Laura™ · Partners
              </p>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#657169]">
                An engaged couple, blended family, and growing business based in
                Washington State.
              </p>
            </div>
            <div>
              <h1 className="max-w-5xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
                We learned to build because life kept asking us to begin again.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#59665f]">
                Blended Works brings together our family, faith, skills,
                creativity, and determination to make the next chapter more
                useful—not only for us, but for people and businesses building
                forward too.
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
                Builder by necessity. Creator by nature.
              </h2>
              <div className="mt-7 space-y-5 text-[1.0625rem] leading-8 text-white/70">
                <p>
                  Robin grew up taking on adult responsibilities early. Working,
                  helping manage a household, and learning trades became the
                  beginning of an unusually broad practical education.
                </p>
                <p>
                  He holds an associate degree in international business and a
                  bachelor&rsquo;s degree in legal studies. His experience spans
                  construction, general contracting, security and private law
                  enforcement, retail, manufacturing, landscaping, sales,
                  accounting, management, legal research, programming, and
                  design. He also holds Coast Guard watercraft licensing and
                  universal EPA technician certification.
                </p>
                <p>
                  Robin leads technology, design, and product creation. He is
                  most at home painting, building, solving difficult problems,
                  or exploring outdoors—but fatherhood, partnership, and family
                  remain his first priorities.
                </p>
              </div>
            </article>

            <article className="rounded-[2rem] bg-[#dfe5dc] p-8 sm:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">
                Laura
              </p>
              <h2 className="mt-5 font-serif text-4xl sm:text-5xl">
                The order, warmth, and steady rhythm behind the work.
              </h2>
              <div className="mt-7 space-y-5 text-[1.0625rem] leading-8 text-[#526158]">
                <p>
                  Laura is passionate, loving, funny, and deeply committed to
                  family. Her experience reaches across accounting, business,
                  administration, customer service, hospitality, caregiving, and
                  the daily systems that keep a household moving.
                </p>
                <p>
                  She has a gift for numbers, organization, time management, and
                  making better use of limited space and resources. As the
                  primary at-home parent, she balances family life with
                  part-time work and the growing responsibilities of Blended
                  Works.
                </p>
                <p>
                  Laura leads finance, organization, and operational order. She
                  also draws and paints, loves gardening, and brings both
                  compassion and practical clarity to the plans the couple
                  builds together.
                </p>
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
                  Two difficult seasons became one shared direction.
                </h2>
                <p>
                  Robin once stayed at the homeless mission where he now works
                  in security. Laura later arrived there during a difficult
                  chapter of her own. Their connection was immediate, but the
                  mission did not permit relationships between staff and guests,
                  so Laura stopped using its services before their relationship
                  moved forward.
                </p>
                <p>
                  They chose to start over together: combining two families,
                  working toward stable housing, preparing for marriage, and
                  building a business capable of supporting a close-knit family.
                  Their household includes four children from prior
                  relationships; protecting the children&rsquo;s privacy remains
                  important.
                </p>
                <p>
                  Camping, fishing, stargazing, dancing, laughing, painting,
                  gardening, dreaming, and planning are part of how they stay
                  connected. Blended Works grew from that same instinct: take
                  different lives, talents, and opportunities and cultivate
                  something stronger together.
                </p>
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
              Trust should feel personal—and be supported by excellent practice.
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
