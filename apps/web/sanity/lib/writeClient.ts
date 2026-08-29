import "server-only";

import { createClient } from "@sanity/client";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "./client";

export function getSanityWriteClient() {
  const token =
    process.env.SANITY_API_WRITE_TOKEN ??
    process.env.SANITY_READ_WRITE_DEVELOPER_API;
  if (!token)
    throw new Error("Sanity write token is not configured on the web server.");

  return createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    useCdn: false,
    token,
  });
}
