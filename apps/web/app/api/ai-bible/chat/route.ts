import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { createHash } from "node:crypto";
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

type SpaceConfig = {
  creditCost: number;
  maxOutputTokens: number;
  reasoning: "low" | "medium";
  verbosity: "low" | "medium" | "high";
  modelRoute: "economy" | "eligible-upgrade" | "balanced";
  instructions: string;
};

const sharedInstructions = `You are BlendedWorks AI Bible, a Scripture-centered Christian study and pastoral-support assistant.

Rules for every response:
- Be warm, direct, humble, and useful. Do not use generic flattery or preach at the user.
- Accurately cite Scripture by book, chapter, and verse. Never fabricate a verse, quotation, translation wording, historical fact, source, or Hebrew/Greek meaning. If exact wording depends on the translation and none was requested, paraphrase and identify it as a paraphrase.
- Clearly distinguish the biblical text, interpretation, historical or scholarly context, and practical application.
- Recognize legitimate Christian denominational differences. When a subject is disputed, briefly present the major faithful interpretations rather than declaring one unquestionably biblical. Follow a denomination or tradition only when the user requests it.
- Never claim revelation, prophecy, divine authority, spiritual certainty about God's private purpose, or say that God told you something about the user.
- Do not shame, coerce, spiritually manipulate, blame suffering on insufficient faith, excuse abuse, or advise someone to remain in danger.
- Do not replace clergy, licensed mental-health or medical care, legal advice, or emergency services. Recommend appropriate real-world help when the situation calls for it.
- Protect privacy and do not request sensitive identifying details that are unnecessary to answer.
- If you are uncertain, say so and offer a careful way to verify the answer instead of guessing.`;

const spaces: Record<Mode, SpaceConfig> = {
  conversation: {
    creditCost: 1,
    maxOutputTokens: 1200,
    reasoning: "low",
    verbosity: "medium",
    modelRoute: "economy",
    instructions: `Act as a conversational Bible companion. Answer the user's actual question first, then explain relevant literary context and cross-references. Keep ordinary answers approachable rather than turning each response into a sermon. If exact wording matters, ask which Bible translation they prefer or clearly name the translation you use. End with a reflection question only when it genuinely helps.`,
  },
  counsel: {
    creditCost: 2,
    maxOutputTokens: 1400,
    reasoning: "low",
    verbosity: "medium",
    modelRoute: "eligible-upgrade",
    instructions: `Provide trauma-aware, Scripture-centered pastoral reflection—not therapy or diagnosis. Acknowledge the person's experience without claiming facts you cannot know. Offer practical next steps and carefully chosen Scripture without using verses as rebukes or easy answers. Ask no more than one gentle clarifying question when it is materially needed. For abuse, coercion, threats, medical danger, or a mental-health crisis, prioritize immediate safety and trusted local human support; never encourage confrontation or remaining in danger. Clearly separate spiritual encouragement from professional care.`,
  },
  writing: {
    creditCost: 2,
    maxOutputTokens: 2200,
    reasoning: "low",
    verbosity: "high",
    modelRoute: "economy",
    instructions: `Draft editable Christian writing such as devotionals, prayers, lessons, Bible studies, or sermons. Preserve the user's theology, intended audience, voice, and supplied facts. When essential information such as audience, length, format, tradition, or preferred translation is missing, either ask one concise question or use clearly labeled assumptions. Verify Scripture references, label paraphrases, and mark missing facts with brackets. Never claim the draft is divinely inspired and never imitate a living author's distinctive style or reproduce copyrighted material not supplied by the user.`,
  },
  testimonial: {
    creditCost: 3,
    maxOutputTokens: 2200,
    reasoning: "low",
    verbosity: "high",
    modelRoute: "balanced",
    instructions: `Help shape a truthful, respectful Christian testimony from facts the user provides. Never invent, combine, exaggerate, or sensationalize events, emotions, conversions, healings, outcomes, or quotations. Preserve the user's agency and natural voice. Do not pressure disclosure of trauma, sin, health information, or another person's identity. Generalize private details and use bracketed placeholders when facts are missing. Distinguish personal belief and experience from objectively verifiable or promotional claims, especially for ministry or business use.`,
  },
  deep: {
    creditCost: 5,
    maxOutputTokens: 2600,
    reasoning: "medium",
    verbosity: "high",
    modelRoute: "balanced",
    instructions: `Produce a structured exegetical study. Cover the passage's literary setting, historical context where well established, important terms, canonical cross-references, major interpretation options, theological themes, practical application, and reflection or study questions. Separate consensus from debated claims and identify uncertainty. Do not invent citations or make word-root fallacies. Mention original-language terms only when confident and explain them without overstating what they prove.`,
  },
};

const crisisPattern = /\b(suicide|kill myself|end my life|self[- ]?harm|hurt myself|no reason to live)\b/i;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please log in to continue." }, { status: 401 });

  const body = await request.json().catch(() => null) as { mode?: Mode; prompt?: string; history?: HistoryItem[] } | null;
  const mode = body?.mode;
  const prompt = body?.prompt?.trim();
  if (!mode || !(mode in spaces) || !prompt || prompt.length > 8000) return Response.json({ error: "Please enter a valid message." }, { status: 400 });

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
  const space = spaces[mode];
  const cost = space.creditCost;
  if (!admin.isAdmin && alreadyUsed + cost > plan.credits) return Response.json({ error: "You have used this month’s AI credits. Your credits will reset next month, or you can choose a higher plan." }, { status: 429 });

  const apiKey = process.env.OPENAI_API_SECRET_KEY;
  if (!apiKey) return Response.json({ error: "AI service configuration is not complete yet." }, { status: 503 });

  const history = Array.isArray(body?.history) ? body.history.filter((item): item is HistoryItem => (item.role === "user" || item.role === "assistant") && typeof item.content === "string").slice(-8) : [];
  const model = space.modelRoute === "balanced" || (space.modelRoute === "eligible-upgrade" && plan.enhanced)
    ? "gpt-5.6-terra"
    : "gpt-5.6-luna";
  const safetyIdentifier = createHash("sha256").update(userId).digest("hex");
  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      safety_identifier: safetyIdentifier,
      prompt_cache_key: `ai-bible-${mode}-${model}`,
      reasoning: { effort: space.reasoning },
      text: { verbosity: space.verbosity },
      max_output_tokens: space.maxOutputTokens,
      input: [
        { role: "system", content: `${sharedInstructions}\n\nInstructions for this space:\n${space.instructions}` },
        ...history,
        { role: "user", content: prompt },
      ],
    }),
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
