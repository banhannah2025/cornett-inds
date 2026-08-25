import type { PlatformRole, ProductAccessGrant } from "./types";

export const platformRoles: Record<
  PlatformRole,
  { label: string; description: string }
> = {
  platform_owner: {
    label: "Platform owner",
    description: "Full access across Blended Works and every product.",
  },
  platform_team: {
    label: "Platform team",
    description: "Operates internal and demonstration workspaces.",
  },
  demo_viewer: {
    label: "Demo viewer",
    description: "Can safely explore assigned demonstration workspaces.",
  },
  client_admin: {
    label: "Client administrator",
    description: "Manages a client workspace and its members.",
  },
  client_member: {
    label: "Client member",
    description: "Uses enabled products inside an assigned client workspace.",
  },
};

export const initialAccessGrants: readonly ProductAccessGrant[] = [
  {
    workspaceId: "blended-works",
    productId: "business-composer",
    roles: ["platform_owner", "platform_team"],
  },
  {
    workspaceId: "blended-works-demo",
    productId: "business-composer",
    roles: ["platform_owner", "platform_team", "demo_viewer"],
  },
];

export type PlatformAdministratorIdentity = {
  emailAddress?: string | null;
  emailVerified?: boolean;
};

export function parsePlatformAdministratorEmails(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdministrator(
  identity: PlatformAdministratorIdentity,
  configuredEmails: readonly string[],
) {
  if (!identity.emailVerified || !identity.emailAddress) return false;
  return configuredEmails.includes(identity.emailAddress.trim().toLowerCase());
}
