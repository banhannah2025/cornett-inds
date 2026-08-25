import type { WorkspaceTemplate } from "./types";

export const workspaceTemplates = [
  {
    id: "business-operations-base",
    name: "Business Operations Base",
    description: "The internal operating model used by Blended Works.",
    productId: "business-composer",
    enabledModules: [
      "overview",
      "businesses",
      "clients",
      "projects",
      "tasks",
      "financials",
    ],
  },
  {
    id: "business-composer-demo",
    name: "Business Composer Sales Demo",
    description:
      "A resettable product demonstration with safe synthetic business data.",
    productId: "business-composer",
    enabledModules: [
      "overview",
      "businesses",
      "clients",
      "projects",
      "tasks",
      "financials",
    ],
    demoDataSet: "business-composer-standard-demo-v1",
  },
] as const satisfies readonly WorkspaceTemplate[];
