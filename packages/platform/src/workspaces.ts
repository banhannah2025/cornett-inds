import type { WorkspaceDefinition } from "./types";

export const workspaces = [
  {
    id: "blended-works",
    slug: "blended-works",
    name: "Blended Works",
    kind: "internal",
    status: "active",
    templateId: "business-operations-base",
    enabledProductIds: ["business-composer"],
    branding: { initials: "BW", accentColor: "#224c3a" },
  },
  {
    id: "blended-works-demo",
    slug: "demo-company",
    name: "Demo Company",
    kind: "demo",
    status: "active",
    templateId: "business-composer-demo",
    enabledProductIds: ["business-composer"],
    branding: { initials: "DC", accentColor: "#d69a55" },
    resettable: true,
  },
] as const satisfies readonly WorkspaceDefinition[];

export type WorkspaceId = (typeof workspaces)[number]["id"];

export function getWorkspace(workspaceId: WorkspaceId) {
  return workspaces.find((workspace) => workspace.id === workspaceId);
}
