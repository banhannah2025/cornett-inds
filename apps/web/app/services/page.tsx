import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Code2,
  Compass,
  FileSearch,
  Hammer,
  Palette,
  Workflow,
} from "lucide-react";
import { NewsHeader } from "@/components/news-header";
import { getSiteSettings } from "@/sanity/lib/data";

export const metadata: Metadata = {
  title: "Services & Future Tools | Blended Works",
  description:
    "Explore the practical, affordable services and future tools Blended Works is developing for families, founders, businesses, and community organizations.",
};

const services = [
  {
    icon: Code2,
    title: "Web and app development",
    copy: "Websites, useful web applications, technical planning, and digital products shaped around a real operational need.",
  },
  {
    icon: Workflow,
    title: "Business and operations",
    copy: "Planning, workflows, organization, documentation, and practical systems for small businesses, startups, and growing teams.",
  },
  {
    icon: Palette,
    title: "Design and digital content",
    copy: "Visual direction, interface design, written content, educational material, and creative support that keeps communication human.",
  },
  {
    icon: Calculator,
    title: "Accounting and organization",
    copy: "Bookkeeping-oriented support, time and space organization, record systems, and practical household or business structure.",
  },
  {
    icon: Hammer,
    title: "Construction and technical consulting",
    copy: "Experience-informed planning around residential construction, trades, equipment, field operations, and build feasibility.",
  },
  {
    icon: FileSearch,
    title: "Research and document support",
    copy: "Careful research, document organization, and general legal-information tools—with clear limits where licensed professional advice is required.",
  },
];

export default async function ServicesPage() {
  const settings = await getSiteSettings();
  return (
    <div className="min-h-screen bg-[#f6f3eb] text-[#1e2a24]">
      <NewsHeader />
      <main>
        <section className="border-b border-[#1e2a24]/10 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
                What we do
              </p>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#657169]">
                A growing, multidisciplinary practice built around useful
                work—not artificial limits.
              </p>
            </div>
            <div>
              <h1 className="max-w-5xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
                {settings.servicesHeadline}
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#59665f]">
                {settings.servicesIntroduction}
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
              Current service directions
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map(({ icon: Icon, title, copy }) => (
                <article
                  className="flex min-h-80 flex-col justify-between rounded-[2rem] border border-[#1e2a24]/10 bg-[#ebe7dc] p-8"
                  key={title}
                >
                  <Icon className="size-8 text-[#a45d2d]" strokeWidth={1.5} />
                  <div>
                    <h2 className="font-serif text-3xl">{title}</h2>
                    <p className="mt-4 leading-7 text-[#59665f]">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-4xl text-sm leading-7 text-[#657169]">
              These are service directions, not a claim that every offering is
              already packaged or available in every location. Scope,
              credentials, pricing, and any required licensed-professional
              involvement are confirmed before work begins.
            </p>
          </div>
        </section>

        <section className="bg-[#1e2a24] px-6 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Compass className="size-14 text-[#f4b860]" strokeWidth={1.4} />
              <p className="mt-10 text-xs font-bold uppercase tracking-[0.24em] text-[#f4b860]">
                The product horizon
              </p>
              <h2 className="mt-5 font-serif text-4xl leading-tight sm:text-6xl">
                Apps that grow from the life we are actually living.
              </h2>
            </div>
            <div className="space-y-6 text-[1.0625rem] leading-8 text-white/65">
              <p>
                Our planned tools span business and contractor workflows,
                general legal research and self-help, faith and devotionals,
                travel and outdoor life, and family or household organization.
              </p>
              <p>
                The standard is consistent: solve a genuine problem, stay
                affordable and accessible, save time or money, reflect our
                values, and come from experience we can explain honestly.
              </p>
              <p>
                Access may eventually blend free resources, one-time purchases,
                optional subscriptions, paid services, sponsored access, and
                selective sliding-scale support.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
              Who we hope to serve
            </p>
            <div>
              <h2 className="font-serif text-4xl leading-tight sm:text-6xl">
                Families rebuilding. Founders beginning. Organizations trying to
                do good work well.
              </h2>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#59665f]">
                Faith-based companies and clients are a natural fit, but our
                door is not limited to one community. We welcome respectful
                people and organizations whose goals and practices align with
                ethical, moral, and responsible work.
              </p>
              <a
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1e2a24] px-6 py-3.5 text-sm font-bold text-white"
                href="mailto:hello@blendedworks.com?subject=Working%20with%20Blended%20Works"
              >
                Start a conversation <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="px-4 pb-4 sm:px-8 sm:pb-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#c8703d] px-7 py-16 text-center text-white sm:rounded-[2.5rem] sm:px-12 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">
              Still taking shape
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">
              Follow the work as the portfolio grows.
            </h2>
            <Link
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#873f21]"
              href="/field-notes"
            >
              Read the journey <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
