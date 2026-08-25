import type { ProductDefinition } from "./types";

export const products = [
  {
    id: "business-composer",
    name: "Business Composer",
    description:
      "A central hub for business operations, clients, projects, and financials.",
    status: "active",
    localUrl: "http://localhost:3002",
    environmentVariable: "NEXT_PUBLIC_BUSINESS_COMPOSER_URL",
    iconPath: "/app-icons/business-composer.png",
  },
] as const satisfies readonly ProductDefinition[];

export type ProductId = (typeof products)[number]["id"];

export function getProduct(productId: ProductId) {
  return products.find((product) => product.id === productId);
}
