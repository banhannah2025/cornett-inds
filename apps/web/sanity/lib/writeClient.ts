import "server-only";

import { createClient } from "@sanity/client";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "./client";

function makeClient(token: string) {
  return createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    useCdn: false,
    token,
  });
}

export function getSanityWriteClients() {
  const tokens = [
    process.env.SANITY_EDITOR_API_KEY,
    process.env.SANITY_API_WRITE_TOKEN,
    process.env.SANITY_READ_WRITE_DEVELOPER_API,
  ].filter((token): token is string => Boolean(token?.trim()));

  const uniqueTokens = [...new Set(tokens.map((token) => token.trim()))];
  if (!uniqueTokens.length) {
    throw new Error("Sanity editor/write token is not configured on the web server.");
  }

  return uniqueTokens.map(makeClient);
}

export function getSanityWriteClient() {
  return getSanityWriteClients()[0]!;
}

export function sanityWriteTarget() {
  return { projectId: sanityProjectId, dataset: sanityDataset };
}
