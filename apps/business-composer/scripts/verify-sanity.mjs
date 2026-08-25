import { createClient } from "@sanity/client";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const token =
  process.env.SANITY_API_WRITE_TOKEN ??
  process.env.SANITY_READ_WRITE_DEVELOPER_API;
if (!token) throw new Error("Missing Sanity write token.");

const schemaPath = resolve("../web/sanity/schemaTypes/devotional.ts");
const registryPath = resolve("../web/sanity/schemaTypes/index.ts");
const [schema, registry] = await Promise.all([
  readFile(schemaPath, "utf8"),
  readFile(registryPath, "utf8"),
]);
for (const field of [
  "title",
  "slug",
  "publishedAt",
  "scriptureReference",
  "scriptureText",
  "excerpt",
  "body",
  "prayer",
]) {
  if (!schema.includes(`name: "${field}"`))
    throw new Error(`Devotional schema is missing ${field}.`);
}
if (!registry.includes("devotionalType"))
  throw new Error("Devotional schema is not registered.");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "a9iipjbg",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-08-11",
  useCdn: false,
  token,
});
const testId = `sanity-readiness-${Date.now()}`;
const response = await client.create(
  {
    _id: testId,
    _type: "devotional",
    title: "Sanity readiness check",
    slug: { _type: "slug", current: testId },
    excerpt: "Non-persistent validation document.",
    publishedAt: new Date().toISOString(),
    scriptureReference: "Psalm 46:10",
    scriptureText: "Be still.",
    body: [
      {
        _type: "block",
        _key: "check",
        style: "normal",
        markDefs: [],
        children: [
          { _type: "span", _key: "text", text: "Readiness check.", marks: [] },
        ],
      },
    ],
    prayer: "Amen.",
  },
  { dryRun: true },
);
if (response._id !== testId)
  throw new Error("Sanity dry-run did not return the expected document.");
console.log(
  "Sanity readiness check passed: schema registered, required fields present, query/write credentials valid, dry-run accepted.",
);
