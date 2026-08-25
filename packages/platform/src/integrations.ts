import type { IntegrationDefinition } from "./types";

export const integrations = [
  {
    id: "clerk",
    name: "Clerk",
    category: "identity",
    scope: "platform",
    status: "ready",
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "productivity",
    scope: "workspace",
    status: "planned",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "finance",
    scope: "workspace",
    status: "planned",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "finance",
    scope: "workspace",
    status: "planned",
  },
] as const satisfies readonly IntegrationDefinition[];
