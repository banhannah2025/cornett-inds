import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { getAdminContext } from "@/lib/admin";

type Mode = "conversation" | "counsel" | "writing" | "testimonial" | "deep";
type HistoryItem = { role: "user" | "assistant"; content: string };

const freePlan = { credits: 50, writing: false, testimonial: false, enhanced: false };
const plans: Record<string, { credits: number; writing: boolean; testimonial: boolean; enhanced: boolean }> = {
  free: freePlan,
  plus: { credits: 500, writing: true, testimonial: false, enhanced: false },
  premium: { credits: 1500, writing: true, testimonial: true, enhanced: true },
  family: { credits: 3000, writing: true, testimonial: true, enhanced: true },
  clergy: { credits: 1000, writing: true, testimonial: true, enhanced: true },
  ministryStarter: { credits: 3000, writing: true, testimonial: true, enhanced: true },
  ministryPlus: { credits: 10000, writing: true, testimonial: true, enhanced: true },
  businessSolo: { credits: 1500, writing: true, testimonial: true, enhanced: true },
  businessTeam: { credits: 5000, writing: true, testimonial: true, enhanced: true },
  businessPro: { credits: 15000, writing: true, testimonial: true, enhanced: true },
};

const costs: Record<Mode, number> = { conversation: 1, counsel: 2, writing: 2, testimonial: 3, deep: 5 };

const systemPrompts: Record<Mode, string> = {
  conversation: "You are the BlendedWorks AI Bible, a careful Scripture study companion. Answer clearly, cite relevant Bible passages, distinguish quotation from interpretation, and acknowledge legitimate denominational differences. Never claim divine authority or revelation.",
  counsel: "You provide compassionate, Scripture-centered pastoral-style reflection. Listen without judgment, offer relevant biblical principles, and encourage appropriate support from trusted clergy or qualified professionals. You are not a therapist, doctor, lawyer, or emergency service. Never use spiritual pressure, claim God told you something, or blame suffering on insufficient faith.",
  writing: "Help draft Christian religious writing such as devotionals, prayers, Bible studies, lessons, and sermons. Preserve the user's intended voice, label Scripture references accurately, avoid fabricated quotations, and produce an editable draft rather than claiming divine inspiration.",
  testimonial: "Help the user draft a respectful Christian testimony. Preserve their facts and voice, never invent experiences, do not sensationalize trauma, and flag placeholders where details are needed. Protect the privacy of other people mentioned.",
  deep: "Provide a careful, structured Bible study using literary context, historical context where well established, cross-references, interpretation options, application, and questions for further reflection. Clearly separate biblical text, scholarly context, and your synthesis.",
};

const crisisPattern = /\b(suicide|kill myself|end my life|self[- ]?harm|hurt myself|no reason to live)\b/i;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please log in to continue." }, { status: 401 });

  const body = await request.json().catch(() => null) as { mode?: Mode; prompt?: string; history?: HistoryItem[] } | null;
  const mode = body?.mode;
  const prompt = body?.prompt?.trim();
  if (!mode || !(mode in costs) || !prompt || prompt.length > 8000) return Response.json({ error: "Please enter a valid message." }, { status: 400 });

  if (crisisPattern.test(prompt)) {
    return Response.json({ answer: "I’m really glad you said something. You deserve immediate human support right now. If you may act on these thoughts or are in immediate danger, call 911 or go to the nearest emergency department. In the United States, call or text 988 to reach the Suicide & Crisis Lifeline. If you can, move away from anything you could use to hurt yourself and contact a trusted person who can stay with you. I can remain part of the conversation, but I cannot provide the urgent, real-world help you deserve.", creditsUsed: 0, monthlyUsed: 0 });
  }

  const [user, admin] = await Promise.all([currentUser(), getAdminContext()]);
  const planKey = typeof user?.publicMetadata.aiBiblePlan === "string" ? user.publicMetadata.aiBiblePlan : "free";
  const plan = admin.isAdmin ? { credits: Number.POSITIVE_INFINITY, writing: true, testimonial: true, enhanced: true } : plans[planKey] ?? freePlan;
  if ((mode === "writing" || mode === "deep") && !plan.writing) return Response.json({ error: "This feature requires a Plus or organizational plan." }, { status: 403 });
  if (mode === "testimonial" && !plan.testimonial) return Response.json({ error: "Testimonial drafting is available on eligible clergy, organization, and premium plans." }, { status: 403 });

  const month = new Date().toISOString().slice(0, 7);
  const stored = user?.privateMetadata.aiBibleUsage as { month?: string; used?: number } | undefined;
  const alreadyUsed = stored?.month === month && typeof stored.used === "number" ? stored.used : 0;
  const cost = costs[mode];
  if (!admin.isAdmin && alreadyUsed + cost > plan.credits) return Response.json({ error: "You have used this month’s AI credits. Your credits will reset next month, or you can choose a higher plan." }, { status: 429 });

  const apiKey = process.env.OPENAI_API_SECRET_KEY;
  if (!apiKey) return Response.json({ error: "AI service configuration is not complete yet." }, { status: 503 });

  const history = Array.isArray(body?.history) ? body.history.filter((item): item is HistoryItem => (item.role === "user" || item.role === "assistant") && typeof item.content === "string").slice(-8) : [];
  const model = plan.enhanced || mode === "deep" ? "gpt-5.6-terra" : "gpt-5.6-luna";
  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, reasoning: { effort: mode === "deep" ? "medium" : "low" }, max_output_tokens: mode === "writing" || mode === "testimonial" || mode === "deep" ? 2200 : 1200, input: [{ role: "system", content: systemPrompts[mode] }, ...history, { role: "user", content: prompt }] }),
  });

  const data = await openAiResponse.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
  if (!openAiResponse.ok) return Response.json({ error: data.error?.message ?? "The AI service could not complete this response." }, { status: 502 });
  const answer = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!answer) return Response.json({ error: "The AI service returned an empty response." }, { status: 502 });

  const monthlyUsed = alreadyUsed + cost;
  if (!admin.isAdmin) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, { privateMetadata: { ...user?.privateMetadata, aiBibleUsage: { month, used: monthlyUsed } } });
  }
  return Response.json({ answer, creditsUsed: admin.isAdmin ? 0 : cost, monthlyUsed: admin.isAdmin ? alreadyUsed : monthlyUsed, model, administratorAccess: admin.isAdmin });
}
