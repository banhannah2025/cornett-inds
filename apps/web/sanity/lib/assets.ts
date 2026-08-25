import "server-only";

import { sanityClient } from "./client";

export type SanityImageAsset = {
  _id: string;
  url: string;
  originalFilename?: string;
  width?: number;
  height?: number;
};

export async function getImageAssets() {
  try {
    return await sanityClient.fetch<SanityImageAsset[]>(
      `*[_type == "sanity.imageAsset"] | order(_createdAt desc)[0...48] {
        _id, url, originalFilename,
        "width": metadata.dimensions.width,
        "height": metadata.dimensions.height
      }`,
      {},
      { cache: "no-store" },
    );
  } catch {
    return [];
  }
}
