import {
  ArrowRight,
  BookHeart,
  BookOpenText,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Church,
  Feather,
  FolderOpen,
  HeartHandshake,
  Menu,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

type Plan = {
  name: string;
  price: string;
  cadence?: string;
  credits: string;
  description: string;
  features: string[];
  featured?: boolean;
  badge?: string;
};

const personalPlans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    credits: "50 AI credits / month",
    description: "A welcoming place to ask, explore, and reflect.",
    features: ["Conversational Bible", "Faith-based guidance", "30-day conversation history", "Basic Bible translations"],
  },
  {
    name: "Plus",
    price: "$9.99",
    cadence: "per month",
    credits: "500 AI credits / month",
    description: "For a growing rhythm of study, writing, and prayer.",
    features: ["Everything in Free", "Religious writing and drafting", "Project folders", "Personalized studies", "20 deep-study uses"],
    featured: true,
    badge: "Best place to begin",
  },
  {
    name: "Premium",
    price: "$19.99",
    cadence: "per month",
    credits: "1,500 AI credits / month",
    description: "For deeper, more frequent study and long-form work.",
    features: ["Everything in Plus", "Advanced writing tools", "Expanded voice access", "100 deep-study uses", "Long-term conversation history"],
  },
  {
    name: "Family",
    price: "$29.99",
    cadence: "per month",
    credits: "3,000 shared credits / month",
    description: "Private faith journeys, together under one plan.",
    features: ["Up to 6 private profiles", "Shared subscription", "Individual project folders", "Family study tools", "150 pooled deep-study uses"],
  },
];

const ministryPlans: Plan[] = [
  {
    name: "Clergy Individual",
    price: "$9.99",
    cadence: "per month",
    credits: "1,000 AI credits / month",
    description: "Verified access for pastors, chaplains, and ministry workers.",
    features: ["All Plus features", "Enhanced AI model access", "Sermon and lesson drafting", "Testimonial drafting", "Private project folders"],
  },
  {
    name: "Ministry Starter",
    price: "$19.99",
    cadence: "per month",
    credits: "3,000 pooled credits / month",
    description: "A shared workspace for a small ministry team.",
    features: ["3 team seats", "All writing tools", "Shared ministry projects", "Enhanced model access", "Role-based workspaces"],
    featured: true,
    badge: "Verified nonprofit pricing",
  },
  {
    name: "Ministry Plus",
    price: "$29.99",
    cadence: "per month",
    credits: "10,000 pooled credits / month",
    description: "More room for established churches and nonprofit teams.",
    features: ["10 team seats", "All available features", "Better AI model", "Testimonial drafting", "Team project folders"],
  },
];

const businessPlans: Plan[] = [
  {
    name: "Business Solo",
    price: "$19.99",
    cadence: "per month",
    credits: "1,500 AI credits / month",
    description: "For independent faith-based professionals and creators.",
    features: ["All writing features", "Enhanced AI model", "Testimonial drafting", "Project folders", "Commercial use"],
  },
  {
    name: "Business Team",
    price: "$49.99",
    cadence: "per month",
    credits: "5,000 pooled credits / month",
    description: "A focused workspace for a growing organization.",
    features: ["5 team seats", "Shared project folders", "Team administration", "Better AI model", "Commercial use"],
    featured: true,
    badge: "For growing teams",
  },
  {
    name: "Business Pro",
    price: "$99.99",
    cadence: "per month",
    credits: "15,000 pooled credits / month",
    description: "Higher capacity for professional faith-based teams.",
    features: ["15 team seats", "All available features", "Priority model access", "Advanced organization", "Higher usage limits"],
  },
];

const features = [
  { icon: BookOpenText, title: "Conversational Bible", text: "Ask questions, compare passages, and explore Scripture in clear, approachable conversation." },
  { icon: MessageCircleHeart, title: "Faith-based guidance", text: "A compassionate space for biblical reflection that supports—not replaces—trusted human care." },
  { icon: Feather, title: "Religious writing", text: "Draft devotionals, sermons, prayers, studies, testimonies, and ministry materials with guided AI." },
  { icon: FolderOpen, title: "Project folders", text: "Keep studies, sermon series, writing, and ministry work organized in dedicated spaces." },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className={`relative flex h-full flex-col rounded-[28px] border p-6 ${plan.featured ? "border-[#b98a44] bg-[#214c41] text-white shadow-[0_24px_70px_rgba(21,55,47,.20)]" : "border-[var(--line)] bg-white/75 shadow-[0_16px_50px_rgba(33,76,65,.06)]"}`}>
      {plan.badge && <span className={`mb-5 w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] ${plan.featured ? "bg-[#eeddb6] text-[#214c41]" : "bg-[#e7eee9] text-[#315f52]"}`}>{plan.badge}</span>}
      <h3 className="bible-serif text-2xl font-bold">{plan.name}</h3>
      <div className="mt-4 flex items-end gap-2"><span className="bible-serif text-4xl font-bold">{plan.price}</span><span className={`pb-1 text-xs ${plan.featured ? "text-white/65" : "text-[#65766f]"}`}>{plan.cadence}</span></div>
      <p className={`mt-4 min-h-12 text-sm leading-6 ${plan.featured ? "text-white/75" : "text-[#5f7069]"}`}>{plan.description}</p>
      <div className={`my-5 rounded-2xl px-4 py-3 text-sm font-bold ${plan.featured ? "bg-white/10 text-[#f2dfb8]" : "bg-[#edf2ee] text-[#315f52]"}`}>{plan.credits}</div>
      <ul className="mb-7 flex-1 space-y-3">
        {plan.features.map((feature) => <li key={feature} className={`flex gap-3 text-sm leading-5 ${plan.featured ? "text-white/85" : "text-[#465b53]"}`}><Check className={`mt-0.5 shrink-0 ${plan.featured ? "text-[#e7c988]" : "text-[#56806f]"}`} size={16}/>{feature}</li>)}
      </ul>
      <a href="#early-access" className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${plan.featured ? "bg-[#eeddb6] text-[#214c41]" : "bg-[#214c41] text-white"}`}>Choose {plan.name}<ChevronRight size={16}/></a>
    </article>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <header className="border-b border-[var(--line)] bg-[#f9f6ef]/85 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1420px] items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[var(--forest)] text-[#f4ddb0] shadow-lg"><BookHeart size={23}/></span>
            <span><strong className="bible-serif block text-xl leading-none">BlendedWorks AI Bible</strong><small className="mt-1 block text-[10px] font-bold uppercase tracking-[.2em] text-[#7d6d54]">Scripture • Guidance • Creation</small></span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4d625a] md:flex"><a href="#features">Features</a><a href="#models">Our AI</a><a href="#pricing">Pricing</a><a href="#safety">Our promise</a></nav>
          <a href="#pricing" className="hidden rounded-xl bg-[var(--forest)] px-5 py-2.5 text-sm font-bold text-white sm:block">View plans</a>
          <Menu className="sm:hidden" aria-label="Menu"/>
        </div>
      </header>

      <section id="top" className="relative px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-10">
        <div className="mx-auto grid max-w-[1420px] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-[#cdb78d] bg-[#fffaf0] px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-[#805f2d]"><Sparkles size={15}/>Thoughtful technology. Timeless truth.</div>
            <h1 className="bible-serif text-balance text-5xl font-bold leading-[1.02] tracking-[-.035em] sm:text-6xl lg:text-7xl">Bring your questions.<br/><span className="text-[#9b6d2f]">Open the Word.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#536861]">A Scripture-centered AI companion for conversation, faith-based guidance, religious writing, and organized ministry work—made for individuals, families, churches, clergy, and faith-led organizations.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="#pricing" className="flex items-center justify-center gap-2 rounded-xl bg-[var(--forest)] px-6 py-3.5 font-bold text-white shadow-[0_14px_35px_rgba(33,76,65,.20)]">Explore the plans<ArrowRight size={18}/></a><a href="#features" className="flex items-center justify-center rounded-xl border border-[var(--line)] bg-white/70 px-6 py-3.5 font-bold text-[#31584d]">See what it can do</a></div>
            <p className="mt-5 text-xs leading-5 text-[#718078]">Web app launching first • Android app planned next • AI guidance is not professional counseling or emergency care</p>
          </div>
          <div className="relative mx-auto w-full max-w-[600px]">
            <div className="absolute -inset-5 rotate-2 rounded-[42px] bg-[#d9c59d]/30"/>
            <div className="paper-noise relative overflow-hidden rounded-[36px] border border-[#d7c8aa] bg-[#fffdf8] p-6 shadow-[0_35px_90px_rgba(53,67,58,.16)] sm:p-9">
              <div className="flex items-center justify-between border-b border-[#dfd3bc] pb-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#e8efe9] text-[#376556]"><Bot size={20}/></span><div><p className="font-bold">Scripture conversation</p><p className="text-xs text-[#7a877f]">Grounded, thoughtful, and clear</p></div></div><span className="size-2.5 rounded-full bg-[#70a785]"/></div>
              <div className="mt-7 rounded-2xl bg-[#f1ece2] p-4 text-sm leading-6 text-[#4c5d57]">How can Psalm 23 speak to someone rebuilding their life after a difficult season?</div>
              <div className="mt-4 border-l-2 border-[#c49145] pl-5"><p className="bible-serif text-lg font-bold text-[#274b40]">“He restoreth my soul...”</p><p className="mt-3 text-sm leading-7 text-[#596b64]">Psalm 23 does not pretend the valley is easy. It shows us a Shepherd who remains present through it—and who keeps leading us forward...</p><button className="mt-4 flex items-center gap-2 text-xs font-bold text-[#926628]">Continue exploring <ArrowRight size={14}/></button></div>
              <div className="mt-8 grid grid-cols-3 gap-2 border-t border-[#dfd3bc] pt-5 text-center text-[11px] font-bold text-[#66776f]"><span>Compare passages</span><span>Save to project</span><span>Begin a study</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[var(--deep-forest)] px-4 py-20 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1420px]"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#e3bf7b]">One companion, many faithful uses</p><h2 className="bible-serif mt-3 text-balance text-4xl font-bold sm:text-5xl">Study personally. Create purposefully. Serve more clearly.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{features.map(({icon:Icon,title,text})=><article key={title} className="rounded-[26px] border border-white/10 bg-white/[.06] p-6"><Icon className="text-[#e4c481]" size={27}/><h3 className="bible-serif mt-6 text-2xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-white/65">{text}</p></article>)}</div></div>
      </section>

      <section id="models" className="px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1420px] gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9a6b2e]">The right model for the moment</p><h2 className="bible-serif mt-3 text-4xl font-bold sm:text-5xl">Helpful AI without making every conversation expensive.</h2><p className="mt-5 leading-7 text-[#5d7068]">Each plan pairs its work with an appropriate OpenAI model. Everyday conversations stay fast and affordable, while eligible paid and organizational work can step up to stronger reasoning when depth matters.</p></div><div className="grid gap-4 sm:grid-cols-3"><article className="rounded-[24px] border border-[var(--line)] bg-white/70 p-6"><span className="text-xs font-bold uppercase tracking-wider text-[#75867e]">Everyday</span><h3 className="bible-serif mt-3 text-2xl font-bold">GPT-5.6 Luna</h3><p className="mt-3 text-sm leading-6 text-[#60736a]">Conversation, Scripture questions, reflection, and most writing assistance.</p></article><article className="rounded-[24px] border border-[#c6a66f] bg-[#fff9ed] p-6"><span className="text-xs font-bold uppercase tracking-wider text-[#93662b]">Deep study</span><h3 className="bible-serif mt-3 text-2xl font-bold">GPT-5.6 Terra</h3><p className="mt-3 text-sm leading-6 text-[#60736a]">Complex studies, long-form drafting, ministry materials, and deeper analysis.</p></article><article className="rounded-[24px] border border-[var(--line)] bg-white/70 p-6"><span className="text-xs font-bold uppercase tracking-wider text-[#75867e]">Special work</span><h3 className="bible-serif mt-3 text-2xl font-bold">Advanced access</h3><p className="mt-3 text-sm leading-6 text-[#60736a]">Reserved model escalation for qualifying high-complexity organizational work.</p></article></div></div>
      </section>

      <section id="pricing" className="border-y border-[var(--line)] bg-[#eee7d9]/70 px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1420px]"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#91662d]">Plans that grow with your purpose</p><h2 className="bible-serif mt-3 text-balance text-4xl font-bold sm:text-5xl">Begin freely. Go deeper when you are ready.</h2><p className="mt-5 leading-7 text-[#5e7069]">Credits measure AI-assisted actions, not access to your saved work. Plans and limits shown here are our launch model and may be refined before paid enrollment opens.</p></div>
          <div className="mt-14 flex items-center gap-3"><Users className="text-[#976a30]"/><div><h3 className="bible-serif text-3xl font-bold">Personal & family</h3><p className="text-sm text-[#687971]">Private spaces for personal faith, writing, and shared family access.</p></div></div><div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{personalPlans.map(plan=><PlanCard key={plan.name} plan={plan}/>)}</div>
          <div className="mt-20 flex items-center gap-3"><Church className="text-[#976a30]"/><div><h3 className="bible-serif text-3xl font-bold">Churches, clergy & nonprofits</h3><p className="text-sm text-[#687971]">More capacity and team tools through verified ministry pricing.</p></div></div><div className="mt-7 grid gap-5 lg:grid-cols-3">{ministryPlans.map(plan=><PlanCard key={plan.name} plan={plan}/>)}</div>
          <div className="mt-20 flex items-center gap-3"><BriefcaseBusiness className="text-[#976a30]"/><div><h3 className="bible-serif text-3xl font-bold">Faith-led businesses</h3><p className="text-sm text-[#687971]">Commercial workspaces, team administration, and higher-capacity AI.</p></div></div><div className="mt-7 grid gap-5 lg:grid-cols-3">{businessPlans.map(plan=><PlanCard key={plan.name} plan={plan}/>)}</div>
        </div>
      </section>

      <section id="safety" className="px-4 py-20 sm:px-6 lg:px-10"><div className="mx-auto grid max-w-[1420px] gap-8 rounded-[34px] bg-[#fffdf8] p-7 shadow-[0_20px_60px_rgba(33,76,65,.08)] sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:p-14"><div><ShieldCheck className="text-[#4f7c6b]" size={34}/><p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#95682d]">A clear and honest promise</p><h2 className="bible-serif mt-3 text-4xl font-bold">Technology should support care—not impersonate it.</h2></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[#edf2ee] p-5"><HeartHandshake className="text-[#507867]"/><h3 className="mt-4 font-bold">Support with boundaries</h3><p className="mt-2 text-sm leading-6 text-[#5e7069]">This app offers Scripture-based reflection and pastoral-style support. It is not licensed therapy, medical advice, or emergency care.</p></div><div className="rounded-2xl bg-[#f5eee1] p-5"><ShieldCheck className="text-[#a27234]"/><h3 className="mt-4 font-bold">Private by design</h3><p className="mt-2 text-sm leading-6 text-[#5e7069]">Church and business administrators will not automatically receive access to a member’s private counseling conversations.</p></div></div></div></section>

      <section id="early-access" className="bg-[#214c41] px-4 py-16 text-center text-white sm:px-6"><BookHeart className="mx-auto text-[#e7c681]" size={36}/><h2 className="bible-serif mt-5 text-4xl font-bold">A more thoughtful way to open the conversation.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-white/70">The web experience is being built first. This same introduction, account model, and plan structure will guide the Android app when mobile development begins.</p><a href="#top" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#eeddb6] px-6 py-3.5 font-bold text-[#214c41]">Return to the beginning<ArrowRight size={17}/></a></section>

      <footer className="bg-[#15372f] px-4 py-8 text-white/60 sm:px-6 lg:px-10"><div className="mx-auto flex max-w-[1420px] flex-col justify-between gap-4 text-xs sm:flex-row"><p>© 2026 Blended Works. BlendedWorks AI Bible.</p><p>Faith-centered support • Responsible AI • Human care still matters</p></div></footer>
    </main>
  );
}
