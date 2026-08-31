"use client";

import { UserButton } from "@clerk/nextjs";
import { BookHeart, BookOpenText, Bot, Feather, FolderOpen, HeartHandshake, Home, LoaderCircle, MessageCircleHeart, Plus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Mode = "conversation" | "counsel" | "writing" | "testimonial" | "deep";
type Message = { role: "user" | "assistant"; content: string };
type Project = { id: number; name: string; entries: string[] };

const freePlan = { label: "Free", credits: 50, folders: false, writing: false, testimonial: false };
const planDetails: Record<string, { label: string; credits: number; folders: boolean; writing: boolean; testimonial: boolean }> = {
  free: freePlan,
  plus: { label: "Plus", credits: 500, folders: true, writing: true, testimonial: false },
  premium: { label: "Premium", credits: 1500, folders: true, writing: true, testimonial: true },
  family: { label: "Family", credits: 3000, folders: true, writing: true, testimonial: true },
  clergy: { label: "Clergy Individual", credits: 1000, folders: true, writing: true, testimonial: true },
  ministryStarter: { label: "Ministry Starter", credits: 3000, folders: true, writing: true, testimonial: true },
  ministryPlus: { label: "Ministry Plus", credits: 10000, folders: true, writing: true, testimonial: true },
  businessSolo: { label: "Business Solo", credits: 1500, folders: true, writing: true, testimonial: true },
  businessTeam: { label: "Business Team", credits: 5000, folders: true, writing: true, testimonial: true },
  businessPro: { label: "Business Pro", credits: 15000, folders: true, writing: true, testimonial: true },
};

const modes: { id: Mode; label: string; description: string; icon: typeof Bot; paid?: boolean; testimonial?: boolean }[] = [
  { id: "conversation", label: "Conversational Bible", description: "Ask and explore Scripture", icon: BookOpenText },
  { id: "counsel", label: "Faith guidance", description: "Reflect with biblical support", icon: HeartHandshake },
  { id: "writing", label: "Religious writing", description: "Draft prayers, studies, and sermons", icon: Feather, paid: true },
  { id: "testimonial", label: "Testimonial drafting", description: "Shape a testimony with care", icon: Sparkles, paid: true, testimonial: true },
  { id: "deep", label: "Deep study", description: "Use stronger reasoning for complex study", icon: BookHeart, paid: true },
];

export function AiBibleWorkspace({ firstName, initialPlan, initialUsedCredits }: { firstName: string; initialPlan: string; initialUsedCredits: number }) {
  const plan = planDetails[initialPlan] ?? freePlan;
  const [mode, setMode] = useState<Mode>("conversation");
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedCredits, setUsedCredits] = useState(initialUsedCredits);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [showProjects, setShowProjects] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("blendedworks-ai-bible-projects");
      if (saved) setProjects(JSON.parse(saved) as Project[]);
    } catch { localStorage.removeItem("blendedworks-ai-bible-projects"); }
  }, []);

  useEffect(() => {
    if (plan.folders) localStorage.setItem("blendedworks-ai-bible-projects", JSON.stringify(projects));
  }, [plan.folders, projects]);

  const activeMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0]!, [mode]);
  const modeAllowed = (item: (typeof modes)[number]) => !item.paid || (plan.writing && (!item.testimonial || plan.testimonial));

  const send = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setError(""); setPrompt(""); setLoading(true);
    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    try {
      const response = await fetch("/api/ai-bible/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, prompt: trimmed, history: messages.slice(-8) }) });
      const data = await response.json() as { answer?: string; error?: string; creditsUsed?: number; monthlyUsed?: number };
      if (!response.ok || !data.answer) throw new Error(data.error ?? "The response could not be completed.");
      setMessages([...nextMessages, { role: "assistant", content: data.answer }]);
      if (typeof data.monthlyUsed === "number") setUsedCredits(data.monthlyUsed);
      else setUsedCredits((value) => value + (data.creditsUsed ?? 1));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong."); }
    finally { setLoading(false); }
  };

  const addProject = () => {
    const name = projectName.trim();
    if (!name || !plan.folders) return;
    setProjects((current) => [{ id: Date.now(), name, entries: [] }, ...current]); setProjectName("");
  };

  return (
    <main className="min-h-screen bg-[#f4f0e8] text-[#172536]">
      <header className="border-b border-[#24364b]/15 bg-[#fbf8f1]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4"><Link className="flex items-center gap-3" href="/apps/blendedworks-ai-bible"><span className="grid size-10 place-items-center rounded-xl bg-[#24364b] text-[#f4d8b4]"><BookHeart size={21}/></span><span><strong className="font-serif text-lg">BlendedWorks AI Bible</strong><small className="block text-[10px] font-bold uppercase tracking-[.18em] text-[#80623e]">Your private workspace</small></span></Link><div className="flex items-center gap-3"><span className="hidden rounded-full bg-[#e9e1d3] px-3 py-1.5 text-xs font-bold sm:block">{plan.label} • {Math.max(0, plan.credits - usedCredits).toLocaleString()} credits left</span><UserButton /></div></div>
      </header>
      <div className="mx-auto grid max-w-[1500px] md:grid-cols-[260px_1fr]">
        <aside className="border-b border-[#24364b]/15 bg-[#e9e1d3]/75 p-4 md:min-h-[calc(100vh-65px)] md:border-b-0 md:border-r md:p-5"><p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7e6240]">Choose a space</p><nav className="grid gap-1 sm:grid-cols-2 md:grid-cols-1">{modes.map((item) => { const Icon=item.icon, allowed=modeAllowed(item); return <button className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${mode===item.id?"bg-[#24364b] text-white":"hover:bg-white/70"} ${allowed?"":"opacity-50"}`} disabled={!allowed} key={item.id} onClick={()=>{setMode(item.id);setShowProjects(false)}}><Icon size={18}/><span><b className="block text-sm">{item.label}</b><small className={`block text-[10px] ${mode===item.id?"text-white/60":"text-[#5a6570]"}`}>{allowed?item.description:"Upgrade required"}</small></span></button>})}<button className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${showProjects?"bg-[#24364b] text-white":"hover:bg-white/70"} ${plan.folders?"":"opacity-50"}`} disabled={!plan.folders} onClick={()=>setShowProjects(true)}><FolderOpen size={18}/><span><b className="block text-sm">Project folders</b><small className={`block text-[10px] ${showProjects?"text-white/60":"text-[#5a6570]"}`}>{plan.folders?"Organize your work":"Available with Plus"}</small></span></button></nav><Link className="mt-6 flex items-center gap-2 px-3 text-xs font-bold text-[#7c5b34]" href="/apps/blendedworks-ai-bible"><Home size={15}/>Plans and information</Link></aside>
        <section className="min-w-0 p-4 sm:p-7 lg:p-10">
          {showProjects ? <div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#976a30]">Your organized work</p><h1 className="mt-2 font-serif text-4xl font-bold">Project folders</h1><div className="mt-7 flex gap-2"><input className="h-11 flex-1 rounded-xl border border-[#24364b]/20 bg-white px-4 outline-[#24364b]" onChange={e=>setProjectName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProject()} placeholder="New project name" value={projectName}/><button className="flex items-center gap-2 rounded-xl bg-[#24364b] px-5 font-bold text-white" onClick={addProject}><Plus size={17}/>Add</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map(project=><article className="rounded-2xl border border-[#24364b]/15 bg-white p-5" key={project.id}><FolderOpen className="text-[#a45d2d]"/><h2 className="mt-5 font-serif text-xl font-bold">{project.name}</h2><p className="mt-2 text-xs text-[#5a6570]">{project.entries.length} saved items</p></article>)}{projects.length===0&&<p className="col-span-full rounded-2xl border border-dashed border-[#24364b]/25 p-8 text-center text-[#5a6570]">Create a folder for a Bible study, sermon series, devotional collection, or testimony.</p>}</div></div> : <div className="mx-auto flex min-h-[calc(100vh-145px)] max-w-5xl flex-col"><div className="flex flex-col justify-between gap-4 border-b border-[#24364b]/15 pb-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#976a30]">Welcome, {firstName}</p><h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{activeMode.label}</h1><p className="mt-2 text-sm text-[#5a6570]">{activeMode.description}</p></div><span className="w-fit rounded-full bg-[#e8dfcf] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#735632]">Private conversation</span></div><div className="flex-1 space-y-4 py-6">{messages.length===0?<div className="grid min-h-72 place-items-center text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e7ddd0] text-[#24364b]"><MessageCircleHeart size={29}/></span><h2 className="mt-5 font-serif text-2xl font-bold">What would you like to explore?</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#5a6570]">Ask about a passage, share what you are walking through, or begin something you want to write.</p></div></div>:messages.map((message,index)=><article className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 sm:px-5 ${message.role==="user"?"ml-auto bg-[#24364b] text-white":"border border-[#24364b]/12 bg-white text-[#344252]"}`} key={`${message.role}-${index}`}>{message.content}</article>)}{loading&&<div className="flex items-center gap-2 text-sm text-[#5a6570]"><LoaderCircle className="animate-spin" size={17}/>Considering your question...</div>}{error&&<p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}</div><div className="sticky bottom-0 rounded-2xl border border-[#24364b]/15 bg-[#fbf8f1] p-3 shadow-[0_18px_50px_rgba(36,54,75,.12)]"><textarea className="min-h-20 w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#79828a]" maxLength={8000} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send()}}} placeholder="Ask a question or share what is on your heart..." value={prompt}/><div className="flex items-center justify-between gap-3 border-t border-[#24364b]/10 pt-3"><p className="text-[10px] leading-4 text-[#6b747c]">AI can make mistakes. For urgent danger, call 911; for a mental-health crisis in the U.S., call or text 988.</p><button className="flex shrink-0 items-center gap-2 rounded-xl bg-[#24364b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40" disabled={!prompt.trim()||loading} onClick={()=>void send()}>{loading?<LoaderCircle className="animate-spin" size={16}/>:<Send size={16}/>}Send</button></div></div></div>}
        </section>
      </div>
    </main>
  );
}
