import { createClient } from "@sanity/client";
import process from "node:process";

const token =
  process.env.SANITY_API_WRITE_TOKEN ??
  process.env.SANITY_READ_WRITE_DEVELOPER_API;
if (!token) throw new Error("Missing Sanity write token.");

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
  "Sanity API readiness check passed: write credentials are valid and the dry-run was accepted.",
);
