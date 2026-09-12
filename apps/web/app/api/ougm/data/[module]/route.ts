import { randomUUID } from "node:crypto";
import { getOugmAccess } from "@/lib/ougm/auth";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";
import { validateCalendar, validateSpiritual } from "@/lib/ougm/validation";
export const dynamic = "force-dynamic";
type Doc = { _id: string; _rev: string; payload: string; updatedAt: string };
async function context(params: Promise<{ module: string }>) {
  const access = await getOugmAccess();
  const { module } = await params;
  return access && ["calendar", "spiritual-outcomes"].includes(module)
    ? { access, module }
    : null;
}
function response(error: unknown) {
  const status = (error as { statusCode?: number }).statusCode;
  if (status === 409)
    return Response.json(
      {
        error:
          "This record changed since you opened it. Reload the saved version before saving again.",
      },
      { status: 409 },
    );
  return Response.json(
    {
      error:
        "OUGM records could not be accessed. Check the server Sanity write configuration and try again.",
    },
    { status: 503 },
  );
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  const ctx = await context(params);
  if (!ctx)
    return Response.json(
      { error: "OUGM access is required." },
      { status: 403 },
    );
  try {
    const client = getSanityWriteClient();
    if (ctx.module === "calendar") {
      const doc = await client.fetch<Doc | null>(
        ' *[_id == "ougm.calendar" && _type == "ougmCalendar"][0]{_id,_rev,payload,updatedAt}',
      );
      return Response.json(
        {
          data: doc ? JSON.parse(doc.payload) : [],
          revision: doc?._rev || null,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const docs = await client.fetch<Doc[]>(
      '*[_type == "ougmSpiritualOutcomes"] | order(updatedAt desc){_id,_rev,payload,updatedAt}',
    );
    return Response.json(
      {
        reports: docs.map((doc) => ({
          id: doc._id,
          revision: doc._rev,
          values: JSON.parse(doc.payload),
          updatedAt: doc.updatedAt,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return response(error);
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  const ctx = await context(params);
  if (!ctx)
    return Response.json(
      { error: "OUGM access is required." },
      { status: 403 },
    );
  let body: { data?: unknown; id?: string; revision?: string | null };
  let data: unknown;
  try {
    const text = await request.text();
    if (text.length > 500000)
      return Response.json(
        { error: "The record is too large." },
        { status: 413 },
      );
    body = JSON.parse(text);
    if (!body || typeof body !== "object") throw new Error("Invalid request.");
    data =
      ctx.module === "calendar"
        ? validateCalendar(body.data)
        : validateSpiritual(body.data);
    if (
      body.revision !== undefined &&
      body.revision !== null &&
      (typeof body.revision !== "string" || body.revision.length > 100)
    )
      throw new Error("Invalid record revision.");
    if (
      ctx.module === "spiritual-outcomes" &&
      body.id &&
      !/^ougmSpiritualOutcomes\.[a-f0-9-]{36}$/.test(body.id)
    )
      throw new Error("Invalid report ID.");
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid record." },
      { status: 400 },
    );
  }
  try {
    const client = getSanityWriteClient();
    const id =
      ctx.module === "calendar"
        ? "ougm.calendar"
        : body.id || `ougmSpiritualOutcomes.${randomUUID()}`;
    const type =
      ctx.module === "calendar" ? "ougmCalendar" : "ougmSpiritualOutcomes";
    const existing = await client.fetch<Doc | null>(
      "*[_id == $id && _type == $type][0]{_id,_rev}",
      { id, type },
    );
    if (existing && body.revision !== existing._rev)
      return Response.json(
        {
          error:
            "This record changed. Reload the saved version before saving again.",
        },
        { status: 409 },
      );
    if (!existing && body.revision)
      return Response.json(
        { error: "This record was deleted. Reload before saving." },
        { status: 409 },
      );
    const fields = {
      payload: JSON.stringify(data),
      updatedAt: new Date().toISOString(),
      updatedBy: ctx.access.userId,
    };
    const saved = existing
      ? await client.patch(id).ifRevisionId(existing._rev).set(fields).commit()
      : await client.create({ _id: id, _type: type, ...fields });
    return Response.json({
      id: saved._id,
      revision: saved._rev,
      updatedAt: saved.updatedAt,
    });
  } catch (error) {
    return response(error);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  const ctx = await context(params);
  if (!ctx || ctx.module !== "spiritual-outcomes")
    return Response.json({ error: "Unsupported operation." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  const revision = new URL(request.url).searchParams.get("revision");
  if (!id || !/^ougmSpiritualOutcomes\.[a-f0-9-]{36}$/.test(id) || !revision)
    return Response.json({ error: "Select a saved report." }, { status: 400 });
  try {
    const client = getSanityWriteClient();
    const doc = await client.fetch<Doc | null>(
      '*[_id == $id && _type == "ougmSpiritualOutcomes"][0]{_id,_rev}',
      { id },
    );
    if (!doc || doc._rev !== revision)
      return Response.json(
        { error: "The report changed or was deleted. Reload saved reports." },
        { status: 409 },
      );
    await client
      .transaction()
      .patch(id, (p) =>
        p.ifRevisionId(revision).set({ updatedAt: new Date().toISOString() }),
      )
      .delete(id)
      .commit();
    return Response.json({ deleted: true });
  } catch (error) {
    return response(error);
  }
}
