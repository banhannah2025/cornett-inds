import Link from "next/link";
import { BookHeart, CalendarDays, ChevronDown, Code2, FilePenLine, Scale } from "lucide-react";
import { getCodeAiOwner } from "@/lib/code-ai/auth";

export async function AppsMenu({ dark = false }: { dark?: boolean }) {
  const codeAiOwner = await getCodeAiOwner();
  const plannerUrl =
    process.env.NEXT_PUBLIC_BLENDED_PLANNER_URL ??
    "https://blended-planner.specopsrecon82.chatgpt.site";
  const businessComposerUrl = process.env.NEXT_PUBLIC_BUSINESS_COMPOSER_URL;

  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold uppercase tracking-[0.14em] transition [&::-webkit-details-marker]:hidden ${dark ? "text-[#a45d2d] hover:text-[#1e2a24]" : "text-[#f4b860] hover:text-white"}`}
      >
        Apps
        <ChevronDown className="size-3.5 transition group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-full z-[60] mt-4 w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-black/10 bg-[#f6f3eb] p-2 text-[#1e2a24] shadow-2xl shadow-black/20">
        <Link
          className="flex gap-3 rounded-xl px-4 py-3 transition hover:bg-[#ebe7dc]"
          href="/apps/blendedworks-ai-bible"
        >
          <BookHeart className="mt-0.5 size-5 shrink-0 text-[#a45d2d]" />
          <span>
            <span className="block text-sm font-bold">BlendedWorks AI Bible</span>
            <span className="mt-1 block text-xs leading-5 text-[#657169]">
              Scripture conversation, faith guidance, and religious writing
            </span>
          </span>
        </Link>
        <Link
          className="flex gap-3 rounded-xl px-4 py-3 transition hover:bg-[#ebe7dc]"
          href={plannerUrl}
        >
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-[#a45d2d]" />
          <span>
            <span className="block text-sm font-bold">The Blended Planner</span>
            <span className="mt-1 block text-xs leading-5 text-[#657169]">
              Calendar and purpose-centered planning journal
            </span>
          </span>
        </Link>
        {businessComposerUrl ? (
          <Link
            className="flex gap-3 rounded-xl px-4 py-3 transition hover:bg-[#ebe7dc]"
            href={businessComposerUrl}
          >
            <FilePenLine className="mt-0.5 size-5 shrink-0 text-[#a45d2d]" />
            <span>
              <span className="block text-sm font-bold">Business Composer</span>
              <span className="mt-1 block text-xs leading-5 text-[#657169]">
                Build and organize practical business documents
              </span>
            </span>
          </Link>
        ) : null}
        <Link
          className="flex gap-3 rounded-xl px-4 py-3 transition hover:bg-[#ebe7dc]"
          href="/apps/legal-ai"
        >
          <Scale className="mt-0.5 size-5 shrink-0 text-[#a45d2d]" />
          <span>
            <span className="block text-sm font-bold">Legal AI</span>
            <span className="mt-1 block text-xs leading-5 text-[#657169]">
              AI-powered legal research, document support, and case workspace
            </span>
          </span>
        </Link>
        {codeAiOwner ? (
          <Link
            className="flex gap-3 rounded-xl border-t border-[#1e2a24]/10 px-4 py-3 transition hover:bg-[#ebe7dc]"
            href="/code-ai"
          >
            <Code2 className="mt-0.5 size-5 shrink-0 text-[#5d55b4]" />
            <span>
              <span className="block text-sm font-bold">Code AI</span>
              <span className="mt-1 block text-xs leading-5 text-[#657169]">
                Private website development workspace
              </span>
            </span>
          </Link>
        ) : null}
      </div>
    </details>
  );
}
