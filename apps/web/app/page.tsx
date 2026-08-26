import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  Heart,
  Lightbulb,
  Satellite,
  Signal,
  Sparkles,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ExpandableImage } from "@/components/expandable-image";
import { NewsMenu } from "@/components/news-menu";
import { AdminSiteEditor } from "@/components/admin-site-editor";
import { AdminSessionControls } from "@/components/admin-session-controls";
import { getAdminContext } from "@/lib/admin";
import { getSiteSettings } from "@/sanity/lib/data";
import { FieldNotesMenu } from "@/components/field-notes-menu";
import { NavbarAuth } from "@/components/navbar-auth";

const fieldNotes = [
  {
    eyebrow: "Real life",
    title: "Hope for people building forward",
    description:
      "Honest stories about faith, family, homelessness, starting over, and the practical steps that turn survival into stability.",
    icon: Heart,
  },
  {
    eyebrow: "Useful work",
    title: "Tools and services grounded in experience",
    description:
      "Affordable technology, creative work, research, organization, and business support designed around problems people actually face.",
    icon: BriefcaseBusiness,
  },
  {
    eyebrow: "Open horizons",
    title: "A wider life, shared as we build it",
    description:
      "Outdoor life, remote work, art, gardening, future travel, and the experiments that help family, purpose, and income fit together.",
    icon: Compass,
  },
];

export default async function Page() {
  const [settings, admin] = await Promise.all([
    getSiteSettings(),
    getAdminContext(),
  ]);
  return (
    <main className="overflow-hidden bg-[#f6f3eb] text-[#1e2a24]">
      <header className="absolute inset-x-0 top-0 z-50 bg-gradient-to-b from-[#0f1915]/85 via-[#0f1915]/45 to-transparent pb-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-4 px-6 py-5 sm:flex-nowrap sm:px-8 sm:py-6 lg:px-10">
          <a className="text-white" href="#top" aria-label="Blended Works home">
            <span className="block font-serif text-2xl font-semibold tracking-tight">
              Blended Works
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-white/70">
              Life, work &amp; possibility—blended
            </span>
          </a>
          <nav
            aria-label="Primary navigation"
            className="order-3 flex w-full items-center gap-7 border-t border-white/15 pt-4 text-sm font-semibold text-white/85 sm:order-none sm:w-auto sm:border-0 sm:pt-0"
          >
            <FieldNotesMenu />
            <Link
              className="hidden transition hover:text-white md:block"
              href="/services"
            >
              What we do
            </Link>
            <Link
              className="hidden transition hover:text-white lg:block"
              href="/about"
            >
              Our story
            </Link>
            <NewsMenu />
          </nav>
          {admin.isAdmin ? (
            <AdminSessionControls name={admin.displayName ?? "Administrator"} />
          ) : (
            <NavbarAuth
              enabled={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)}
              onHero
            />
          )}
        </div>
      </header>

      <section
        className="relative flex min-h-[720px] items-end pt-24 sm:pt-20 lg:min-h-screen lg:items-center lg:pt-14"
        id="top"
      >
        <Image
          alt="A remote campsite overlooking forested mountains with a laptop and satellite connection ready for work"
          className="object-cover object-[66%_center]"
          fill
          priority
          sizes="100vw"
          src="/images/remote-camp-hero.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,25,21,0.86)_0%,rgba(15,25,21,0.52)_46%,rgba(15,25,21,0.08)_78%),linear-gradient(0deg,rgba(15,25,21,0.66)_0%,transparent_48%)]" />
        <ExpandableImage
          alt="A remote campsite overlooking forested mountains with a laptop and satellite connection ready for work"
          className="absolute right-6 top-28 z-20 grid size-11 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-black/75 sm:right-8 sm:top-24 lg:right-10"
          iconOnly
          src="/images/remote-camp-hero.png"
        />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-8 sm:px-8 sm:pb-10 lg:px-10 lg:pb-12">
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.26em] text-[#f1be72]">
              <span className="h-px w-10 bg-[#f1be72]" />
              {settings.heroEyebrow}
            </p>
            <h1 className="break-words font-serif text-[clamp(2.25rem,8vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-white">
              {settings.heroHeadline}
              <br />
              <span className="italic text-[#f5d5a4]">
                {settings.heroAccent}
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              {settings.heroIntroduction}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f4b860] px-6 py-3.5 text-sm font-bold text-[#1e2a24] transition hover:bg-[#ffd08a]"
                href="/field-notes"
              >
                Explore Blended Works <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                href="/about"
              >
                Meet Robin &amp; Laura
              </Link>
              {admin.isAdmin && <AdminSiteEditor settings={settings} />}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#1e2a24]/10 bg-[#1e2a24] text-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-6 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          <InfoItem
            icon={Heart}
            title="Faith-rooted"
            detail="Values lived without pressure"
          />
          <InfoItem
            icon={Lightbulb}
            title="Experience-built"
            detail="Real problems, useful answers"
          />
          <InfoItem
            icon={BriefcaseBusiness}
            title="Opportunity-ready"
            detail="For families, founders, and teams"
          />
        </div>
      </section>

      <section className="px-6 py-24 sm:px-8 lg:px-10 lg:py-32" id="stories">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-b border-[#1e2a24]/15 pb-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
              One platform, many ways forward
            </p>
            <div>
              <h2 className="max-w-3xl font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
                Built from real life.{" "}
                <span className="italic text-[#6b786e]">
                  Made to be useful.
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-[1.0625rem] leading-8 text-[#59665f]">
                Blended Works is where our story, skills, faith, creativity,
                services, and future ventures meet. Everything starts with a
                real need and grows through learning, teaching, and building.
              </p>
            </div>
          </div>
          <div className="grid gap-7 pt-12 lg:grid-cols-3">
            {fieldNotes.map(
              ({ eyebrow, title, description, icon: Icon }, index) => (
                <article
                  className="group flex min-h-[420px] flex-col justify-between rounded-[2rem] border border-[#1e2a24]/10 bg-[#ebe7dc] p-8 transition hover:-translate-y-1 hover:bg-[#e4dfd2]"
                  key={title}
                >
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-[#1e2a24] p-3 text-[#f4b860]">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-serif text-sm text-[#7b857e]">
                      0{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">
                      {eyebrow}
                    </p>
                    <h3 className="font-serif text-3xl leading-tight">
                      {title}
                    </h3>
                    <p className="mt-5 text-[1.0625rem] leading-8 text-[#59665f]">
                      {description}
                    </p>
                    <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
                      See where this is growing{" "}
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        className="bg-[#dfe5dc] px-6 py-24 sm:px-8 lg:px-10 lg:py-32"
        id="connection"
      >
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#23372e] p-8 text-white sm:p-12">
            <div className="absolute -right-20 -top-20 size-72 rounded-full border border-white/10" />
            <div className="absolute -right-8 -top-8 size-44 rounded-full border border-white/10" />
            <Satellite className="size-14 text-[#f4b860]" strokeWidth={1.4} />
            <p className="mt-24 text-xs font-bold uppercase tracking-[0.22em] text-[#f4b860]">
              Our working connection
            </p>
            <p className="mt-4 max-w-md font-serif text-4xl leading-tight sm:text-5xl">
              A clear sky can be an office address.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
              Work from almost anywhere
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
              Remote work is only freeing when the connection works.
            </h2>
            <p className="mt-7 max-w-xl text-[1.0625rem] leading-8 text-[#526158] sm:text-lg">
              Starlink gives us dependable satellite internet far beyond the
              usual office. We&rsquo;ll share what the setup actually
              takes—clear views, power, weather, speeds, interruptions, and the
              small adjustments that keep a workday moving.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {[
                "Real-world connection notes",
                "Power and equipment details",
                "Location-by-location lessons",
                "No perfect-road mythology",
              ].map((item) => (
                <p
                  className="flex items-center gap-3 text-sm font-bold"
                  key={item}
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#1e2a24] text-[#f4b860]">
                    <Sparkles className="size-3" />
                  </span>
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="bg-[#1e2a24] px-6 py-24 text-white sm:px-8 lg:px-10 lg:py-32"
        id="rig"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-b border-white/15 pb-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f4b860]">
              The ideal vehicle package
            </p>
            <div>
              <h2 className="max-w-4xl font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
                One built to roam.{" "}
                <span className="italic text-[#b9c6bd]">
                  One built to haul.
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-[1.0625rem] leading-8 text-white/65">
                Our dream setup combines a capable exploration vehicle, a
                dependable diesel workhorse—giving us the flexibility to reach
                farther without asking one vehicle to do everything. A fully
                equipped fifth wheel completes the package as our comfortable
                work-from-anywhere home base.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-7 xl:grid-cols-3">
            <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8 sm:p-10">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#f4b860] p-3 text-[#1e2a24]">
                  <Compass className="size-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Explore
                </span>
              </div>
              <ExpandableImage
                className="mt-8 aspect-[3/2] rounded-2xl bg-black/20"
                alt="Original editorial illustration of an expedition-ready off-road SUV on a mountain trail"
                imageClassName="object-cover transition duration-500 group-hover/media:scale-[1.02]"
                sizes="(min-width: 1024px) 50vw, 100vw"
                src="/images/land-cruiser-editorial.png"
              />
              <p className="mt-8 text-sm font-bold text-[#f4b860]">
                Toyota Land Cruiser
              </p>
              <h3 className="mt-3 font-serif text-4xl">The trail vehicle.</h3>
              <p className="mt-4 max-w-lg leading-7 text-white/60">
                The vehicle for day trips, rough roads, trailheads, and
                discovering the places where a larger tow rig is better left at
                camp.
              </p>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8 sm:p-10">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#f4b860] p-3 text-[#1e2a24]">
                  <Truck className="size-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Tow
                </span>
              </div>
              <ExpandableImage
                className="mt-8 aspect-[3/2] rounded-2xl bg-black/20"
                alt="Original editorial illustration of a heavy-duty diesel tow rig and travel trailer in the mountains"
                imageClassName="object-cover transition duration-500 group-hover/media:scale-[1.02]"
                sizes="(min-width: 1024px) 50vw, 100vw"
                src="/images/duramax-tow-rig-editorial.png"
              />
              <p className="mt-8 text-sm font-bold text-[#f4b860]">
                Chevrolet Silverado 3500HD Duramax
              </p>
              <h3 className="mt-3 font-serif text-4xl">
                The diesel workhorse.
              </h3>
              <p className="mt-4 max-w-lg leading-7 text-white/60">
                The heavy-duty foundation for towing, carrying gear, and moving
                the complete remote-work camp confidently between destinations.
              </p>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8 sm:p-10">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#f4b860] p-3 text-[#1e2a24]">
                  <Sparkles className="size-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Live + work
                </span>
              </div>
              <ExpandableImage
                className="mt-8 aspect-[3/2] rounded-2xl bg-black/20"
                alt="Original editorial illustration of a fully equipped premium fifth-wheel trailer at a mountain campsite"
                imageClassName="object-cover transition duration-500 group-hover/media:scale-[1.02]"
                sizes="(min-width: 1280px) 33vw, 100vw"
                src="/images/premium-fifth-wheel-editorial.png"
              />
              <p className="mt-8 text-sm font-bold text-[#f4b860]">
                Brinkley Model Z&ndash;inspired fifth wheel
              </p>
              <h3 className="mt-3 font-serif text-4xl">The home base.</h3>
              <p className="mt-4 max-w-lg leading-7 text-white/60">
                A premium, all-season trailer with all the bells and whistles:
                residential comfort, dedicated work space, abundant storage,
                solar power, and connectivity built for longer stays.
              </p>
            </article>
          </div>

          <p className="mt-8 text-sm italic text-white/45">
            This is the setup we&rsquo;re working toward—not a claim about what
            is already in the driveway. Vehicle artwork is an original,
            unofficial editorial representation; Blended Works is not affiliated
            with or endorsed by Toyota, Chevrolet, or Brinkley RV.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-8 lg:px-10 lg:py-32" id="about">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#a45d2d]">
            Robin + Laura™
          </p>
          <div>
            <p className="font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
              {settings.aboutHeadline}
            </p>
            <div className="mt-10 grid gap-10 border-t border-[#1e2a24]/15 pt-10 md:grid-cols-2">
              <p className="text-[1.0625rem] leading-8 text-[#59665f]">
                {settings.aboutRobinAndLaura}
              </p>
              <p className="text-[1.0625rem] leading-8 text-[#59665f]">
                {settings.aboutJournal}
              </p>
            </div>
            <Link
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#a45d2d]"
              href="/about"
            >
              Read our full story <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-4 sm:px-8 sm:pb-8" id="follow">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#c8703d] px-7 py-20 text-center text-white sm:rounded-[2.5rem] sm:px-12 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">
            There is room at the table
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">
            Come build what comes next with us.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[1.0625rem] leading-8 text-white/85">
            Read the story, follow the journey, explore useful tools, or bring
            us a problem worth solving. Blended Works is growing one honest
            connection at a time.
          </p>
          <a
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#873f21] transition hover:bg-[#fff1df]"
            href="mailto:hello@blendedworks.com?subject=Follow%20Blended%20Works"
          >
            Say hello <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      <footer className="px-6 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#657169] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-lg font-semibold text-[#1e2a24]">
            Blended Works
          </p>
          <p>
            Built with faith, family, and practical purpose by Robin + Laura™.
          </p>
          <a className="font-bold text-[#1e2a24]" href="#top">
            Back to the top ↑
          </a>
        </div>
      </footer>
    </main>
  );
}

function InfoItem({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Signal;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-5 py-7 md:px-7 first:md:pl-0">
      <Icon className="size-5 text-[#f4b860]" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-sm leading-5 text-white/60">{detail}</p>
      </div>
    </div>
  );
}
